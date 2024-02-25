from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    telegram_chat_id = models.BigIntegerField(null=True, blank=True, unique=True)

    receiver_name = models.CharField(
        max_length=50, verbose_name="Имя получателя", blank=True, null=True
    )
    receiver_phone = models.CharField(
        max_length=16, verbose_name="Телефон получателя", blank=True, null=True
    )
    delivery_country = models.CharField(
        max_length=30, verbose_name="Страна доставки", blank=True, null=True
    )
    delivery_city = models.CharField(
        max_length=50, verbose_name="Город доставки", blank=True, null=True
    )
    delivery_address = models.CharField(
        max_length=255, verbose_name="Адрес доставки", blank=True, null=True
    )
    delivery_district = models.CharField(
        max_length=100, verbose_name="ЖК", blank=True, null=True
    )
    delivery_notes = models.CharField(
        max_length=255, verbose_name="Комментарий к доставке", blank=True, null=True
    )


class DavDamer(models.Model):
    name = models.CharField(max_length=128, db_index=True)
    user = models.OneToOneField(User, on_delete=models.PROTECT, related_name="davdamer")
    image = models.ImageField(upload_to="images/avatars", null=True, blank=True)
    registered_dt = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "ДавДамер"
        verbose_name_plural = "ДавДамеры"


class City(models.Model):
    name = models.CharField(max_length=128, db_index=True, unique=True)

    def __str__(self):
        return self.name
