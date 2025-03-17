import json
import logging

from django.http import HttpResponseRedirect
from django.utils import timezone
from django.conf import settings
from drf_spectacular.utils import extend_schema
from oscar.core.loading import get_model
from rest_framework import generics, status
from rest_framework.exceptions import ParseError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from yookassa import Payment
from yookassa.domain.common import SecurityHelper
from yookassa.domain.notification import (
    WebhookNotificationFactory,
    WebhookNotificationEventType,
)

from core.models import OrderLoginData
from shop.order.enums import OrderStatus
from . import serializers
from ..shop.serializers import ResponseStatusSerializer
from celery_app import app as celery_app
from api.permissions import OrderManagerPermission, ProductManagerPermission, AdminPermission
from .serializers import ProcessReferralSerializer, RegisterUserSerializer, ReferralLinkSerializer
from .utils import get_or_create_referral_code, get_referral_link
from django.shortcuts import get_object_or_404
from core.models import OrderReview

Order = get_model("order", "Order")
OrderLine = get_model("order", "Line")

logger = logging.getLogger(__name__)


class OrdersListView(APIView):
    permission_classes = []
    # permission_classes = [IsAuthenticated]
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
    permission_classes = []
    # permission_classes = [IsAuthenticated, OrderManagerPermission, AdminPermission]
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
    # permission_classes = [IsAuthenticated]
    permission_classes = []

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
            payment = Payment.find_one(payment_id)
            if payment.status == "succeeded":
                paid = True
        except Exception as error:
            logger.exception("Could not get payment status: %s", error)
        return paid

    @staticmethod
    def payment_successful(order: Order):
        order.status = OrderStatus.PAID
        order.save(update_fields=["status"])

    def get(self, request, order_number: str):
        frontend_host = settings.FRONTEND_URL
        if frontend_host.endswith("/"):
            frontend_host = frontend_host[:-1]
        url = settings.FRONTEND_PAYMENT_REDIRECT_URL.format(id=order_number)

        try:
            order = Order.objects.get(number=order_number)
        except Order.DoesNotExist:
            return HttpResponseRedirect(frontend_host)

        if order.status == OrderStatus.PAID:
            return HttpResponseRedirect(frontend_host + url)

        if order.status != OrderStatus.NEW or not order.payment_id:
            return HttpResponseRedirect(frontend_host)

        if payment_status := self.check_payment_status(order.payment_id):
            self.payment_successful(order)
            celery_app.send_task("api.shop.success_payment", args=[order_number])
        else:
            celery_app.send_task("api.shop.failed_payment", args=[order_number])

        if payment_status is True:
            return HttpResponseRedirect(frontend_host + url)
        else:
            return HttpResponseRedirect(frontend_host)


class OrderLoginDataView(generics.GenericAPIView):
    # permission_classes = [IsAuthenticated]
    permission_classes = []

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

    # @staticmethod
    # def perform_create(serializer):
    #     now = timezone.now()
    #     login_data = [
    #         OrderLoginData(
    #             order_line_id=data["order_line"],
    #             account_id=data["account_id"],
    #             code=data["code"],
    #             created_dt=now,
    #         )
    #         for data in serializer.validated_data
    #     ]
    #     OrderLoginData.objects.bulk_create(login_data)
    # В api.customer.views.OrderLoginDataView.perform_create
    @staticmethod
    def perform_create(serializer):
        now = timezone.now()
        login_data_list = []
        
        for data in serializer.validated_data:
            # Получаем последнюю запись для этой линии заказа
            last_login_data = OrderLoginData.objects.filter(
                order_line_id=data["order_line"]
            ).order_by('-created_dt').first()
            
            # Проверяем, изменились ли почта или код
            email_changed = False
            code_changed = False
            
            if last_login_data:
                email_changed = last_login_data.account_id != data["account_id"]
                code_changed = last_login_data.code != data["code"]
            
            login_data_list.append(
                OrderLoginData(
                    order_line_id=data["order_line"],
                    account_id=data["account_id"],
                    code=data["code"],
                    created_dt=now,
                    email_changed=email_changed,
                    code_changed=code_changed
                )
            )
        
        OrderLoginData.objects.bulk_create(login_data_list)
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


# class OrderWebhookView(APIView):
#     def post(self, request):
#         ip = self.get_client_ip(request)
#         if not SecurityHelper().is_ip_trusted(ip):
#             return Response(status=status.HTTP_403_FORBIDDEN)

