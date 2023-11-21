from oscar.core.loading import get_model
from rest_framework import serializers

Product = get_model("catalogue", "Product")
Seller = get_model("partner", "Seller")


class ProductListSerializer(serializers.ModelSerializer):
    url = serializers.HyperlinkedIdentityField(view_name="product-detail")

    class Meta:
        model = Product
        fields = ["id", "url", "title", "images"]


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ["id", "name", "image"]
