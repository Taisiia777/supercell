import warnings

from django.urls import reverse, NoReverseMatch
from drf_spectacular.utils import extend_schema_serializer, OpenApiExample
from oscar.core.loading import get_model, get_class
from oscarapi.utils.loading import get_api_class
from oscarapi import settings
from rest_framework import serializers

from api import examples

Selector = get_class("partner.strategy", "Selector")
Product = get_model("catalogue", "Product")
Seller = get_model("partner", "Seller")
CoreCheckoutSerializer = get_api_class("serializers.checkout", "CheckoutSerializer")
CoreOrderSerializer = get_api_class("serializers.checkout", "OrderSerializer")
CoreProductSerializer = get_api_class("serializers.product", "ProductSerializer")
PriceSerializer = get_api_class("serializers.checkout", "PriceSerializer")
CoreProductLinkSerializer = get_api_class(
    "serializers.product", "ProductLinkSerializer"
)


class SellerSerializer(serializers.ModelSerializer):
    products_url = serializers.HyperlinkedIdentityField(
        view_name="seller-products", lookup_url_kwarg="seller_id"
    )

    class Meta:
        model = Seller
        fields = ["id", "name", "image", "products_url"]


class BasketProductSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=10)


@extend_schema_serializer(
    examples=[OpenApiExample("Создание заказа", examples.CheckoutExample)]
)
class APICheckoutSerializer(serializers.Serializer):
    products = BasketProductSerializer(many=True)


class OrderSerializer(CoreOrderSerializer):
    def get_payment_url(self, obj):
        try:
            request = self.context["request"]
            url = reverse("api-payment", args=(obj.pk,))
            return request.build_absolute_uri(url)
        except NoReverseMatch:
            msg = (
                "You need to implement a view named 'api-payment' "
                "which redirects to the payment provider and sets up the "
                "callbacks."
            )
            warnings.warn(msg, stacklevel=2)
            return None


class ProductLinkSerializer(CoreProductLinkSerializer):
    price = serializers.SerializerMethodField()

    def get_price(self, product):
        request = self.context["request"]
        strategy = Selector().strategy(request=request, user=request.user)
        ser = PriceSerializer(
            strategy.fetch_for_product(product).price, context={"request": request}
        )
        return ser.data
    class Meta(CoreProductLinkSerializer.Meta):
        fields = settings.PRODUCT_FIELDS


class ProductSerializer(CoreProductSerializer):
    price = serializers.SerializerMethodField()

    def get_price(self, product):
        request = self.context["request"]
        strategy = Selector().strategy(request=request, user=request.user)
        ser = PriceSerializer(
            strategy.fetch_for_product(product).price, context={"request": request}
        )
        return ser.data

    class Meta(CoreProductSerializer.Meta):
        fields = settings.PRODUCTDETAIL_FIELDS