#         try:
#             event_json = json.loads(request.body)
#             notification = WebhookNotificationFactory().create(event_json)
#             response_obj = notification.object
#         except Exception as error:
#             logger.exception("Could not parse notification: %s", error)
#             return Response(status=status.HTTP_400_BAD_REQUEST)

#         try:
#             if notification.event == WebhookNotificationEventType.PAYMENT_SUCCEEDED:
#                 self.payment_successful(response_obj.id)
#             elif notification.event == WebhookNotificationEventType.PAYMENT_CANCELED:
#                 self.payment_canceled(response_obj.id)
#         except Exception as error:
#             logger.warning("Could not process notification: %s", error)

#         return Response(status=status.HTTP_200_OK)

#     @staticmethod
#     def get_client_ip(request) -> str:
#         x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
#         if x_forwarded_for:
#             ip = x_forwarded_for.split(",")[0]
#         else:
#             ip = request.META.get("REMOTE_ADDR")
#         return ip

#     @staticmethod
#     def payment_successful(payment_id: str) -> None:
#         order = Order.objects.get(payment_id=payment_id)
#         order.status = OrderStatus.PAID
#         order.save()

#         celery_app.send_task("api.shop.success_payment", args=[order.number])

#     @staticmethod
#     def payment_canceled(payment_id: str) -> None:
#         order = Order.objects.get(payment_id=payment_id)
#         order.status = OrderStatus.CANCELLED
#         order.save()

#         celery_app.send_task("api.davdamer.order_status_updated", args=[order.pk])
class OrderWebhookView(APIView):
    def post(self, request):
        ip = self.get_client_ip(request)
        if not SecurityHelper().is_ip_trusted(ip):
            return Response(status=status.HTTP_403_FORBIDDEN)

        try:
            event_json = json.loads(request.body)
            notification = WebhookNotificationFactory().create(event_json)
            response_obj = notification.object
        except Exception as error:
            logger.exception("Could not parse notification: %s", error)
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            if notification.event == WebhookNotificationEventType.PAYMENT_SUCCEEDED:
                self.payment_successful(response_obj.id)
            elif notification.event == WebhookNotificationEventType.PAYMENT_CANCELED:
                self.payment_canceled(response_obj.id)
        except Exception as error:
            logger.warning("Could not process notification: %s", error)

        return Response(status=status.HTTP_200_OK)

    @staticmethod
    def get_client_ip(request) -> str:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip

    @staticmethod
    def payment_successful(payment_id: str) -> None:
        order = Order.objects.get(payment_id=payment_id)
        order.status = OrderStatus.PAID
        order.save()

        celery_app.send_task("api.shop.success_payment", args=[order.number])

    @staticmethod
    def payment_canceled(payment_id: str) -> None:
        try:
            order = Order.objects.get(payment_id=payment_id)
            order.delete()
            logger.info(f"Order {order.number} was deleted due to payment timeout")
        except Order.DoesNotExist:
            logger.warning(f"Order with payment_id={payment_id} not found")


class ProcessReferralView(APIView):
    """Обрабатывает присоединение пользователя через реферальную ссылку"""
    def post(self, request):
        serializer = ProcessReferralSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"status": False, "errors": serializer.errors})
        
        data = serializer.validated_data
        telegram_id = data['telegram_id']
        username = data.get('username', '')
        full_name = data.get('full_name', '')
        referral_code = data['referral_code']
        
        try:
            # Найти или создать пользователя
            user, created = User.objects.get_or_create(
                telegram_chat_id=telegram_id,
                defaults={
                    'username': f"tg_{telegram_id}" if not username else username,
                    'first_name': full_name.split(' ')[0] if full_name else '',
                    'last_name': ' '.join(full_name.split(' ')[1:]) if full_name and len(full_name.split(' ')) > 1 else '',
                }
            )
            
            # Если пользователь уже привязан к реферальному коду
            if user.referred_by is not None:
                return Response({"status": False, "error": "Пользователь уже имеет реферера"})
            
            # Найти пользователя с таким реферальным кодом
            try:
                referrer = User.objects.get(referral_code=referral_code)
                
                # Нельзя быть своим собственным рефералом
                if referrer.id == user.id:
                    return Response({"status": False, "error": "Нельзя использовать свой собственный код"})
                    
                # Создание связи
                user.referred_by = referrer
                user.save(update_fields=['referred_by'])
                
                # Создание реферального кода для нового пользователя, если его нет
                if not user.referral_code:
                    user.referral_code = user.generate_unique_code()
                    user.save(update_fields=['referral_code'])
                
                return Response({"status": True})
                
            except User.DoesNotExist:
                return Response({"status": False, "error": "Неверный реферальный код"})
                
        except Exception as e:
            logger.exception(f"Ошибка обработки реферала: {str(e)}")
            return Response({"status": False, "error": "Ошибка сервера"})

