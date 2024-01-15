from django.db import models
from django.db.models import ForeignKey
from oscar.apps.catalogue.abstract_models import AbstractProduct


class Product(AbstractProduct):
    seller = ForeignKey(
        "partner.Seller", on_delete=models.PROTECT, null=True, related_name="products"
    )


from oscar.apps.catalogue.models import *  # noqa
