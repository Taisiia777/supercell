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
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count, F
from datetime import timedelta
from .serializers import ReferralUserSerializer  # Добавьте этот импорт
from core.models import ReferralPayment
from core.models import UserSocialMedia
from decimal import Decimal

User = get_user_model()
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
        # else:
        #     celery_app.send_task("api.shop.failed_payment", args=[order_number])

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


# class ProcessReferralView(APIView):
#     """Обрабатывает присоединение пользователя через реферальную ссылку"""
#     def post(self, request):
#         serializer = ProcessReferralSerializer(data=request.data)
#         if not serializer.is_valid():
#             return Response({"status": False, "errors": serializer.errors})
        
#         data = serializer.validated_data
#         telegram_id = data['telegram_id']
#         username = data.get('username', '')
#         full_name = data.get('full_name', '')
#         referral_code = data['referral_code']
        
#         try:
#             # Найти или создать пользователя
#             user, created = User.objects.get_or_create(
#                 telegram_chat_id=telegram_id,
#                 defaults={
#                     'username': f"tg_{telegram_id}" if not username else username,
#                     'first_name': full_name.split(' ')[0] if full_name else '',
#                     'last_name': ' '.join(full_name.split(' ')[1:]) if full_name and len(full_name.split(' ')) > 1 else '',
#                 }
#             )
            
#             # Если пользователь уже привязан к реферальному коду
#             if user.referred_by is not None:
#                 return Response({"status": False, "error": "Пользователь уже имеет реферера"})
            
#             # Найти пользователя с таким реферальным кодом
#             try:
#                 referrer = User.objects.get(referral_code=referral_code)
                
#                 # Нельзя быть своим собственным рефералом
#                 if referrer.id == user.id:
#                     return Response({"status": False, "error": "Нельзя использовать свой собственный код"})
                    
#                 # Создание связи
#                 user.referred_by = referrer
#                 user.save(update_fields=['referred_by'])
                
#                 # Создание реферального кода для нового пользователя, если его нет
#                 if not user.referral_code:
#                     user.referral_code = user.generate_unique_code()
#                     user.save(update_fields=['referral_code'])
                
#                 return Response({"status": True})
                
#             except User.DoesNotExist:
#                 return Response({"status": False, "error": "Неверный реферальный код"})
                
#         except Exception as e:
#             logger.exception(f"Ошибка обработки реферала: {str(e)}")
#             return Response({"status": False, "error": "Ошибка сервера"})


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
            
            # Проверка на наличие покупок
            if user.orders.exists():
                return Response({"status": False, "error": "Пользователи с покупками не могут быть привязаны как рефералы"})
            
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
                # 'user_name': request.user.first_name or request.user.username or 'Покупатель',
                'user_name': review.order.user.first_name or review.order.user.username or 'Покупатель',
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



class ReferralStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Получаем только рефералов текущего пользователя
        referrals = User.objects.filter(referred_by=request.user)
        
        # Считаем активных рефералов (с заказами)
        active_referrals = referrals.annotate(orders_count=Count('orders')).filter(orders_count__gt=0).count()
        
        # Общая сумма заказов рефералов
        total_spent = Order.objects.filter(user__in=referrals).aggregate(
            total=Sum('total_incl_tax')
        )['total'] or 0
        
        # Комиссия с заказов (5%)
        total_earnings = total_spent * Decimal('0.05')
        
        # К выплате (заработок минус уже выплаченное)
        # Пока система выплат не реализована, считаем всю сумму как "к выплате"
        pending_payouts = total_earnings
        
        # Конверсия: процент рефералов, сделавших заказ
        conversion_rate = (active_referrals / referrals.count() * 100) if referrals.count() > 0 else 0
        
        # Данные о последних заработках (за последние 7 дней)
        recent_earnings = []
        for i in range(7):
            day = timezone.now().date() - timedelta(days=i)
            day_earnings = Order.objects.filter(
                user__in=referrals, 
                date_placed__date=day
            ).aggregate(
                total=Sum('total_incl_tax')
            )['total'] or 0
            recent_earnings.append(day_earnings * Decimal('0.05'))

        
        # Список топовых рефереров (пользователей, которые привели больше всего рефералов)
        top_referrers = []
        top_users = User.objects.annotate(
            referrals_count=Count('referrals')
        ).filter(referrals_count__gt=0).order_by('-referrals_count')[:5]
        
        for user in top_users:
            user_referrals = User.objects.filter(referred_by=user)
            referral_earnings = Order.objects.filter(
                user__in=user_referrals
            ).aggregate(
                total=Sum('total_incl_tax')
            )['total'] or 0
            
            top_referrers.append({
                'id': user.id,
                'name': f"{user.first_name} {user.last_name[0]}." if user.first_name and user.last_name else user.username,
                'earnings': referral_earnings * Decimal('0.05'),
                'referrals': user_referrals.count()
            })
        
        data = {
            'active_referrals': active_referrals,
            'total_earnings': total_earnings,
            'pending_payouts': pending_payouts,
            'conversion_rate': round(conversion_rate, 1),
            'registered_users': referrals.count(),
            'purchased_users': active_referrals,
            'recent_earnings': recent_earnings,
            'top_referrers': top_referrers
        }
        
        return Response(data)

