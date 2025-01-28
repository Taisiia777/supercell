import logging
import asyncio
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from aiogram import Bot, types
from django.contrib.auth import get_user_model
from core.models import ScheduledMailing, User, Role
from aiogram import Bot, types
from django.conf import settings
from asgiref.sync import sync_to_async
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)
User = get_user_model()
bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")



async def process_mailing(mailing, image):
    bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
    try:
        # Получаем пользователей асинхронно
        users = await sync_to_async(list)(User.objects.exclude(telegram_chat_id__isnull=True))
        
        for user in users:
            try:
                await send_message_to_user(
                    bot=bot,
                    chat_id=user.telegram_chat_id,
                    message=mailing.message,
                    image=image
                )
                logger.info(f"Сообщение отправлено пользователю {user.id}")
            except Exception as e:
                logger.error(f"Ошибка отправки пользователю {user.id}: {e}")
        
        # Обновляем статус рассылки асинхронно
        mailing.is_sent = True
        await sync_to_async(mailing.save)()
        
    finally:
        await bot.session.close()

async def send_message_to_user(bot: Bot, chat_id: int, message: str, image=None) -> bool:
    try:
        keyboard = types.InlineKeyboardMarkup(
            inline_keyboard=[[
                types.InlineKeyboardButton(
                    text="В магазин",
                    web_app=types.WebAppInfo(url="https://shop.mamostore.ru")
                )
            ]]
        )

        if image:
            image_input = types.BufferedInputFile(
                file=image,
                filename='mailing_image.jpg'
            )
            
            await bot.send_photo(
                chat_id=chat_id,
                photo=image_input,
                caption=message,
                reply_markup=keyboard
            )
        else:
            await bot.send_message(
                chat_id=chat_id,
                text=message,
                reply_markup=keyboard
            )
        return True
    except Exception as e:
        logger.error(f"Ошибка отправки сообщения пользователю {chat_id}: {str(e)}")
        return False


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