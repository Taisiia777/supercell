# Generated by Django 4.2.7 on 2023-12-28 12:01

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("order", "0017_order_seller"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="updated_dt",
            field=models.DateTimeField(auto_now=True, null=True),
        ),
    ]
