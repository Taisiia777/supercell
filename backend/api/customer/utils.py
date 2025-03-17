import random
import string
from django.conf import settings

def generate_referral_code(length=8):
    """Генерирует случайный реферальный код"""
    import string
    import random
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=length))

def get_or_create_referral_code(user):
    """Получает существующий или создает новый реферальный код для пользователя"""
    if not user.referral_code:
        user.referral_code = user.generate_unique_code()
        user.save(update_fields=['referral_code'])
    return user.referral_code

def get_referral_link(user):
    """Создает полную реферальную ссылку для пользователя"""
    if not user:
        return None
    
    from django.conf import settings
    bot_username = getattr(settings, 'TELEGRAM_BOT_USERNAME', settings.BOT_TOKEN.split(':')[0])
    
    if not user.referral_code:
        user.referral_code = user.generate_unique_code()
        user.save(update_fields=['referral_code'])
        
    return f"https://t.me/{bot_username}?start={user.referral_code}"