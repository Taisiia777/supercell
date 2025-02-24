from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from rest_framework import serializers

from api.shop.serializers import IntPriceField, CategoryField
from core.models import OrderLoginData

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

    # def validate(self, attrs):
    #     attrs = super().validate(attrs)
    #     if "brawl_stars_email" in attrs and not attrs["brawl_stars_email"]:
    #         attrs.pop("brawl_stars_email")
    #     if "clash_of_clans_email" in attrs and not attrs["clash_of_clans_email"]:
    #         attrs.pop("clash_of_clans_email")
    #     if "clash_royale_email" in attrs and not attrs["clash_royale_email"]:
    #         attrs.pop("clash_royale_email")
    #     if "hay_day_email" in attrs and not attrs["hay_day_email"]:
    #         attrs.pop("hay_day_email")
    #     return attrs

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
        fields = ["account_id", "code"]


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
