from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0012_emailcoderequest_game'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='hay_day_email',
            field=models.EmailField(null=True),
        ),
    ]





