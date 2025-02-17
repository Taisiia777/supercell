# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from django.db import models, migrations

class Migration(migrations.Migration):
    dependencies = [
        ('catalogue', '0037_update_category_values'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='friend_url',
            field=models.URLField(blank=True, null=True, verbose_name='Ссылка в друзья'),
        ),
    ]