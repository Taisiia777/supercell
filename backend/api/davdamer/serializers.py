from django.contrib.auth import get_user_model
from oscar.core.loading import get_model, get_class
from oscarapi.utils.loading import get_api_class
from rest_framework import serializers

from api.customer.serializers import (
    OrderSerializer as CustomerOrderSerializer,
    OrderDetailSerializer as CustomerOrderDetailSerializer,
    CustomerSerializer,
)
from core.models import DavDamer

Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")
User = get_user_model()
CoreProductSerializer = get_api_class(
    "serializers.admin.product", "AdminProductSerializer"
)
PriceSerializer = get_api_class("serializers.checkout", "PriceSerializer")
Selector = get_class("partner.strategy", "Selector")


class CreateSellerSerializer(serializers.ModelSerializer):
    telegram_chat_id = serializers.IntegerField()

    def create(self, validated_data):
        telegram_chat_id = validated_data.pop("telegram_chat_id")
        user, _ = User.objects.get_or_create(
            telegram_chat_id=telegram_chat_id,
            defaults={"username": "TG:" + str(telegram_chat_id)},
        )
        seller = Seller.objects.create(**validated_data)
        seller.users.add(user)

        return seller

    class Meta:
        model = Seller
        fields = ["name", "telegram_chat_id", "phone_number"]


class DavDamerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DavDamer
        fields = ["id", "name"]


class SellerResponseSerializer(serializers.ModelSerializer):
    products_amount = serializers.SerializerMethodField()
    country = serializers.ReadOnlyField(default="Россия")
    city = serializers.ReadOnlyField(default="Москва")
    market = serializers.ReadOnlyField(default="Садовод")
    davdamer = DavDamerSerializer()

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
            "davdamer",
            "description",
            "products_amount",
            "rating",
            "registered_dt",
        ]


class OrderSerializer(CustomerOrderSerializer):
    seller = SellerResponseSerializer(required=False)
    user = CustomerSerializer()


class OrderDetailSerializer(OrderSerializer, CustomerOrderDetailSerializer):
    pass


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
