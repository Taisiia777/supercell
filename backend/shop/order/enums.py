from django.db import models


class OrderStatus(models.TextChoices):
    NEW = "NEW", "Создан"
    PAID = "PAID", "Оплачен"
    PROCESSING = "PROCESSING", "В обработке"
    READY = "READY", "Передан курьеру"
    SENT = "SENT", "Курьер в пути"
    DELIVERED = "DELIVERED", "Выдан"
    CANCELLED = "CANCELLED", "Отменён"
