from django.db import models
from django.db.models import ForeignKey
from oscar.apps.catalogue.abstract_models import AbstractProduct
from oscar.core.loading import get_model

Seller = get_model("partner", "Seller")


class Product(AbstractProduct):
    seller = ForeignKey(Seller, on_delete=models.PROTECT, null=True)


from oscar.apps.catalogue.models import *  # noqa
