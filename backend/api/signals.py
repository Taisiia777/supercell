from django.dispatch import receiver
from oscarapi.signals import oscarapi_post_checkout
from oscarapi.utils.loading import get_api_class

CheckoutView = get_api_class("views.checkout", "CheckoutView")


@receiver(oscarapi_post_checkout, sender=CheckoutView)
def created_api_callback_handler(sender, order, user, **kwargs):
    print("Caught oscarapi_post_checkout signal")
