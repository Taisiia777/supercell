import logging

from django.utils import timezone
from drf_spectacular.utils import extend_schema
from oscar.core.loading import get_model
from rest_framework import generics, status
from rest_framework.exceptions import ParseError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from yookassa import Payment

from core.models import OrderLoginData
from shop.order.enums import OrderStatus
from . import serializers
from ..shop.serializers import ResponseStatusSerializer

Order = get_model("order", "Order")
OrderLine = get_model("order", "Line")

logger = logging.getLogger(__name__)


class OrdersListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.CustomerOrderListSerializer

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related(
                "lines",
                "lines__product",
                "lines__product__images",
                "lines__product__product_class",
                "lines__product__categories",
            )
            .select_related("shipping_address")
            .order_by("-pk")
        )

    def get(self, request):
        queryset = self.get_queryset()
        context = {"request": request}
        data = {"orders": queryset, "user": request.user}
        serializer = self.serializer_class(data, context=context)
        return Response(serializer.data)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.CustomerOrderDetailSerializer

    def get_queryset(self):
        number = self.kwargs.get("order_number")
        return (
            Order.objects.filter(user=self.request.user, number=number)
            .select_related("shipping_address")
            .prefetch_related(
                "lines",
                "lines__product",
                "lines__product__images",
                "lines__product__product_class",
                "lines__product__categories",
            )
            .first()
        )

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        context = {"request": request}
        data = {"order": queryset, "user": request.user}
        serializer = self.serializer_class(data, context=context)
        return Response(serializer.data)


class CustomerView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.CustomerSerializer

    @extend_schema(exclude=True)
    def put(self, request, *args, **kwargs):
        raise NotImplementedError()

    def get_object(self):
        return self.request.user


@extend_schema(responses=serializers.OrderPaymentStatusSerializer)
class ConfirmPaymentView(APIView):
    @staticmethod
    def check_payment_status(payment_id: str) -> bool:
        paid = False
        try:
            result = Payment.find_one(payment_id)
            if result.paid:
                paid = True
        except Exception as error:
            logger.exception("Could not get payment status: %s", error)
        return paid

    @staticmethod
    def payment_successful(order: Order):
        order.status = OrderStatus.PAID
        order.save(update_fields=["status"])

    def get(self, request, order_number: str):
        try:
            order = Order.objects.get(number=order_number)
        except Order.DoesNotExist:
            logger.info("Order does not exist: %s", order_number)
            return Response({"status": False})

        if order.status != OrderStatus.NEW or not order.payment_id:
            return Response({"status": False})

        if payment_status := self.check_payment_status(order.payment_id):
            self.payment_successful(order)

        return Response({"status": payment_status})


class OrderLoginDataView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.PutLoginDataSerializer

    def get_object(self) -> Order:
        if cached_order := getattr(self, "_order", None):
            return cached_order

        order_number = self.kwargs.get("order_number")
        order = (
            Order.objects.filter(number=order_number, user=self.request.user)
            .prefetch_related(
                "lines",
            )
            .first()
        )
        if order is None:
            raise ParseError("Order not found", code=status.HTTP_400_BAD_REQUEST)
        setattr(self, "_order", order)
        return order

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["order"] = self.get_object()
        return context

    @staticmethod
    def perform_create(serializer):
        now = timezone.now()
        login_data = [
            OrderLoginData(
                order_line_id=data["order_line"],
                account_id=data["account_id"],
                code=data["code"],
                created_dt=now,
            )
            for data in serializer.validated_data
        ]
        OrderLoginData.objects.bulk_create(login_data)

    @extend_schema(
        request=serializers.PutLoginDataSerializer(many=True),
        responses={
            200: ResponseStatusSerializer,
            400: None,
        },
    )
    def patch(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({"status": True})


class UpdateLoginDataView(APIView):
    serializer_class = serializers.UpdateLoginDataSerializer

    @staticmethod
    def perform_update(line: OrderLine, serializer):
        # изменить код для всех позиций заказа с таким же email
        login_data = line.login_data.first()
        if login_data is None:
            return

        new_code = serializer.validated_data["code"]
        email = login_data.account_id
        for local_line in line.order.lines.all():
            login_data = local_line.login_data.first()
            if login_data and login_data.account_id == email:
                OrderLoginData.objects.create(
                    order_line=local_line,
                    account_id=login_data.account_id,
                    code=new_code,
                )

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            line = OrderLine.objects.get(pk=serializer.validated_data["line_id"])
            self.perform_update(line, serializer)

            return Response({"status": True})
        except OrderLine.DoesNotExist:
            return Response({"status": False})
