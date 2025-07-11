import json
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
from oscarapi.serializers.product import ProductAttributeValueSerializer
from oscarapi.utils.loading import get_api_class
from oscarapi.utils.models import fake_autocreated
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api import examples
from api.customer.serializers import (
    OrderSerializer as CustomerOrderSerializer,
    OrderDetailSerializer as CustomerOrderDetailSerializer,
    CustomerSerializer,
)
from core.models import DavDamer
from api.shop.serializers import ProductSerializer, CategorySerializer, CategoryField
from shop.catalogue.enums import GameType

logger = logging.getLogger(__name__)

Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")
ProductImage = get_model("catalogue", "ProductImage")
Order = get_model("order", "Order")
User = get_user_model()
CoreProductSerializer = get_api_class(
    "serializers.admin.product", "AdminProductSerializer"
)
Selector = get_class("partner.strategy", "Selector")
ProductClass = get_model("catalogue", "ProductClass")
ProductAttribute = get_model("catalogue", "ProductAttribute")


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
        return seller.products.count()

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


# class SuccessLogin(serializers.Serializer):
#     access_token = serializers.CharField()
#     user = CustomerSerializer()
class SuccessLogin(serializers.Serializer):
    access_token = serializers.CharField()
    user = CustomerSerializer()
    roles = serializers.ListField(
        child=serializers.CharField(),
        source='user.roles.values_list',
        read_only=True
    )

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


class DavdamerProductSerializer(CoreProductSerializer, ProductSerializer):
    url = serializers.HyperlinkedIdentityField(
        view_name="davdamer-product-detail", lookup_url_kwarg="product_id"
    )
    orders_count = serializers.SerializerMethodField()

    @staticmethod
    @extend_schema_field(OpenApiTypes.INT)
    def get_orders_count(product):
        if hasattr(product, "orders_count"):
            return product.orders_count
        else:
            return product.get_orders_count()

    class Meta:
        model = Product
        fields = ProductSerializer.Meta.fields + ("orders_count", "is_public")


class CategoryDetailField(CategoryField):
    def to_representation(self, value):
        parent = value.get_parent()
        if parent is None:
            return {
                "id": value.pk,
                "name": value.name,
                "full_name": value.full_name,
                "child": None,
            }
        else:
            return {
                "id": parent.pk,
                "name": parent.name,
                "full_name": parent.full_name,
                "child": {
                    "id": value.pk,
                    "name": value.name,
                    "full_name": value.full_name,
                },
            }


class ParentCategoryField(CategoryField):
    def to_representation(self, value):
        parent = value.get_parent()
        if parent:
            return parent.name
        return value.name


class DavdamerProductLinkSerializer(DavdamerProductSerializer):
    categories = ParentCategoryField(many=True)


class DavdamerProductDetailSerializer(DavdamerProductLinkSerializer):
    sub_categories = CategoryDetailField(many=True, source="categories")

    class Meta(DavdamerProductLinkSerializer.Meta):
        fields = DavdamerProductLinkSerializer.Meta.fields + ("sub_categories",)


class OrderDetailSerializer(OrderSerializer, CustomerOrderDetailSerializer):
    pass


class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        # fields = ["status"]
        fields = ["status", "custom_field"]



class CustomProductAttributeValueSerializer(ProductAttributeValueSerializer):
    def to_internal_value(self, data):
        product_class = ProductClass.objects.first()
        data["product_class"] = product_class.slug
        result = super().to_internal_value(data)
        return result


def category_to_game_mapper(category_name: str) -> GameType | None:
    match category_name:
        case "Brawl Stars":
            return GameType.BRAWL_STARS
        case "Clash Royale":
            return GameType.CLASH_ROYALE
        case "Clash of Clans":
            return GameType.CLASH_OF_CLANS
        case "Hay Day":
            return GameType.HAY_DAY
        case _:
            return None


