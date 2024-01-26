import logging
import uuid

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Max
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
    ShippingAddressSerializer,
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
ProductClass = get_model("catalogue", "ProductClass")


class CreateSellerSerializer(serializers.ModelSerializer):
    telegram_chat_id = serializers.IntegerField(required=False)
    city = serializers.CharField()

    class Meta:
        model = Seller
        fields = [
            "name",
            "telegram_chat_id",
            "enot_shop_id",
            "enot_secret_key",
            "enot_webhook_key",
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
    orders_total = serializers.SerializerMethodField()
    davdamer = DavDamerSerializer()
    full_address = serializers.SerializerMethodField()
    city = serializers.SerializerMethodField()
    telegram_chat_id = serializers.SerializerMethodField()

    def get_city(self, seller):
        return seller.city.name if seller.city else None

    def get_full_address(self, seller):
        return f"{seller.country}, {seller.city}, {seller.market}"

    @extend_schema_field(OpenApiTypes.INT)
    def get_products_amount(self, seller):
        return Product.objects.filter(seller=seller).count()

    @extend_schema_field(OpenApiTypes.INT)
    def get_telegram_chat_id(self, seller):
        user = seller.users.first()
        return user.telegram_chat_id if user else None

    @extend_schema_field(OpenApiTypes.FLOAT)
    def get_orders_total(self, seller):
        if hasattr(seller, "orders_total"):
            return seller.orders_total
        return seller.get_orders_total()

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
            "enot_shop_id",
            "telegram_chat_id",
            "registered_dt",
        ]


class UpdateSellerSerializer(serializers.ModelSerializer):
    telegram_chat_id = serializers.IntegerField(required=False)
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
            "telegram_chat_id",
            "enot_shop_id",
            "enot_secret_key",
            "enot_webhook_key",
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
        if hasattr(product, "orders_count"):
            return product.orders_count
        else:
            return product.get_orders_count()

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
    shipping_address = ShippingAddressSerializer()

    def update(self, order, validated_data):
        validated_data.pop("shipping_address", None)
        order = super().update(order, validated_data)
        return order

    class Meta:
        model = Order
        fields = ["status", "shipping_address"]


@extend_schema_serializer(
    examples=[OpenApiExample("Создание товара", examples.CreateProductExample)]
)
class CreateProductSerializer(AdminProductSerializer):
    product_class = serializers.SlugRelatedField(
        slug_field="slug", queryset=ProductClass.objects, required=False
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, write_only=True, min_value=10, max_value=100000
    )
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        required=False,
        write_only=True,
    )

    def create(self, validated_data):
        validated_data.pop("stockrecords", None)
        if validated_data.get("product_class") is None:
            validated_data["product_class"] = ProductClass.objects.first()
        sku = uuid.uuid4().hex[:6].upper()
        seller_id = self.context["view"].kwargs["seller_id"]
        seller = Seller.objects.get(id=seller_id)
        images = validated_data.pop("uploaded_images", None)

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
        if images:
            self._add_product_images(product, images)
        return product

    @staticmethod
    def _add_product_images(product, images):
        max_display_order = product.images.all().aggregate(Max("display_order"))[
            "display_order__max"
        ]
        display_order = 0 if max_display_order is None else max_display_order + 1

        for image in images:
            ProductImage.objects.create(
                product=product, original=image, display_order=display_order
            )
            display_order += 1

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
            "uploaded_images",
            "title",
            "description",
            "upc",
            "price",
            "is_public",
            "categories",
            "stockrecords",
        ]


class FormListIntSerializer(serializers.CharField):
    def to_internal_value(self, data: str):
        if len(data) < 3 or data[0] != "[" or data[-1] != "]":
            return []

        try:
            return [int(x) for x in data[1:-1].split(",") if x.isdigit()]
        except ValueError:
            return []


@extend_schema_serializer(
    examples=[OpenApiExample("Обновление товара", examples.UpdateProductExample)]
)
class UpdateProductSerializer(CreateProductSerializer):
    deleted_images = FormListIntSerializer(required=False)
    new_seller_id = serializers.IntegerField(required=False)

    def update(self, product, validated_data):
        deleted_images = validated_data.pop("deleted_images", None)
        uploaded_images = validated_data.pop("uploaded_images", None)
        new_seller_id = validated_data.pop("new_seller_id", None)

        product = super().update(product, validated_data)
        if uploaded_images:
            self._add_product_images(product, uploaded_images)

        if deleted_images:
            product.images.filter(id__in=deleted_images).delete()

        if new_seller_id:
            self._update_product_seller(product, new_seller_id)

        return product

    @staticmethod
    def _update_product_seller(product, seller_id: int):
        strategy = Selector().strategy()
        info = strategy.fetch_for_product(product)
        try:
            seller = Seller.objects.get(pk=seller_id)
        except Seller.DoesNotExist:
            logger.warning("No seller found for id %s", seller_id)
            return

        if info.stockrecord:
            info.stockrecord.partner = seller
            product.seller = seller
            product.save(update_fields=["seller"])
            info.stockrecord.save()
        else:
            logger.warning("No stockrecord found for product %s", product.pk)

    class Meta(CreateProductSerializer.Meta):
        fields = CreateProductSerializer.Meta.fields + [
            "deleted_images",
            "new_seller_id",
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
