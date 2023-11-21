from django.contrib.auth import get_user_model
from django.db import models
from oscar.apps.partner.abstract_models import AbstractPartner

DjangoUser = get_user_model()


class Partner(AbstractPartner):  # this is a Seller
    davdamer = models.ForeignKey(
        "core.DavDamer", on_delete=models.PROTECT, related_name="sellers"
    )
    image = models.ImageField(upload_to="images/sellers", blank=True, null=True)

    class Meta:
        verbose_name = "Продавец"
        verbose_name_plural = "Продавцы"


class Seller(Partner):
    class Meta:
        proxy = True


from oscar.apps.partner.models import *  # noqa
