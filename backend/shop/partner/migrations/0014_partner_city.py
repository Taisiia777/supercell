# Generated by Django 4.2.7 on 2024-01-11 21:27

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0004_city"),
        ("partner", "0013_remove_partner_city"),
    ]

    operations = [
        migrations.AddField(
            model_name="partner",
            name="city",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="core.city",
            ),
        ),
    ]
