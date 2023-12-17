from django.dispatch import receiver
from oscarapi.signals import oscarapi_post_checkout


@receiver(oscarapi_post_checkout)
def created_api_callback_handler(sender, order, user, **kwargs):
    line = order.lines.first()
    order.seller = line.partner
    order.save(update_fields=["seller"])
