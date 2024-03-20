from django.db import models


class OrderStatus(models.TextChoices):
    NEW = "NEW", "Ожидает оплаты"
    PAID = "PAID", "Оплачен. Ожидает обработки"
    PROCESSING = "PROCESSING", "Оплачен. В процессе обработки"
    DELIVERED = "DELIVERED", "Завершен"
    CANCELLED = "CANCELLED", "Отменен"
