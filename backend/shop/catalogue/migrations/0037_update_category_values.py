from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('catalogue', '0036_update_game_values'),  # Замените на актуальную зависимость
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='filters_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('NEW_ACCOUNT', 'Новый аккаунт'),
                    ('PROMO', 'Акции'),
                    ('GEMS', 'Гемы'),
                    ('PASS', 'Пропуски'),

                ],
                max_length=20,
                null=True,
                verbose_name='Тип для фильтрации'
            ),
        ),
    ]