from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from rest_framework import serializers

from api.shop.serializers import IntPriceField, CategoryField
from core.models import OrderLoginData
from core.models import OrderReview
from core.models import UserSocialMedia, ReferralPayment

from decimal import Decimal
from django.db.models import Sum


Order = get_model("order", "Order")
OrderLine = get_model("order", "Line")
Product = get_model("catalogue", "Product")
ProductImage = get_model("catalogue", "ProductImage")
ShippingAddress = get_model("order", "ShippingAddress")
CoreProductSerializer = get_api_class("serializers.product", "ProductSerializer")
User = get_user_model()


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = [
            "first_name",
            "last_name",
            "district",
            "line1",
            "state",
            "phone_number",
            "date",
            "time",
            "notes",
        ]


class OrderSerializer(serializers.ModelSerializer):
    shipping_address = ShippingAddressSerializer()

    total_incl_tax = IntPriceField()
    total_excl_tax = IntPriceField()
    shipping_incl_tax = IntPriceField()
    shipping_excl_tax = IntPriceField()

    class Meta:
        model = Order
        fields = "__all__"


class GameEmailSerializer(serializers.ModelSerializer):
    brawl_stars = serializers.EmailField(
        source="brawl_stars_email", allow_null=True, allow_blank=True
    )
    clash_of_clans = serializers.EmailField(
        source="clash_of_clans_email", allow_null=True, allow_blank=True
    )
    clash_royale = serializers.EmailField(
        source="clash_royale_email", allow_blank=True, allow_null=True
    )
    hay_day = serializers.EmailField(
        source="hay_day_email", allow_blank=True, allow_null=True
    )



    class Meta:
        model = User
        fields = ["brawl_stars", "clash_of_clans", "clash_royale", "hay_day"]


class CustomerSerializer(serializers.ModelSerializer):
    game_email = GameEmailSerializer(source="*")
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)  # Добавляем это поле

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "game_email", "username"]


class CustomerMixin:
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        ret["user"] = CustomerSerializer(request.user).data
        return ret


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "original", "caption", "display_order"]


class ProductSerializer(CoreProductSerializer):
    images = ProductImageSerializer(many=True)
    categories = CategoryField(many=True)
    friend_url = serializers.URLField(required=False, allow_null=True)

    class Meta(CoreProductSerializer.Meta):
        fields = ["id", "title", "images", "categories", "login_type", "game", "filters_type", "friend_url"]



class OrderLoginDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderLoginData
        fields = ["account_id", "code", "email_changed", "code_changed"]

class PutLoginDataSerializer(serializers.ModelSerializer):
    line_id = serializers.PrimaryKeyRelatedField(
        queryset=OrderLine.objects.all(), source="order_line"
    )

    def validate_line_id(self, value: OrderLine) -> int:
        order = self.context["order"]
        if not order.lines.filter(id=value.pk).exists():
            raise serializers.ValidationError("Line %d not found in order" % value.pk)
        return value.pk

    class Meta:
        model = OrderLoginData
        fields = ["line_id", "account_id", "code"]


class OrderLineSerializer(serializers.ModelSerializer):
    product = ProductSerializer()
    unit_price_incl_tax = IntPriceField()
    line_price_incl_tax = IntPriceField()
    measurement = serializers.CharField(required=False)
    login_data = serializers.SerializerMethodField()

    @extend_schema_field(OrderLoginDataSerializer(required=False))
    def get_login_data(self, order):
        login_data = order.login_data.first()
        if login_data:
            return OrderLoginDataSerializer(login_data).data
        return None

    class Meta:
        model = OrderLine
        fields = [
            "id",
            "product",
            "quantity",
            "unit_price_incl_tax",
            "line_price_incl_tax",
            "measurement",
            "login_data",
        ]


class OrderDetailSerializer(OrderSerializer):
    lines = OrderLineSerializer(many=True)


class CustomerOrderListSerializer(CustomerMixin, serializers.Serializer):
    user = CustomerSerializer()
    orders = OrderDetailSerializer(many=True)


class CustomerOrderDetailSerializer(CustomerMixin, serializers.Serializer):
    user = CustomerSerializer()
    order = OrderDetailSerializer(required=False)


class OrderPaymentStatusSerializer(serializers.Serializer):
    status = serializers.BooleanField()


class UpdateLoginDataSerializer(serializers.Serializer):
    line_id = serializers.IntegerField()
    code = serializers.CharField()

class ProcessReferralSerializer(serializers.Serializer):
    telegram_id = serializers.IntegerField()
    username = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    referral_code = serializers.CharField()

