
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_refcodealter'),
    ]

    operations = [
        # Создание модели ReferralCode с дополнительными настройками
        migrations.CreateModel(
            name='ReferralCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=20, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE, 
                    related_name='referral_code_obj', 
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'verbose_name': 'Реферальный код',
                'verbose_name_plural': 'Реферальные коды',
            },
        ),

        # Создание модели ReferralRelationship
        migrations.CreateModel(
            name='ReferralRelationship',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('referrer', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, 
                    related_name='rel_referrals', 
                    to=settings.AUTH_USER_MODEL
                )),
                ('referred', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, 
                    related_name='rel_referred_by', 
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'verbose_name': 'Реферальная связь',
                'verbose_name_plural': 'Реферальные связи',
                'unique_together': [['referred']],
            },
        ),

        # Добавление индексов для оптимизации
        migrations.AddIndex(
            model_name='referralcode',
            index=models.Index(fields=['code'], name='referral_code_idx'),
        ),
        migrations.AddIndex(
            model_name='referralrelationship',
            index=models.Index(fields=['referrer', 'referred'], name='referral_relationship_idx'),
        ),
    ]