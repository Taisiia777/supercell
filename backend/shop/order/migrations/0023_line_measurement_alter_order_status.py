# Generated by Django 4.2.9 on 2024-03-05 10:14

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("order", "0022_shippingaddress_district_alter_order_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="line",
            name="measurement",
            field=models.CharField(
                blank=True, max_length=255, null=True, verbose_name="Единица измерения"
            ),
        ),
        migrations.AlterField(
            model_name="order",
            name="status",
            field=models.CharField(
                blank=True,
                choices=[
                    ("NEW", "Заказ оформлен"),
                    ("PAID", "Заказ оплачен"),
                    ("PROCESSING", "Сборка заказа"),
                    ("SENT", "Курьер в пути"),
                    ("DELIVERED", "Заказ выдан"),
                    ("CANCELLED", "Заказ отменен"),
                ],
                max_length=100,
            ),
        ),
    ]
