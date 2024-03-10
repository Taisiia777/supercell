from django.db import transaction
from django.dispatch import receiver
from oscar.core.loading import get_model
from oscarapi.signals import oscarapi_post_checkout

from shop.order.enums import OrderStatus
from shop.payment.yookassa import create_yoomoney_payment

OrderLine = get_model("order", "Line")


@receiver(oscarapi_post_checkout)
def created_api_callback_handler(sender, order, user, **kwargs):
    yoomoney_data = create_yoomoney_payment(order=order)

    with transaction.atomic():
        line = order.lines.first()
        order.seller = line.partner
        order.status = OrderStatus.NEW
        order.payment_link = yoomoney_data["confirmation_url"]
        order.payment_id = yoomoney_data["payment_id"]
        order.save(update_fields=["seller", "status", "payment_link", "payment_id"])

        updated_lines = []
        for line in order.lines.all():
            line.measurement = line.stockrecord.measurement
            updated_lines.append(line)
        OrderLine.objects.bulk_update(updated_lines, ["measurement"])
