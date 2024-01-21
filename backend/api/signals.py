from django.dispatch import receiver
from oscarapi.signals import oscarapi_post_checkout

from celery_app import app as celery_app
from shop.order.enums import OrderStatus


@receiver(oscarapi_post_checkout)
def created_api_callback_handler(sender, order, user, **kwargs):
    line = order.lines.first()
    order.seller = line.partner
    order.status = OrderStatus.NEW
    order.save(update_fields=["seller", "status"])

    celery_app.send_task("api.shop.new_order", args=(order.pk,))
