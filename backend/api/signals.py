from django.db import transaction
from django.dispatch import receiver
from oscar.core.loading import get_model
from oscarapi.signals import oscarapi_post_checkout

from shop.order.enums import OrderStatus

OrderLine = get_model("order", "Line")


@receiver(oscarapi_post_checkout)
def created_api_callback_handler(sender, order, user, **kwargs):
    with transaction.atomic():
        line = order.lines.first()
        order.seller = line.partner
        order.status = OrderStatus.NEW
        order.save(update_fields=["seller", "status"])

        updated_lines = []
        for line in order.lines.all():
            line.measurement = line.stockrecord.measurement
            updated_lines.append(line)
        OrderLine.objects.bulk_update(updated_lines, ["measurement"])