@extend_schema_serializer(
    examples=[OpenApiExample("Создание товара", examples.CreateProductExample)]
)
class CreateProductSerializer(AdminProductSerializer):
    description = serializers.CharField(
        style={'base_template': 'textarea.html'},
        allow_blank=True,
        required=False
    )
    attributes = CustomProductAttributeValueSerializer(
        many=True,
        required=False,
        source="attribute_values",
    )
    product_class = serializers.SlugRelatedField(
        slug_field="slug", queryset=ProductClass.objects, required=False
    )
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, write_only=True, min_value=10, max_value=100000
    )
    old_price = serializers.DecimalField(
        required=False,
        allow_null=True,
        max_digits=10,
        decimal_places=2,
        write_only=True,
        max_value=100000,
        label="Старая цена",
    )
    measurement = serializers.CharField(
        required=False,
        allow_null=True,
        write_only=True,
        max_length=100,
        label="Единица измерения",
    )
    friend_url = serializers.URLField(required=False, allow_null=True)

    uploaded_images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        required=False,
        write_only=True,
    )
    is_public = serializers.BooleanField(default=True)

    def to_internal_value(self, data):
        result = super().to_internal_value(data)
        attributes = data.get("attributes", [])
        if isinstance(attributes, str):
            try:
                attributes = json.loads(attributes)
                result["attribute_values"] = CustomProductAttributeValueSerializer(
                    many=True
                ).to_internal_value(attributes)
            except json.JSONDecodeError:
                raise ValidationError({"attributes": "Ошибка парсинга атрибутов"})
        return result

    def create(self, validated_data):
        validated_data.pop("stockrecords", None)
        if validated_data.get("product_class") is None:
            validated_data["product_class"] = ProductClass.objects.first()
        sku = uuid.uuid4().hex[:6].upper()
        seller_id = self.context["view"].kwargs["seller_id"]
        seller = Seller.objects.get(id=seller_id)
        images = validated_data.pop("uploaded_images", None)
        price = validated_data.pop("price")
        stockrecord = {
            "partner_sku": sku,
            "price_currency": "RUB",
            "price": price,
            "partner": seller,
        }
        price_data = {
            "price": price,
            "old_price": validated_data.pop("old_price", None),
            "measurement": validated_data.pop("measurement", None),
        }

        validated_data["stockrecords"] = [stockrecord]
        with transaction.atomic():
            product = super().create(validated_data)
            product.seller = seller
            product.save(update_fields=["seller"])
            if images:
                self._add_product_images(product, images)
            self._update_product_price(product, price_data)

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
    def _update_product_price(product, validated_data):
        strategy = Selector().strategy()
        info = strategy.fetch_for_product(product)
        if not info.stockrecord:
            logger.warning("No stockrecord found for product %s", product.pk)
            return

        for field in ["price", "old_price", "measurement"]:
            if field in validated_data:
                setattr(info.stockrecord, field, validated_data[field])

        info.stockrecord.save()

    def update(self, product, validated_data):
        categories = validated_data.pop("categories", None)
        price_data = {
            "price": validated_data.pop("price", None),
            "old_price": validated_data.pop("old_price", None),
            "measurement": validated_data.pop("measurement", None),
        }
        with transaction.atomic():
            product = super().update(product, validated_data)

            if categories is not None:
                for category in categories[:1]:
                    product.game = category_to_game_mapper(category.name)
                with fake_autocreated(product.categories) as _categories:
                    _categories.set(categories)
                product.save(update_fields=["game"])

            self._update_product_price(product, price_data)

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
            "old_price",
            "measurement",
            "is_public",
            "categories",
            "stockrecords",
            "attributes",
            "login_type",
            "filters_type",
            "friend_url"

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


# class ProductImageSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ProductImage
#         fields = ["original"]
class ProductImageSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(allow_empty_file=False, use_url=False),
        required=True,
        write_only=True
    )
    
    class Meta:
        model = ProductImage
        fields = ["images"]

class AddressOptionsSerializer(serializers.Serializer):
    countries = serializers.ListSerializer(child=serializers.CharField())
    cities = serializers.ListSerializer(child=serializers.CharField())
    markets = serializers.ListSerializer(child=serializers.CharField())


class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = ["code", "name"]


class DavDamerCategorySerializer(CategorySerializer):
    full_name = serializers.CharField()

    def get_fields(self):
        fields = super().get_fields()
        fields["children"] = DavDamerCategorySerializer(
            many=True, source="get_children"
        )
        return fields

    @staticmethod
    def get_children(obj):
        if obj.get_num_children() > 0:
            return DavDamerCategorySerializer(
                obj.get_children().filter(), many=True
            ).data
        return []

