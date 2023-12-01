from django.db import models
from oscar.apps.order.abstract_models import AbstractOrder

from shop.order.enums import OrderStatus


class Order(AbstractOrder):
    custom_field = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=100, blank=True, choices=OrderStatus.choices)


from oscar.apps.order.models import *  # noqa
