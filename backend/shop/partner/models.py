from django.contrib.auth import get_user_model
from django.db import models
from oscar.apps.partner.abstract_models import AbstractPartner

DjangoUser = get_user_model()


class Partner(AbstractPartner):  # this is a Seller
    davdamer = models.ForeignKey(
        "core.DavDamer", on_delete=models.PROTECT, related_name="sellers"
    )
    image = models.ImageField(upload_to="images/sellers", blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True)
    country = models.CharField(max_length=255, null=True, blank=True, default="Россия")
    city = models.CharField(max_length=255, null=True, blank=True)
    market = models.CharField(max_length=255, null=True, blank=True)
    address = models.CharField(max_length=255, null=True)
    description = models.TextField(null=True)

    registered_dt = models.DateTimeField(auto_now_add=True, null=True)
    updated_dt = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name = "Продавец"
        verbose_name_plural = "Продавцы"


class Seller(Partner):
    class Meta:
        proxy = True


from oscar.apps.partner.models import *  # noqa
