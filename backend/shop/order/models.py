from django.db import models
from oscar.apps.address.abstract_models import AbstractShippingAddress
from oscar.apps.order.abstract_models import AbstractOrder, AbstractLine

from shop.order.enums import OrderStatus


class Order(AbstractOrder):
    custom_field = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=100, blank=True, choices=OrderStatus.choices)
    seller = models.ForeignKey(
        "partner.Partner",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="orders",
    )
    payment_link = models.URLField(
        null=True, blank=True, verbose_name="Ссылка на оплату заказа."
    )
    payment_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="id заказа после оплаты на Юкассе",
    )
    updated_dt = models.DateTimeField(auto_now=True, blank=True, null=True)


class ShippingAddress(AbstractShippingAddress):
    district = models.CharField(
        blank=True, null=True, max_length=100, verbose_name="ЖК"
    )
    date = models.DateField(blank=True, null=True)
    time = models.CharField(blank=True, null=True, max_length=30)


class Line(AbstractLine):
    measurement = models.CharField(
        "Единица измерения", max_length=255, blank=True, null=True
    )


from oscar.apps.order.models import *  # noqa
