# Generated by Django 4.2.9 on 2024-01-23 21:56

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0005_davdamer_image"),
        ("partner", "0014_partner_city"),
    ]

    operations = [
        migrations.AddField(
            model_name="partner",
            name="enot_secret_key",
            field=models.CharField(
                blank=True, null=True, verbose_name="Секретный ключ кассы"
            ),
        ),
        migrations.AddField(
            model_name="partner",
            name="enot_shop_id",
            field=models.CharField(
                blank=True, null=True, verbose_name="Идентификатор кассы"
            ),
        ),
        migrations.AddField(
            model_name="partner",
            name="enot_webhook_key",
            field=models.CharField(
                blank=True,
                null=True,
                verbose_name="Дополнительный ключ для проверки подписи в хуках оплаты",
            ),
        ),
        migrations.AlterField(
            model_name="partner",
            name="city",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="sellers",
                to="core.city",
            ),
        ),
    ]