class RegisterUserSerializer(serializers.Serializer):
    telegram_id = serializers.IntegerField()
    username = serializers.CharField(required=False, allow_blank=True)
    full_name = serializers.CharField(required=False, allow_blank=True)

class ReferralLinkSerializer(serializers.Serializer):
    referral_link = serializers.CharField()

# Добавьте этот класс в файл
class OrderReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderReview
        fields = ["rating", "comment"]
        
    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not attrs.get("rating"):
            raise serializers.ValidationError({"rating": "Оценка обязательна"})
        return attrs


class CreateOrderReviewSerializer(OrderReviewSerializer):
    order_number = serializers.CharField(required=True)

    class Meta(OrderReviewSerializer.Meta):
        # Добавляем поле order_number в список полей
        fields = ["rating", "comment", "order_number"]
        
    def validate_order_number(self, value):
        try:
            order = Order.objects.get(number=value, user=self.context["request"].user)
            return order
        except Order.DoesNotExist:
            raise serializers.ValidationError("Заказ не найден")

    # def create(self, validated_data):
    #     order = validated_data.pop("order_number")
    #     return OrderReview.objects.create(order=order, **validated_data)
    # api/customer/serializers.py
    def create(self, validated_data):
        order = validated_data.pop("order_number")
        review = OrderReview.objects.create(order=order, **validated_data)
        
        # Проверяем наличие аватарки и запускаем задачу при необходимости
        user = self.context['request'].user
        if user.telegram_chat_id and not user.telegram_avatar_url:
            from celery_app import app as celery_app
            celery_app.send_task("core.update_telegram_avatar", args=[user.id])
        
        return review

class ResponseStatusSerializer(serializers.Serializer):
    status = serializers.BooleanField(default=True)
    message = serializers.CharField(required=False, allow_null=True)

class ReferralStatsSerializer(serializers.Serializer):
    active_referrals = serializers.IntegerField()
    total_earnings = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_payouts = serializers.DecimalField(max_digits=10, decimal_places=2) 
    conversion_rate = serializers.FloatField()
    registered_users = serializers.IntegerField()
    purchased_users = serializers.IntegerField()
    recent_earnings = serializers.ListField(child=serializers.DecimalField(max_digits=10, decimal_places=2))
    top_referrers = serializers.ListField(child=serializers.DictField())

class ReferralUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='username')
    registration_date = serializers.DateTimeField(source='date_joined', format="%d.%m.%Y")
    total_spent = serializers.SerializerMethodField()
    orders_count = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    referrer_earnings = serializers.SerializerMethodField()
    paid_amount = serializers.SerializerMethodField()
    ref_link = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'registration_date', 'total_spent', 
                  'orders_count', 'status', 'referrer_earnings', 'paid_amount', 'ref_link']
    
    def get_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        return obj.username
    
    def get_total_spent(self, obj):
        # Рассчитываем общую сумму заказов пользователя
        return sum(order.total_incl_tax for order in obj.orders.all())
    
    def get_orders_count(self, obj):
        return obj.orders.count()
    
    def get_status(self, obj):
        # Пользователь активен, если у него есть хотя бы один заказ
        return 'active' if obj.orders.exists() else 'inactive'
    
    def get_referrer_earnings(self, obj):
        # Получаем рефералов пользователя
        referrals = User.objects.filter(referred_by=obj)
        
        # Считаем общую сумму заказов рефералов
        total_earnings = Decimal('0')
        for referral in referrals:
            for order in Order.objects.filter(user=referral):
                total_earnings += order.total_incl_tax * Decimal('0.05')
        
        return total_earnings
    
    def get_paid_amount(self, obj):
        # Получаем сумму всех выплат для этого пользователя
        from core.models import ReferralPayment
        return ReferralPayment.objects.filter(referrer=obj).aggregate(
            Sum('amount')
        )['amount__sum'] or 0
    
    def get_ref_link(self, obj):
        # Формируем реферальную ссылку
        return obj.get_referral_link()
    
class UserSocialMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSocialMedia
        fields = ['tiktok', 'instagram', 'youtube', 'vk', 'telegram']
        
class ReferralPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralPayment
        fields = ['id', 'amount', 'comment', 'created_dt', 'bank', 'phone']
        
class ReferralUserSerializer(serializers.ModelSerializer):
    social_media = UserSocialMediaSerializer(read_only=True)
    latest_payment = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'social_media', 'latest_payment']
        
    def get_latest_payment(self, user):
        payment = ReferralPayment.objects.filter(referrer=user).order_by('-created_dt').first()
        if payment:
            return {
                'bank': payment.bank,
                'phone': payment.phone
            }
        return None