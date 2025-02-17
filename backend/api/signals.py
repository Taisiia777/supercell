import time

from django.db import transaction
from django.dispatch import receiver
from django.utils import timezone
from oscar.core.loading import get_model
from oscarapi.signals import oscarapi_post_checkout

from shop.order.enums import OrderStatus
from shop.payment.yookassa import create_yoomoney_payment
from core.models import OrderLoginData

OrderLine = get_model("order", "Line")


@receiver(oscarapi_post_checkout)
def created_api_callback_handler(sender, order, user, **kwargs):
    start_time = time.time()
    yoomoney_data = create_yoomoney_payment(order=order, request=sender.request)
    print(time.time() - start_time, "yoomoney latency")


    product_account_id = [
        {"product_id": product["product_id"], "account_id": product["account_id"], "code": product.get("code")}
        for product in sender.serializer.validated_data["products"]
    ]


    with transaction.atomic():
        order.status = OrderStatus.NEW
        order.payment_link = yoomoney_data["confirmation_url"]
        order.payment_id = yoomoney_data["payment_id"]
        order.guest_email = sender.serializer.validated_data["email"]
        order.save(
            update_fields=["status", "payment_link", "payment_id", "guest_email"]
        )

        updated_lines = []
        login_data = []
        now = timezone.now()

        for i, line in enumerate(order.lines.all()):
            line.measurement = line.stockrecord.measurement
            updated_lines.append(line)
            login_data.append(
                OrderLoginData(
                    order_line_id=line.pk,
                    account_id=product_account_id[i]["account_id"],
                    code=product_account_id[i]["code"],
                    created_dt=now,
                    )
                )

        OrderLoginData.objects.bulk_create(login_data)
        OrderLine.objects.bulk_update(updated_lines, ["measurement"])
