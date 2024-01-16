import logging
import uuid

from django.contrib.auth import get_user_model
from django.db import transaction
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema_field,
    extend_schema_serializer,
    OpenApiExample,
)
from oscar.core.loading import get_model, get_class
from oscarapi.serializers.admin.product import AdminProductSerializer
from oscarapi.utils.loading import get_api_class
from oscarapi.utils.models import fake_autocreated
from rest_framework import serializers

from api import examples
from api.customer.serializers import (
    OrderSerializer as CustomerOrderSerializer,
    OrderDetailSerializer as CustomerOrderDetailSerializer,
    CustomerSerializer,
)
from core.models import DavDamer

logger = logging.getLogger(__name__)

Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")
ProductImage = get_model("catalogue", "ProductImage")
Order = get_model("order", "Order")
User = get_user_model()
CoreProductSerializer = get_api_class(
    "serializers.admin.product", "AdminProductSerializer"
)
PriceSerializer = get_api_class("serializers.checkout", "PriceSerializer")
Selector = get_class("partner.strategy", "Selector")


class CreateSellerSerializer(serializers.ModelSerializer):
    telegram_chat_id = serializers.IntegerField(required=False)
    city = serializers.CharField()

    class Meta:
        model = Seller
        fields = [
            "name",
            "telegram_chat_id",
            "image",
            "country",
            "city",
            "market",
            "address",
            "description",
        ]


class DavDamerSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    image = serializers.SerializerMethodField()

    def get_image(self, davdamer):
        request = self.context.get("request")
        if not davdamer.image:
            return request.build_absolute_uri("/static/avatars/default.png")
        return request.build_absolute_uri(davdamer.image.url)

    class Meta:
        model = DavDamer
        fields = ["id", "name", "last_name", "image"]


class SellerResponseSerializer(serializers.ModelSerializer):
    products_amount = serializers.SerializerMethodField()
    country = serializers.ReadOnlyField(default="Россия")
    orders_total = serializers.ReadOnlyField(default=0)
    davdamer = DavDamerSerializer()
    full_address = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()

    def get_city(self, seller):
        return seller.city.name if seller.city else None

    def get_full_address(self, seller):
        return f"{seller.country}, {seller.city}, {seller.market}"

    @extend_schema_field(OpenApiTypes.INT)
    def get_products_amount(self, seller):
        return Product.objects.filter(seller=seller).count()

    class Meta:
        model = Seller
        fields = [
            "id",
            "name",
            "image",
            "country",
            "city",
            "market",
            "address",
            "full_address",
            "davdamer",
            "description",
            "products_amount",
            "orders_total",
            "rating",
            "registered_dt",
        ]


class UpdateSellerSerializer(serializers.ModelSerializer):
    city = serializers.CharField(required=False)

    class Meta:
        model = Seller
        fields = [
            "name",
            "image",
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
    orders_count = serializers.SerializerMethodField()

    @staticmethod
    @extend_schema_field(OpenApiTypes.INT)
    def get_orders_count(product):
        return Order.objects.filter(lines__product=product).count()

    def get_price(self, product):
        request = self.context["request"]
        strategy = Selector().strategy(request=request, user=request.user)
        ser = PriceSerializer(
            strategy.fetch_for_product(product).price, context={"request": request}
        )
        return ser.data


class OrderDetailSerializer(OrderSerializer, CustomerOrderDetailSerializer):
    pass


class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]


@extend_schema_serializer(
    examples=[OpenApiExample("Создание товара", examples.CreateProductExample)]
)
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
            logger.warning("No stockrecord found for product %s", product.pk)

    def update(self, product, validated_data):
        price = validated_data.pop("price", None)
        categories = validated_data.pop("categories", None)

        with transaction.atomic():
            product = super().update(product, validated_data)

            if categories is not None:
                with fake_autocreated(product.categories) as _categories:
                    _categories.set(categories)

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
            "categories",
            "stockrecords",
        ]


class ProductClassSerializer(serializers.Serializer):
    slug = serializers.CharField()
    name = serializers.CharField()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["original"]


class AddressOptionsSerializer(serializers.Serializer):
    countries = serializers.ListSerializer(child=serializers.CharField())
    cities = serializers.ListSerializer(child=serializers.CharField())
    markets = serializers.ListSerializer(child=serializers.CharField())
