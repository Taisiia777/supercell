# Новая миграция - если миграции 0015_refcode.py не была применена корректно
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0018_remove_referral_models'),  # Укажите последнюю миграцию
    ]

    operations = [
        # Проверка и добавление полей, если они не существуют
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='core_user' AND column_name='referral_code') THEN
                    ALTER TABLE core_user ADD COLUMN referral_code varchar(16) NULL UNIQUE;
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                              WHERE table_name='core_user' AND column_name='referred_by_id') THEN
                    ALTER TABLE core_user ADD COLUMN referred_by_id integer NULL 
                    REFERENCES core_user(id) ON DELETE SET NULL;
                END IF;
            END
            $$;
            """,
            reverse_sql="SELECT 1;"
        ),
        
        # Генерация реферальных кодов для существующих пользователей
        migrations.RunSQL(
            sql="""
            DO $$
            DECLARE
                user_record RECORD;
                random_code VARCHAR(8);
            BEGIN
                FOR user_record IN SELECT id FROM core_user WHERE referral_code IS NULL LOOP
                    -- Генерируем уникальный код
                    LOOP
                        random_code := '';
                        FOR i IN 1..8 LOOP
                            random_code := random_code || substring('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ceil(random() * 36)::integer, 1);
                        END LOOP;
                        
                        EXIT WHEN NOT EXISTS(SELECT 1 FROM core_user WHERE referral_code = random_code);
                    END LOOP;
                    
                    UPDATE core_user SET referral_code = random_code WHERE id = user_record.id;
                END LOOP;
            END
            $$;
            """,
            reverse_sql="SELECT 1;"
        ),
    ]