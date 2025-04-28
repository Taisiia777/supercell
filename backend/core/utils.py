# core/utils.py
import logging
from aiogram import Bot

logger = logging.getLogger(__name__)

async def get_telegram_user_avatar(bot: Bot, user_id: int) -> str:
    """Получает URL аватарки пользователя Telegram"""
    try:
        user_profile_photos = await bot.get_user_profile_photos(user_id, limit=1)
        if user_profile_photos.total_count > 0:
            file_id = user_profile_photos.photos[0][-1].file_id
            file_info = await bot.get_file(file_id)
            file_path = file_info.file_path
            return f"https://api.telegram.org/file/bot{bot.token}/{file_path}"
        return None
    except Exception as e:
        logger.exception(f"Ошибка при получении фото профиля для пользователя {user_id}: {e}")
        return None