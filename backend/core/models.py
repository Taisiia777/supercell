from django.contrib.auth.models import AbstractUser
from django.db import models
from oscar.core.loading import get_model

Order = get_model("order", "Order")


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
    brawl_stars_email = models.EmailField(null=True)
    clash_of_clans_email = models.EmailField(null=True)
    clash_royale_email = models.EmailField(null=True)
    stumble_guys_email = models.EmailField(null=True)


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


class EmailCodeRequest(models.Model):
    email = models.EmailField()
    is_successful = models.BooleanField(default=None, null=True)
    game = models.CharField(max_length=50, null=True)

    created_dt = models.DateTimeField(auto_now_add=True)
    updated_dt = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Запрос кода"
        verbose_name_plural = "Запросы кода"


class OrderLoginData(models.Model):
    order_line = models.ForeignKey(
        "order.Line", on_delete=models.CASCADE, related_name="login_data", null=True
    )
    account_id = models.CharField(max_length=150, verbose_name="ID аккаунта", null=True)
    code = models.CharField(
        max_length=15, verbose_name="Код для входа", null=True, blank=True
    )

    created_dt = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Данные для входа"
        verbose_name_plural = "Данные для входа"
        ordering = ["-created_dt"]
