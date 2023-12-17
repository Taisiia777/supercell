from django.contrib.auth import get_user_model
from oscar.core.loading import get_model
from rest_framework import serializers

from api.customer.serializers import (
    OrderSerializer as CustomerOrderSerializer,
    OrderDetailSerializer as CustomerOrderDetailSerializer,
    CustomerSerializer,
)


Seller = get_model("partner", "Seller")
User = get_user_model()


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


class SellerResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = ["id", "name", "phone_number"]


class OrderSerializer(CustomerOrderSerializer):
    seller = SellerResponseSerializer(required=False)
    user = CustomerSerializer()


class OrderDetailSerializer(OrderSerializer, CustomerOrderDetailSerializer):
    pass
