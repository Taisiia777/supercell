from django.db import models


class OrderStatus(models.TextChoices):
    NEW = "NEW", "Заказ оформлен"
    PAID = "PAID", "Заказ оплачен"
    PROCESSING = "PROCESSING", "Сборка заказа"
    SENT = "SENT", "Курьер в пути"
    DELIVERED = "DELIVERED", "Заказ выдан"
    CANCELLED = "CANCELLED", "Заказ отменен"
