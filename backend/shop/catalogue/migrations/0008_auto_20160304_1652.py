# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.core.validators
import oscar.core.validators


class Migration(migrations.Migration):
    dependencies = [
        ("catalogue", "0007_auto_20151207_1440"),
    ]

    operations = [
        migrations.AlterField(
            model_name="productattribute",
            name="code",
            field=models.SlugField(
                max_length=128,
                verbose_name="Code",
                validators=[
                    django.core.validators.RegexValidator(
                        regex=r"^[a-zA-Z_][0-9a-zA-Z_]*$",
                        message="Code can only contain the letters a-z, A-Z, digits, and underscores, and can't start with a digit.",
                    ),
                    oscar.core.validators.non_python_keyword,
                ],
            ),
        ),
    ]
