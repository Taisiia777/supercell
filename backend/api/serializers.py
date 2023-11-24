import warnings

from django.urls import reverse, NoReverseMatch
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from rest_framework import serializers

Product = get_model("catalogue", "Product")
Seller = get_model("partner", "Seller")
CoreCheckoutSerializer = get_api_class("serializers.checkout", "CheckoutSerializer")
CoreOrderSerializer = get_api_class("serializers.checkout", "OrderSerializer")


class ProductListSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name="product-detail")

    class Meta:
        model = Product
        fields = ["id", "url", "title", "images"]


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ["id", "name", "image"]


class BasketProductSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=10)


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
