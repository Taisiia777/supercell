# Новая миграция 0018_remove_referral_models.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0017_referral_models'),
    ]
    
    operations = [
        migrations.DeleteModel(
            name='ReferralRelationship',
        ),
        migrations.DeleteModel(
            name='ReferralCode',
        ),
    ]