import logging
from django.conf import settings
from core.models import User

logger = logging.getLogger(__name__)

def get_referral_link(user):
    """Формирует реферальную ссылку для пользователя"""
    return user.get_referral_link()

def add_referral(referrer_code, referred_user):
    """Добавляет связь реферала с рефереером"""
    try:
        # Проверяем, что пользователь еще не является рефералом
        if referred_user.referred_by is not None:
            return False
        
        # Находим пользователя-рефереера по коду
        try:
            referrer = User.objects.get(referral_code=referrer_code)
        except User.DoesNotExist:
            logger.warning(f"Неверный реферальный код: {referrer_code}")
            return False
        
        # Проверяем, что пользователь не пытается стать своим собственным рефералом
        if referrer == referred_user:
            return False
        
        # Создаем связь
        referred_user.referred_by = referrer
        referred_user.save(update_fields=['referred_by'])
        
        # Здесь можно добавить логику начисления бонусов
        
        return True
    except Exception as e:
        logger.exception(f"Ошибка при обработке реферального кода: {e}")
        return False