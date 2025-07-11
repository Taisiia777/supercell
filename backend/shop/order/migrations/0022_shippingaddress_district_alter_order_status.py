# Generated by Django 4.2.10 on 2024-02-25 22:12

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("order", "0021_shippingaddress_date_shippingaddress_time_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="shippingaddress",
            name="district",
            field=models.CharField(
                blank=True, max_length=100, null=True, verbose_name="ЖК"
            ),
        ),
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                blank=True,
                choices=[
                    ("NEW", "Создан"),
                    ("PAID", "Оплачен"),
                    ("PROCESSING", "В обработке"),
                    ("READY", "Передан курьеру"),
                    ("SENT", "Курьер в пути"),
                    ("DELIVERED", "Выдан"),
                    ("CANCELLED", "Отменён"),
                ],
                max_length=100,
            ),
        ),
    ]
