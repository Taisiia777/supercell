from django.db import models
from oscar.apps.order.abstract_models import AbstractOrder

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
    updated_dt = models.DateTimeField(auto_now=True, blank=True, null=True)


from oscar.apps.order.models import *  # noqa