class RegisterUserView(APIView):
    """Регистрирует нового пользователя без реферальной связи"""
    def post(self, request):
        serializer = RegisterUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"status": False, "errors": serializer.errors})
        
        data = serializer.validated_data
        telegram_id = data['telegram_id']
        username = data.get('username', '')
        full_name = data.get('full_name', '')
        
        try:
            # Найти или создать пользователя
            user, created = User.objects.get_or_create(
                telegram_chat_id=telegram_id,
                defaults={
                    'username': f"tg_{telegram_id}" if not username else username,
                    'first_name': full_name.split(' ')[0] if full_name else '',
                    'last_name': ' '.join(full_name.split(' ')[1:]) if full_name and len(full_name.split(' ')) > 1 else '',
                }
            )
            
            # Создание реферального кода для пользователя, если его нет
            if not user.referral_code:
                user.referral_code = user.generate_unique_code()
                user.save(update_fields=['referral_code'])
            
            return Response({"status": True})
                
        except Exception as e:
            logger.exception(f"Ошибка регистрации пользователя: {str(e)}")
            return Response({"status": False, "error": "Ошибка сервера"})

class GetReferralLinkView(APIView):
    """Возвращает реферальную ссылку пользователя"""
    def get(self, request):
        telegram_id = request.query_params.get('telegram_id')
        if not telegram_id:
            return Response({"status": False, "error": "Параметр telegram_id обязателен"})
            
        try:
            telegram_id = int(telegram_id)
            user = get_object_or_404(User, telegram_chat_id=telegram_id)
            
            # Создать реферальную ссылку
            referral_link = user.get_referral_link()
            
            return Response({"referral_link": referral_link})
                
        except Exception as e:
            logger.exception(f"Ошибка получения реферальной ссылки: {str(e)}")
            return Response({"status": False, "error": "Ошибка сервера"})


# class OrderReviewView(generics.CreateAPIView):
#     """
#     Создание отзыва к заказу
#     """
#     permission_classes = [IsAuthenticated]
#     serializer_class = serializers.CreateOrderReviewSerializer
    
#     def get_serializer_context(self):
#         context = super().get_serializer_context()
#         return context
class OrderReviewView(generics.ListCreateAPIView):
    """
    Создание и получение отзывов к заказам
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return serializers.CreateOrderReviewSerializer
        return serializers.OrderReviewListSerializer  # Нужно создать этот сериализатор
    
    def get_queryset(self):
        return OrderReview.objects.filter(
            order__user=self.request.user
        ).select_related('order').order_by('-created_dt')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        reviews_data = []
        
        for review in queryset:
            line = review.order.lines.first()
            product = line.product if line else None
            
            review_data = {
                'id': review.id,
                'order': review.order.id,
                'order_number': review.order.number,
                'rating': review.rating,
                'comment': review.comment,
                'created_dt': review.created_dt.isoformat(),
                'user_name': request.user.first_name or request.user.username or 'Покупатель',
            }
            
            if product:
                review_data.update({
                    'product_name': product.title,
                    'product_price': str(line.unit_price_incl_tax) + ' ₽',
                    'product_image': product.images.first().original.url if product.images.exists() else None
                })
            
            reviews_data.append(review_data)
        
        return Response({'reviews': reviews_data})

class OrderReviewForPaymentView(APIView):
    """
    Создание отзыва на странице оплаты заказа
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=serializers.OrderReviewSerializer,
        responses={
            200: serializers.ResponseStatusSerializer,
            400: None,
        },
    )
    def post(self, request, order_number, *args, **kwargs):
        try:
            order = Order.objects.get(number=order_number, user=request.user)
        except Order.DoesNotExist:
            return Response({"status": False, "message": "Заказ не найден"}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = serializers.OrderReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        OrderReview.objects.create(
            order=order,
            rating=serializer.validated_data["rating"],
            comment=serializer.validated_data.get("comment", "")
        )
        
        return Response({"status": True})