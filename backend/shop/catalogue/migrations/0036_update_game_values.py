from django.db import migrations


def update_game_values(apps, schema_editor):
    Product = apps.get_model('catalogue', 'Product')
    Product.objects.filter(game='hay_day').update(game='hay_day')


def reverse_game_values(apps, schema_editor):
    Product = apps.get_model('catalogue', 'Product')
    Product.objects.filter(game='hay_day').update(game='hay_day')


class Migration(migrations.Migration):
    dependencies = [
        ('catalogue', '0035_product_game'),  # замените на последнюю миграцию в вашем catalogue app
    ]

    operations = [
        migrations.RunPython(update_game_values, reverse_game_values),
    ]