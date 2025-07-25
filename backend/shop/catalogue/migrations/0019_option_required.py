# Generated by Django 2.1 on 2019-06-17 17:42

from django.db import migrations, models


def migrate_product_options(apps, schema_editor):
    """
    Migrate product Option.type field to required
    Set Option.type='text'
    """
    Option = apps.get_model("catalogue", "Option")
    for option in Option.objects.all():
        if option.type == "Required":
            option.required = True
        option.type = "text"
        option.save()


class Migration(migrations.Migration):
    dependencies = [
        ("catalogue", "0018_auto_20191220_0920"),
    ]

    operations = [
        migrations.AddField(
            model_name="option",
            name="required",
            field=models.BooleanField(
                default=False, verbose_name="Is option required?"
            ),
        ),
        migrations.RunPython(migrate_product_options, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="option",
            name="type",
            field=models.CharField(
                choices=[
                    ("text", "Text"),
                    ("integer", "Integer"),
                    ("boolean", "True / False"),
                    ("float", "Float"),
                    ("date", "Date"),
                ],
                default="text",
                max_length=255,
                verbose_name="Type",
            ),
        ),
    ]
