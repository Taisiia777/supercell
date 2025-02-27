import logging
import asyncio
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from aiogram import Bot
from django.contrib.auth import get_user_model
from django.utils import timezone
from .send import send_message_to_user
from core.models import ScheduledMailing, User, Role
from aiogram import Bot, types
from django.conf import settings
# from api.mailing.send import send_message_to_user, process_mailing
from api.mailing.send import send_message_to_user, process_scheduled_mailings as process_mailing
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)
User = get_user_model()
bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")



@shared_task(name="api.mailing.process_scheduled")
def process_scheduled_mailings(message, image):
    logger.info("Обработка запланированных рассылок")
    
    try:
        mailings = ScheduledMailing.objects.filter(
            scheduled_time__lte=timezone.now(),
            is_sent=False
        )
        
        logger.info(f"Найдено {mailings.count()} рассылок для обработки")

        for mailing in mailings:
            logger.info(f"Обработка рассылки ID: {mailing.id}")
            
            # Создаем новый event loop для асинхронного кода
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                # Запускаем асинхронную рассылку
                loop.run_until_complete(process_mailing(mailing, image))
            finally:
                loop.close()

        return True

    except Exception as error:
        logger.exception(f"Ошибка в process_scheduled_mailings: {error}")
        return False