class ReferralUsersView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReferralUserSerializer
    
    def get_queryset(self):
        # Получаем всех пользователей, у которых есть рефералы
        return User.objects.annotate(
            referrals_count=Count('referrals')
        ).filter(referrals_count__gt=0)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Дополнительная статистика для шапки страницы
        total_users = queryset.count()
        active_users = queryset.annotate(
            orders_count=Count('orders')
        ).filter(orders_count__gt=0).count()
        
        total_spent = Order.objects.filter(
            user__in=queryset
        ).aggregate(
            total=Sum('total_incl_tax')
        )['total'] or 0
        
        total_earnings = total_spent * Decimal('0.05')
        total_paid = 0  # Пока система выплат не реализована
        total_pending = total_earnings - total_paid
        
        response_data = {
            'users': serializer.data,
            'summary': {
                'total_users': total_users,
                'active_users': active_users,
                'total_earnings': total_earnings,
                'total_pending': total_pending
            }
        }
        
        return Response(response_data)


# class ReferralPaymentView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         user_id = request.data.get('userId')
#         amount = request.data.get('amount')
#         comment = request.data.get('comment', '')
        
#         try:
#             # Проверяем, существует ли пользователь
#             user = User.objects.get(id=user_id)
            
#             # Вычисляем общую сумму заработка с рефералов
#             referrals = User.objects.filter(referred_by=user)
#             total_spent = sum(order.total_incl_tax for order in Order.objects.filter(user__in=referrals))
#             total_earnings = total_spent * Decimal('0.05')
            
#             # Вычисляем сумму уже выплаченных средств
#             total_paid = sum(payment.amount for payment in ReferralPayment.objects.filter(referrer=user))
            
#             # Проверяем, что запрошенная сумма не превышает доступный остаток
#             available_amount = total_earnings - total_paid
#             if Decimal(str(amount)) > available_amount:
#                 return Response(
#                     {"status": False, "error": f"Запрошенная сумма {amount} превышает доступный баланс {available_amount}"},
#                     status=400
#                 )
            
#             # Создаем запись о выплате
#             ReferralPayment.objects.create(
#                 referrer=user,
#                 amount=Decimal(str(amount)),
#                 comment=comment,
#                 created_dt=timezone.now()
#             )
            
#             return Response({"status": True})
            
