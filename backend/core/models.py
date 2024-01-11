from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    telegram_chat_id = models.BigIntegerField(null=True, blank=True, unique=True)


class DavDamer(models.Model):
    name = models.CharField(max_length=128, db_index=True)
    user = models.OneToOneField(User, on_delete=models.PROTECT, related_name="davdamer")
    registered_dt = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "ДавДамер"
        verbose_name_plural = "ДавДамеры"


class City(models.Model):
    name = models.CharField(max_length=128, db_index=True, unique=True)

    def __str__(self):
        return self.name
