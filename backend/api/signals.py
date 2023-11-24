from django.dispatch import receiver
from oscarapi.signals import oscarapi_post_checkout


@receiver(oscarapi_post_checkout)
def created_api_callback_handler(sender, order, user, **kwargs):
    print("Caught oscarapi_post_checkout signal")
