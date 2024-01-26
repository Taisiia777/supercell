from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Sum
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
    city = models.ForeignKey(
        "core.City",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="sellers",
    )
    market = models.CharField(max_length=255, null=True, blank=True)
    address = models.CharField(max_length=255, null=True)
    description = models.TextField(null=True)

    enot_shop_id = models.CharField(
        null=True, blank=True, verbose_name="Идентификатор кассы"
    )
    enot_secret_key = models.CharField(
        null=True, blank=True, verbose_name="Секретный ключ кассы"
    )
    enot_webhook_key = models.CharField(
        null=True,
        blank=True,
        verbose_name="Дополнительный ключ для проверки подписи в хуках оплаты",
    )

    registered_dt = models.DateTimeField(auto_now_add=True, null=True)
    updated_dt = models.DateTimeField(auto_now=True, null=True)

    def get_orders_total(self):
        return self.orders.aggregate(total=Sum("total_incl_tax"))["total"]

    class Meta:
        verbose_name = "Продавец"
        verbose_name_plural = "Продавцы"


class Seller(Partner):
    class Meta:
        proxy = True


from oscar.apps.partner.models import *  # noqa
