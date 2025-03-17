from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0015_refcode'),  # Укажи здесь правильное имя предыдущей миграции
    ]

    operations = [
        migrations.RunSQL(
            # Прямая SQL-команда для PostgreSQL
            sql="""
            CREATE OR REPLACE FUNCTION generate_random_code(length INTEGER) RETURNS TEXT AS $$
            DECLARE
                chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                result TEXT := '';
                i INTEGER := 0;
            BEGIN
                FOR i IN 1..length LOOP
                    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
                END LOOP;
                RETURN result;
            END;
            $$ LANGUAGE plpgsql;

            UPDATE core_user 
            SET referral_code = CONCAT(
                generate_random_code(8),
                id  
            )
            WHERE referral_code IS NULL;
            
            DROP FUNCTION generate_random_code;
            """,
            
            reverse_sql="SELECT 1;"
        ),
    ]