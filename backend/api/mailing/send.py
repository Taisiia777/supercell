# import logging
# import asyncio
# from django.utils import timezone
# from celery import shared_task
# from django.conf import settings
# from aiogram import Bot, types
# from django.contrib.auth import get_user_model
# from core.models import ScheduledMailing, User, Role
# from aiogram import Bot, types
# from django.conf import settings
# from asgiref.sync import sync_to_async
# from asgiref.sync import sync_to_async
# from celery import group

# logger = logging.getLogger(__name__)
# User = get_user_model()
# bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")



# async def process_mailing(mailing, image):
#     bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
#     try:
#         # Получаем пользователей асинхронно
#         users = await sync_to_async(list)(User.objects.exclude(telegram_chat_id__isnull=True))
        
#         for user in users:
#             try:
#                 await send_message_to_user(
#                     bot=bot,
#                     chat_id=user.telegram_chat_id,
#                     message=mailing.message,
#                     image=image
#                 )
#                 logger.info(f"Сообщение отправлено пользователю {user.id}")
#             except Exception as e:
#                 logger.error(f"Ошибка отправки пользователю {user.id}: {e}")
        
#         # Обновляем статус рассылки асинхронно
#         mailing.is_sent = True
#         await sync_to_async(mailing.save)()
        
#     finally:
#         await bot.session.close()

# async def send_message_to_user(bot: Bot, chat_id: int, message: str, image=None) -> bool:
#     try:
#         keyboard = types.InlineKeyboardMarkup(
#             inline_keyboard=[[
#                 types.InlineKeyboardButton(
#                     text="В магазин",
#                     web_app=types.WebAppInfo(url="https://shop.mamostore.ru")
#                 )
#             ]]
#         )

#         if image:
#             image_input = types.BufferedInputFile(
#                 file=image,
#                 filename='mailing_image.jpg'
#             )
            
#             await bot.send_photo(
#                 chat_id=chat_id,
#                 photo=image_input,
#                 caption=message,
#                 reply_markup=keyboard
#             )
#         else:
#             await bot.send_message(
#                 chat_id=chat_id,
#                 text=message,
#                 reply_markup=keyboard
#             )
#         return True
#     except Exception as e:
#         logger.error(f"Ошибка отправки сообщения пользователю {chat_id}: {str(e)}")
#         return False


# @shared_task(name="api.mailing.process_scheduled")
# def process_scheduled_mailings(message, image):
#     logger.info("Обработка запланированных рассылок")
    
#     try:
#         mailings = ScheduledMailing.objects.filter(
#             scheduled_time__lte=timezone.now(),
#             is_sent=False
#         )
        
#         logger.info(f"Найдено {mailings.count()} рассылок для обработки")

#         for mailing in mailings:
#             logger.info(f"Обработка рассылки ID: {mailing.id}")
            
#             # Создаем новый event loop для асинхронного кода
#             loop = asyncio.new_event_loop()
#             asyncio.set_event_loop(loop)
            
#             try:
#                 # Запускаем асинхронную рассылку
#                 loop.run_until_complete(process_mailing(mailing, image))
#             finally:
#                 loop.close()

#         return True

#     except Exception as error:
#         logger.exception(f"Ошибка в process_scheduled_mailings: {error}")
#         return False


import logging 
import asyncio
import time
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from aiogram import Bot, types
from django.contrib.auth import get_user_model
from core.models import ScheduledMailing, User, Role
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)
User = get_user_model()

# Константы для настройки
BATCH_SIZE = 100  # Размер пакета пользователей
RATE_LIMIT = 30  # Максимальное количество сообщений в секунду

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

# Обрабатывает одну рассылку (для совместимости с существующим кодом)
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

async def process_user_batch(user_batch, message, image):
    """Обрабатывает пакет пользователей асинхронно"""
    bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
    try:
        start_time = time.time()
        success_count = 0
        
        for user in user_batch:
            try:
                success = await send_message_to_user(
                    bot=bot,
                    chat_id=user.telegram_chat_id,
                    message=message,
                    image=image
                )
                if success:
                    success_count += 1
                
                # Ограничение скорости отправки
                if time.time() - start_time < 1 and success_count >= RATE_LIMIT:
                    await asyncio.sleep(1 - (time.time() - start_time))
                    start_time = time.time()
                    success_count = 0
                    
            except Exception as e:
                logger.error(f"Ошибка отправки пользователю {user.id}: {e}")
                
    finally:
        await bot.session.close()
        
    return len(user_batch)

@shared_task(name="api.mailing.process_batch")
def process_user_batch_task(user_ids, message, image, mailing_id=None):
    """Обрабатывает пакет пользователей"""
    try:
        # Получаем пользователей по ID
        users = list(User.objects.filter(id__in=user_ids, telegram_chat_id__isnull=False))
        
        if not users:
            return 0
            
        # Создаем event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            processed = loop.run_until_complete(process_user_batch(users, message, image))
            return processed
        finally:
            loop.close()
            
    except Exception as e:
        logger.exception(f"Ошибка в process_user_batch_task: {e}")
        return 0

@shared_task(name="api.mailing.process_scheduled")
def process_scheduled_mailings(message=None, image=None, *args, **kwargs):
    """
    Обрабатывает запланированные рассылки
    
    Поддерживает два режима:
    1. Без аргументов - обрабатывает все запланированные рассылки
    2. С аргументами message, image - обрабатывает конкретную рассылку
    """
    logger.info("Обработка запланированных рассылок")

    try:
        # Если переданы параметры message и image, значит это вызов для конкретной рассылки
        if message is not None:
            # Получаем все ID пользователей для рассылки
            user_ids = list(User.objects.exclude(telegram_chat_id__isnull=False).values_list('id', flat=True))
            total_users = len(user_ids)
            
            if not user_ids:
                logger.warning("Нет пользователей для рассылки")
                return True
                
            # Разбиваем на пакеты и отправляем задачи
            for i in range(0, total_users, BATCH_SIZE):
                batch = user_ids[i:i+BATCH_SIZE]
                process_user_batch_task.delay(
                    batch, 
                    message, 
                    image, 
                    None
                )
            
            return True
                
        # Иначе обрабатываем все запланированные рассылки
        mailings = ScheduledMailing.objects.filter(
            scheduled_time__lte=timezone.now(),
            is_sent=False
        )

        logger.info(f"Найдено {mailings.count()} рассылок для обработки")

        for mailing in mailings:
            logger.info(f"Обработка рассылки ID: {mailing.id}")
            
            # Получаем все ID пользователей для рассылки
            user_ids = list(User.objects.exclude(telegram_chat_id__isnull=True).values_list('id', flat=True))
            total_users = len(user_ids)
            
            if not user_ids:
                logger.warning("Нет пользователей для рассылки")
                mailing.is_sent = True
                mailing.save()
                continue
                
            # Подготавливаем изображение
            image_content = None
            if mailing.image:
                mailing.image.open('rb')
                image_content = mailing.image.read()
                mailing.image.close()
            
            # Разбиваем на пакеты и отправляем задачи
            for i in range(0, total_users, BATCH_SIZE):
                batch = user_ids[i:i+BATCH_SIZE]
                process_user_batch_task.delay(
                    batch, 
                    mailing.message, 
                    image_content, 
                    mailing.id
                )
            
            # Отмечаем как отправленную
            mailing.is_sent = True
            mailing.save()

        return True

    except Exception as error:
        logger.exception(f"Ошибка в process_scheduled_mailings: {error}")
        return False


