import logging

from drf_spectacular.utils import extend_schema
from oscar.core.loading import get_model
from rest_framework import generics
from rest_framework.exceptions import APIException
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from yookassa import Payment

from shop.order.enums import OrderStatus
from . import serializers

Order = get_model("order", "Order")

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
                "login_data",
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

    def post(self, request, order_number: str):
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


class OrderLoginDataView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.OrderLoginDataSerializer

    def perform_create(self, serializer):
        try:
            order_number = self.kwargs.get("order_number")
            order = Order.objects.get(number=order_number, user=self.request.user)
            serializer.save(order=order)
        except Order.DoesNotExist:
            raise APIException("Order does not exist")

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            serializer.data,
        )
