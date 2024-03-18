import logging

from rest_framework.reverse import reverse

from shop.order.models import Order
from yookassa import Configuration, Payment
from django.conf import settings


logger = logging.getLogger(__name__)

Configuration.account_id = settings.YOOKASSA_SHOP_ID
Configuration.secret_key = settings.YOOKASSA_API_KEY


def make_redirect_url(request, order: Order) -> str:
    url = reverse("api_confirm_payment", kwargs={"order_number": order.number})
    if request:
        url = request.build_absolute_uri(url)
    return url


def create_yoomoney_payment(order: Order, request=None) -> dict:
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
                    "return_url": make_redirect_url(request, order),
                },
                "capture": True,
                "description": f"Оплата заказа: {order.number}",
                "receipt": {
                    "customer": {
                        "email": "customer@example.com",
                    },
                    "items": [
                        {
                            "description": line.product.title,
                            "quantity": line.quantity,
                            "amount": {
                                "value": line.line_price_incl_tax,
                                "currency": order.currency,
                            },
                            "vat_code": "1",
                        }
                        for line in order.lines.all()
                    ],
                },
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
