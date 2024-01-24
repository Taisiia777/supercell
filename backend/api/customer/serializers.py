from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from rest_framework import serializers

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
        fields = ["first_name", "last_name", "line1", "state", "phone_number", "notes"]


class OrderSerializer(serializers.ModelSerializer):
    shipping_address = ShippingAddressSerializer()

    class Meta:
        model = Order
        fields = "__all__"


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name"]


class CustomerMixin:
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        ret["user"] = CustomerSerializer(request.user).data
        return ret


class CustomerOrderListSerializer(CustomerMixin, serializers.Serializer):
    user = CustomerSerializer()
    orders = OrderSerializer(many=True)


class ProductImageSerializer(serializers.ModelSerializer):
    original = serializers.SerializerMethodField()

    def get_original(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.original.url)
    
    class Meta:
        model = ProductImage
        fields = ["id", "original", "caption", "display_order"])


class ProductSerializer(CoreProductSerializer):
    images = serializers.ListSerializer(child=ProductImageSerializer())
    
    class Meta(CoreProductSerializer.Meta):
        fields = ["id", "title", "images", "categories"]


class OrderLineSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = OrderLine
        fields = ["product", "quantity", "unit_price_incl_tax"]


class OrderDetailSerializer(OrderSerializer):
    lines = serializers.SerializerMethodField()

    @extend_schema_field(OrderLineSerializer(many=True))
    def get_lines(self, order):
        lines = order.lines.all()
        return OrderLineSerializer(lines, many=True).data


class CustomerOrderDetailSerializer(CustomerMixin, serializers.Serializer):
    user = CustomerSerializer()
    order = OrderDetailSerializer(required=False)
