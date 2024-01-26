from django.db import models
from django.db.models import ForeignKey
from oscar.apps.catalogue.abstract_models import AbstractProduct
from oscar.core.loading import get_model

OrderLine = get_model("order", "Line")


class Product(AbstractProduct):
    seller = ForeignKey(
        "partner.Seller", on_delete=models.PROTECT, null=True, related_name="products"
    )

    def get_orders_count(self) -> int:
        return OrderLine.objects.filter(product=self).count()


from oscar.apps.catalogue.models import *  # noqa
