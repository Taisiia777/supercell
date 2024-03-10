import logging

from shop.order.models import Order
from yookassa import Configuration, Payment
from django.conf import settings


logger = logging.getLogger(__name__)

Configuration.account_id = settings.YOOKASSA_SHOP_ID
Configuration.secret_key = settings.YOOKASSA_API_KEY


def create_yoomoney_payment(order: Order) -> dict:
    payment_data = {
        "confirmation_url": None,
        "payment_id": None,
    }
    try:
        payment = Payment.create(
            {
                "amount": {
                    "value": order.total_incl_tax,
                    "currency": order.currency,
                },
                "confirmation": {
                    "type": "redirect",
                    "return_url": settings.PAYMENT_REDIRECT_URL,
                },
                "capture": True,
                "description": f"Оплата заказа: {order.number}",
            },
            order.number,
        )
        payment_data = {
            "confirmation_url": payment.confirmation.confirmation_url,
            "payment_id": payment.id,
        }
    except Exception as error:
        logger.exception("Could not create yookassa payment: %s", error)
    return payment_data
