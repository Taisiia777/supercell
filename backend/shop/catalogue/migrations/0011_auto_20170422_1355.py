# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2017-04-22 12:55
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("catalogue", "0010_auto_20170420_0439"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="productimage",
            unique_together=set([]),
        ),
    ]
