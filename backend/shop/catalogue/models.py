from django.db import models
from django.db.models import ForeignKey
from oscar.apps.catalogue.abstract_models import AbstractProduct

from core.models import DavDamer


class Product(AbstractProduct):
    davdamer = ForeignKey(DavDamer, on_delete=models.PROTECT, null=True)
    seller = ForeignKey(
        "partner.Seller", on_delete=models.PROTECT, null=True, related_name="products"
    )


from oscar.apps.catalogue.models import *  # noqa
