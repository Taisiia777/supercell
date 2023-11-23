from django.db import models
from django.db.models import ForeignKey
from oscar.apps.catalogue.abstract_models import AbstractProduct

from core.models import DavDamer


class Product(AbstractProduct):
    davdamer = ForeignKey(DavDamer, on_delete=models.PROTECT, null=True)


from oscar.apps.catalogue.models import *  # noqa
