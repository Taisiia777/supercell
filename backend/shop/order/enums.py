from django.db import models


class OrderStatus(models.TextChoices):
    NEW = "NEW", "Новый"
    PAID = "PAID", "Оплачен"
    PROCESSING = "PROCESSING", "В обработке"
    READY = "READY", "Собран продавцом"
    SENT = "SENT", "Отправлен"
    DELIVERED = "DELIVERED", "Доставлен"
    REFUND = "REFUND", "Возврат"
    CANCELLED = "CANCELLED", "Отменён"
