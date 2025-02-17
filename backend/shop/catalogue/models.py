from django.db import models
from django.db.models import ForeignKey
from oscar.apps.catalogue.abstract_models import AbstractProduct
from oscar.core.loading import get_model
from shop.catalogue.enums import LoginType, GameType, FiltersType

OrderLine = get_model("order", "Line")


class Product(AbstractProduct):
    seller = ForeignKey(
        "partner.Seller", on_delete=models.PROTECT, null=True, related_name="products"
    )

    country = models.CharField(
        max_length=255, null=True, blank=True, verbose_name="Страна производства"
    )
    is_vegan = models.BooleanField(null=True, blank=True, verbose_name="Веганский")
    is_sugar_free = models.BooleanField(
        null=True, blank=True, verbose_name="Без сахара"
    )
    is_gluten_free = models.BooleanField(
        null=True, blank=True, verbose_name="Без глютена"
    )
    is_dietary = models.BooleanField(null=True, blank=True, verbose_name="Диетический")
    login_type = models.CharField(
        choices=LoginType.choices, max_length=20, default=LoginType.LINK
    )
    filters_type = models.CharField(
        choices=FiltersType.choices, max_length=20, default=FiltersType.NEW_ACCOUNT
    )
    game = models.CharField(max_length=50, choices=GameType.choices, null=True)
    friend_url = models.URLField(null=True, blank=True, verbose_name="Ссылка в друзья")

    def get_orders_count(self) -> int:
        return OrderLine.objects.filter(product=self).count()


from oscar.apps.catalogue.models import *  # noqa
