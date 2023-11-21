from django.db import models
from oscar.apps.order.abstract_models import AbstractOrder


class Order(AbstractOrder):
    custom_field = models.CharField(max_length=255, blank=True, null=True)


from oscar.apps.order.models import *  # noqa
