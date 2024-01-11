import logging
import uuid

from django.contrib.auth import get_user_model
from oscar.core.loading import get_model, get_class
from oscarapi.serializers.admin.product import AdminProductSerializer
from oscarapi.utils.loading import get_api_class
from rest_framework import serializers

from api.customer.serializers import (
    OrderSerializer as CustomerOrderSerializer,
    OrderDetailSerializer as CustomerOrderDetailSerializer,
    CustomerSerializer,
)
from core.models import DavDamer

logger = logging.getLogger(__name__)

Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")
User = get_user_model()
CoreProductSerializer = get_api_class(
    "serializers.admin.product", "AdminProductSerializer"
)
PriceSerializer = get_api_class("serializers.checkout", "PriceSerializer")
Selector = get_class("partner.strategy", "Selector")


class CreateSellerSerializer(serializers.ModelSerializer):
    telegram_chat_id = serializers.IntegerField(required=False)

    class Meta:
        model = Seller
        fields = [
            "name",
            "telegram_chat_id",
            "phone_number",
            "country",
            "city",
            "market",
            "address",
            "description",
        ]


class DavDamerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DavDamer
        fields = ["id", "name"]


class SellerResponseSerializer(serializers.ModelSerializer):
    products_amount = serializers.SerializerMethodField()
    country = serializers.ReadOnlyField(default="Россия")
    davdamer = DavDamerSerializer()
    full_address = serializers.SerializerMethodField()

    def get_full_address(self, seller):
        return f"{seller.country}, {seller.city}, {seller.market}"

    def get_products_amount(self, seller):
        return Product.objects.filter(seller=seller).count()

    class Meta:
        model = Seller
        fields = [
            "id",
            "name",
            "phone_number",
            "country",
            "city",
            "market",
            "address",
            "full_address",
            "davdamer",
            "description",
            "products_amount",
            "rating",
            "registered_dt",
        ]


class UpdateSellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = [
            "name",
            "phone_number",
            "country",
            "city",
            "market",
            "address",
            "description",
        ]


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(
        write_only=True, trim_whitespace=False, style={"input_type": "password"}
    )


class SuccessLogin(serializers.Serializer):
    access_token = serializers.CharField()
    user = CustomerSerializer()


class ErrorLogin(serializers.Serializer):
    username = serializers.ListField(child=serializers.CharField(), required=False)
    password = serializers.ListField(child=serializers.CharField(), required=False)


class SellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = [
            "id",
            "name",
            "rating",
        ]


class OrderSerializer(CustomerOrderSerializer):
    seller = SellerSerializer(required=False)
    user = CustomerSerializer()


class ProductSerializer(CoreProductSerializer):
    seller = SellerSerializer()
    price = serializers.SerializerMethodField()

    def get_price(self, product):
        request = self.context["request"]
        strategy = Selector().strategy(request=request, user=request.user)
        ser = PriceSerializer(
            strategy.fetch_for_product(product).price, context={"request": request}
        )
        return ser.data


class OrderDetailSerializer(OrderSerializer, CustomerOrderDetailSerializer):
    pass


class CreateProductSerializer(AdminProductSerializer):
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, write_only=True, min_value=10, max_value=100000
    )

    def create(self, validated_data):
        validated_data.pop("stockrecords", None)
        sku = uuid.uuid4().hex[:6].upper()
        seller_id = self.context["view"].kwargs["seller_id"]
        seller = Seller.objects.get(id=seller_id)

        stockrecord = {
            "partner_sku": sku,
            "price_currency": "RUB",
            "price": validated_data.pop("price"),
            "partner": seller,
        }
        validated_data["stockrecords"] = [stockrecord]
        product = super().create(validated_data)
        product.seller = seller
        product.save(update_fields=["seller"])
        return product

    @staticmethod
    def _update_product_price(product, price):
        strategy = Selector().strategy()
        info = strategy.fetch_for_product(product)
        if info.stockrecord:
            info.stockrecord.price = price
            info.stockrecord.save()
        else:
            logger.warning("No stockrecord found for product %s", product)

    def update(self, product, validated_data):
        validated_data.pop("stockrecords", None)
        price = validated_data.pop("price", None)
        product = super().update(product, validated_data)

        if price is not None:
            self._update_product_price(product, price)

        return product

    class Meta:
        model = Product
        fields = [
            "product_class",
            "title",
            "description",
            "upc",
            "price",
            "is_public",
            "stockrecords",
        ]


class ProductClassSerializer(serializers.Serializer):
    slug = serializers.CharField()
    name = serializers.CharField()
