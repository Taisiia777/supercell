# Generated by Django 4.2.11 on 2024-03-20 11:18

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("order", "0024_order_payment_id_order_payment_link"),
    ]

    operations = [
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                blank=True,
                choices=[
                    ("NEW", "Ожидает оплаты"),
                    ("PAID", "Оплачен. Ожидает обработки"),
                    ("PROCESSING", "Оплачен. В процессе обработки"),
                    ("DELIVERED", "Завершен"),
                    ("CANCELLED", "Отменен"),
                ],
                max_length=100,
            ),
        ),
    ]
