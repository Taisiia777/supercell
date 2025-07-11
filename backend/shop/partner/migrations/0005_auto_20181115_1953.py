# Generated by Django 2.0.7 on 2018-11-15 19:53

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("partner", "0004_auto_20160107_1755"),
    ]

    operations = [
        migrations.AlterField(
            model_name="partner",
            name="name",
            field=models.CharField(
                blank=True, db_index=True, max_length=128, verbose_name="Name"
            ),
        ),
        migrations.AlterField(
            model_name="stockalert",
            name="date_created",
            field=models.DateTimeField(
                auto_now_add=True, db_index=True, verbose_name="Date Created"
            ),
        ),
    ]
