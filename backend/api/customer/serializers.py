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


class ReceiverSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="receiver_name")
    phone = serializers.CharField(source="receiver_phone")

    class Meta:
        model = User
        fields = ["name", "phone"]


class DeliverySerializer(serializers.ModelSerializer):
    district = serializers.CharField(source="delivery_district")
    address = serializers.CharField(source="delivery_address")
    city = serializers.CharField(source="delivery_city")
    notes = serializers.CharField(source="delivery_notes")

    class Meta:
        model = User
        fields = ["city", "district", "address", "notes"]


class GameEmailSerializer(serializers.ModelSerializer):
    brawl_stars = serializers.EmailField(source="brawl_stars_email")
    clash_of_clans = serializers.EmailField(source="clash_of_clans_email")
    clash_royale = serializers.EmailField(source="clash_royale_email")
    stumble_guys = serializers.EmailField(source="stumble_guys_email")

    class Meta:
        model = User
        fields = ["brawl_stars", "clash_of_clans", "clash_royale", "stumble_guys"]


class CustomerSerializer(serializers.ModelSerializer):
    receiver = ReceiverSerializer(source="*")
    delivery = DeliverySerializer(source="*")
    game_email = GameEmailSerializer(source="*")
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "receiver", "delivery", "game_email"]


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

    class Meta(CoreProductSerializer.Meta):
        fields = ["id", "title", "images", "categories", "login_type"]


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
