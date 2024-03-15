from django.contrib.auth import get_user_model
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


class CustomerSerializer(serializers.ModelSerializer):
    receiver = ReceiverSerializer(source="*")
    delivery = DeliverySerializer(source="*")
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "receiver", "delivery"]


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


class OrderLineSerializer(serializers.ModelSerializer):
    product = ProductSerializer()
    unit_price_incl_tax = serializers.DecimalField(
        allow_null=True,
        decimal_places=0,
        max_digits=12,
        required=False,
    )
    measurement = serializers.CharField(required=False)

    class Meta:
        model = OrderLine
        fields = ["product", "quantity", "unit_price_incl_tax", "measurement"]


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


class OrderLoginDataSerializer(serializers.ModelSerializer):
    link = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    code = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, data):
        if data.get("link"):
            if data.get("email") or data.get("code"):
                raise serializers.ValidationError("Должен быть заполнен только link")
        else:
            if not (data.get("email") and data.get("code")):
                raise serializers.ValidationError(
                    "Должны быть заполнены email и code вместе"
                )
        return data

    class Meta:
        model = OrderLoginData
        fields = ["link", "email", "code"]