#         except User.DoesNotExist:
#             return Response(
#                 {"status": False, "error": "Пользователь не найден"},
#                 status=404
#             )
#         except Exception as e:
#             logger.exception(f"Ошибка при выполнении выплаты: {str(e)}")
#             return Response(
#                 {"status": False, "error": f"Ошибка сервера: {str(e)}"},
#                 status=500
#             )
class ReferralPaymentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user_id = request.data.get('userId')
        amount = request.data.get('amount')
        comment = request.data.get('comment', '')
        bank = request.data.get('bank', '')
        phone = request.data.get('phone', '')
        
        try:
            # Проверяем, существует ли пользователь
            user = User.objects.get(id=user_id)
            
            # Вычисляем общую сумму заработка с рефералов
            referrals = User.objects.filter(referred_by=user)
            total_spent = sum(order.total_incl_tax for order in Order.objects.filter(user__in=referrals))
            total_earnings = total_spent * Decimal('0.05')
            
            # Вычисляем сумму уже выплаченных средств
            total_paid = sum(payment.amount for payment in ReferralPayment.objects.filter(referrer=user))
            
            # Проверяем, что запрошенная сумма не превышает доступный остаток
            available_amount = total_earnings - total_paid
            if Decimal(str(amount)) > available_amount:
                return Response(
                    {"status": False, "error": f"Запрошенная сумма {amount} превышает доступный баланс {available_amount}"},
                    status=400
                )
            
            # Создаем запись о выплате
            ReferralPayment.objects.create(
                referrer=user,
                amount=Decimal(str(amount)),
                comment=comment,
                bank=bank,
                phone=phone,
                created_dt=timezone.now()
            )
            
            return Response({"status": True})
            
        except User.DoesNotExist:
            return Response(
                {"status": False, "error": "Пользователь не найден"},
                status=404
            )
        except Exception as e:
            logger.exception(f"Ошибка при выполнении выплаты: {str(e)}")
            return Response(
                {"status": False, "error": f"Ошибка сервера: {str(e)}"},
                status=500
            )
# class ReferralUserDetailsView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request, user_id):
#         try:
#             user = User.objects.get(id=user_id)
            
#             # Получаем рефералов пользователя
#             referrals = User.objects.filter(referred_by=user)
            
#             # Получаем заказы пользователя и его рефералов
#             user_orders = Order.objects.filter(user=user).order_by('-date_placed')
            
#             # Получаем историю выплат
#             payments = ReferralPayment.objects.filter(referrer=user).order_by('-created_dt')
            
#             # Формируем ответ
#             response_data = {
#                 # Базовая информация пользователя
#                 'id': user.id,
#                 'name': f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.username,
#                 'email': user.username,
#                 'registration_date': user.date_joined.strftime("%d.%m.%Y"),
#                 'total_spent': float(sum(order.total_incl_tax for order in user_orders)),
#                 'orders_count': user_orders.count(),
#                 'status': 'active' if user_orders.exists() else 'inactive',
                
#                 # Информация о рефералах
#                 'referrer_earnings': float(sum(order.total_incl_tax for order in Order.objects.filter(user__in=referrals)) * Decimal('0.05')),
#                 'paid_amount': float(sum(payment.amount for payment in payments)),
#                 'ref_link': user.get_referral_link(),
                
#                 # Списки детальной информации
#                 'referrals': [
#                     {
#                         'id': ref.id,
#                         'name': f"{ref.first_name} {ref.last_name}" if ref.first_name and ref.last_name else ref.username,
#                         'email': ref.username,
#                         'registration_date': ref.date_joined.strftime("%d.%m.%Y"),
#                         'total_spent': float(sum(order.total_incl_tax for order in ref.orders.all())),
#                         'status': 'active' if ref.orders.exists() else 'inactive',
#                     } for ref in referrals
#                 ],
#                 'orders': [
#                     {
#                         'order_number': order.number,
#                         'date': order.date_placed.strftime("%d.%m.%Y"),
#                         'amount': float(order.total_incl_tax),
#                         'commission': float(order.total_incl_tax * Decimal('0.05')),
#                         'status': order.status
#                     } for order in user_orders
#                 ],
#                 'payments': [
#                     {
#                         'date': payment.created_dt.strftime("%d.%m.%Y"),
#                         'amount': float(payment.amount),
#                         'comment': payment.comment or ""
#                     } for payment in payments
#                 ]
#             }
            
