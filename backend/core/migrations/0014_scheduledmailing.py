from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0013_update_hay_day_email'),  # Замените на последнюю существующую миграцию
    ]

    operations = [
        migrations.CreateModel(
            name='ScheduledMailing',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField()),
                ('image', models.ImageField(blank=True, null=True, upload_to='mailings/')),
                ('scheduled_time', models.DateTimeField()),
                ('is_sent', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-scheduled_time'],
            },
        ),
    ]