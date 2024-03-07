import json
import logging
import os
import uuid

from shop.catalogue.models import Product
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from yookassa import Configuration, Payment

logger = logging.getLogger(__name__)

Configuration.account_id = os.getenv("SHOP_ACCOUNT_ID")
Configuration.secret_key = os.getenv("SHOP_SECRET_KEY")


class YooMoneyProductPayment(APIView):
    @staticmethod
    def get(request, product_id: int):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            logger.warning("Product does not exist: %s", product_id)
            return Response(
                {
                    "description": "Product does not exist",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "url": create_yoomoney_payment(product=product),
            },
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def post(request, payment_id: int):
        result = Payment.find_one(payment_id=payment_id)

        result_values = json.loads(result)

        if not result_values["paid"]:
            return Response(
                {
                    "description": "Product has not been paid",
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        try:
            product = Product.objects.get(payment_id=payment_id)
        except Product.DoesNotExist:
            logger.warning("Product does not exist: %s", payment_id)
            return Response(
                {
                    "description": "Product has not been updated",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        product.status = "paid"
        product.save()
        return Response(
            {
                "description": "Product has been updated successfully",
            },
            status=status.HTTP_200_OK,
        )


def create_yoomoney_payment(product: Product) -> str:
    payment = Payment.create(
        {
            "amount": {
                "value": product.price.get("incl_tax"),
                "currency": product.price.get("currency"),
            },
            "confirmation": {
                "type": "redirect",
                "return_url": "https://www.example.com/return_url",
            },
            "capture": True,
            "description": f"Оплата заказа: {product.title}",
            "metadata": {
                "product_id": product.id,
            },
            "refundable": False,
        },
        uuid.uuid4(),
    )

    return payment.confirmation.confirmation_url