#             return Response(response_data)
#         except User.DoesNotExist:
#             return Response({"error": "Пользователь не найден"}, status=404)
class ReferralUserDetailsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            
            # Получаем рефералов пользователя
            referrals = User.objects.filter(referred_by=user)
            
            # Получаем заказы пользователя и его рефералов
            user_orders = Order.objects.filter(user=user).order_by('-date_placed')
            
            # Получаем историю выплат
            payments = ReferralPayment.objects.filter(referrer=user).order_by('-created_dt')
            
            # Получаем соц. сети пользователя, если они есть
            social_media = {}
            try:
                if hasattr(user, 'social_media'):
                    sm = user.social_media
                    social_media = {
                        'tiktok': sm.tiktok,
                        'instagram': sm.instagram,
                        'youtube': sm.youtube,
                        'vk': sm.vk,
                        'telegram': sm.telegram
                    }
            except Exception as e:
                logger.warning(f"Ошибка при получении соцсетей пользователя: {e}")
            
            # Получаем банковские данные из последней выплаты
            bank_details = {}
            latest_payment = payments.first()
            if latest_payment:
                bank_details = {
                    'bank': latest_payment.bank,
                    'phone': latest_payment.phone
                }
            
            # Формируем ответ
            response_data = {
                # Базовая информация пользователя
                'id': user.id,
                'name': f"{user.first_name} {user.last_name}" if user.first_name and user.last_name else user.username,
                'email': user.username,
                'registration_date': user.date_joined.strftime("%d.%m.%Y"),
                'total_spent': float(sum(order.total_incl_tax for order in user_orders)),
                'orders_count': user_orders.count(),
                'status': 'active' if user_orders.exists() else 'inactive',
                
                # Информация о рефералах
                'referrer_earnings': float(sum(order.total_incl_tax for order in Order.objects.filter(user__in=referrals)) * Decimal('0.05')),
                'paid_amount': float(sum(payment.amount for payment in payments)),
                'ref_link': user.get_referral_link(),
                
                # Добавляем социальные сети и банковские данные
                'social_media': social_media,
                'bank_details': bank_details,
                
                # Списки детальной информации
                'referrals': [
                    {
                        'id': ref.id,
                        'name': f"{ref.first_name} {ref.last_name}" if ref.first_name and ref.last_name else ref.username,
                        'email': ref.username,
                        'registration_date': ref.date_joined.strftime("%d.%m.%Y"),
                        'total_spent': float(sum(order.total_incl_tax for order in ref.orders.all())),
                        'status': 'active' if ref.orders.exists() else 'inactive',
                    } for ref in referrals
                ],
                'orders': [
                    {
                        'order_number': order.number,
                        'date': order.date_placed.strftime("%d.%m.%Y"),
                        'amount': float(order.total_incl_tax),
                        'commission': float(order.total_incl_tax * Decimal('0.05')),
                        'status': order.status
                    } for order in user_orders
                ],
                'payments': [
                    {
                        'date': payment.created_dt.strftime("%d.%m.%Y"),
                        'amount': float(payment.amount),
                        'comment': payment.comment or "",
                        'bank': payment.bank or "",
                        'phone': payment.phone or ""
                    } for payment in payments
                ]
            }
            
            return Response(response_data)
        except User.DoesNotExist:
            return Response({"error": "Пользователь не найден"}, status=404)


class UserSocialMediaView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Получение данных о социальных сетях текущего пользователя"""
        try:
            social_media, created = UserSocialMedia.objects.get_or_create(user=request.user)
            data = {
                'tiktok': social_media.tiktok,
                'instagram': social_media.instagram,
                'youtube': social_media.youtube,
                'vk': social_media.vk,
                'telegram': social_media.telegram
            }
            return Response(data)
        except Exception as e:
            logger.exception(f"Ошибка при получении социальных сетей: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    def post(self, request):
        """Обновление данных о социальных сетях текущего пользователя"""
        try:
            social_media, created = UserSocialMedia.objects.get_or_create(user=request.user)
            
            if 'tiktok' in request.data:
                social_media.tiktok = request.data['tiktok']
            if 'instagram' in request.data:
                social_media.instagram = request.data['instagram']
            if 'youtube' in request.data:
                social_media.youtube = request.data['youtube']
            if 'vk' in request.data:
                social_media.vk = request.data['vk']
            if 'telegram' in request.data:
                social_media.telegram = request.data['telegram']
                
            social_media.save()
            
            return Response({"status": True})
        except Exception as e:
            logger.exception(f"Ошибка при обновлении социальных сетей: {str(e)}")
            return Response({"status": False, "error": str(e)}, status=500)