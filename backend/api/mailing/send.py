
import logging
import asyncio
import time
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from aiogram import Bot, types
from django.contrib.auth import get_user_model
from core.models import ScheduledMailing, User

# Индекс, с которого начинать рассылку (чтобы продолжить прерванную рассылку)
START_INDEX = 0  # Измените на нужное значение, 0 для начала с первого пользователя

logger = logging.getLogger(__name__)
User = get_user_model()

# Оптимизированные константы для соблюдения лимитов Telegram
RATE_LIMIT = 150  # Максимальное количество сообщений в секунду

async def send_message_to_user(bot: Bot, chat_id: int, message: str, image=None) -> bool:
    """Отправляет сообщение пользователю без повторных попыток"""
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
        error_msg = str(e)
        # Только логируем ошибку, но не пытаемся отправить повторно
        return False

@shared_task(bind=True, name="api.mailing.process_immediate", queue="mailing")
def process_immediate_mailing_task(self, message, image_content=None, mailing_id=None):
    """Запускает немедленную рассылку в одном потоке с метриками"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Получаем всех пользователей с telegram_chat_id
        users = list(User.objects.exclude(telegram_chat_id__isnull=True))
        total_users = len(users)
        
        if not total_users:
            logger.warning("Нет пользователей для рассылки")
            return True
            
        return loop.run_until_complete(
            process_mailing_async(users, message, image_content, mailing_id)
        )
    finally:
        loop.close()


async def process_mailing_async(users, message, image_content, mailing_id=None):
    """Асинхронная обработка рассылки с метриками"""
    bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
    
    try:
        total_users = len(users)
        processed_users = 0
        successful_users = 0
        failed_users = 0
        
        # Для метрик
        start_time = time.time()
        last_metrics_time = start_time
        last_processed = 0
        
        # Создаем таймер для отправки метрик каждые 10 секунд
        def print_metrics():
            nonlocal last_metrics_time, last_processed
            current_time = time.time()
            elapsed = current_time - last_metrics_time
            messages_per_second = (processed_users - last_processed) / elapsed if elapsed > 0 else 0
            
            # Учитываем общий прогресс с учетом пропущенных пользователей
            global_processed = START_INDEX + processed_users
            global_total = total_users
            global_percent = (global_processed / global_total) * 100 if global_total > 0 else 0
            
            remaining = total_users - processed_users
            percent_complete = (processed_users / total_users) * 100 if total_users > 0 else 0
            
            logger.info(
                f"МЕТРИКИ РАССЫЛКИ: "
                f"Отправлено: {global_processed}/{global_total} ({global_percent:.1f}%) | "
                f"В текущей сессии: {processed_users}/{total_users} ({percent_complete:.1f}%) | "
                f"Успешно: {successful_users} | "
                f"Ошибок: {failed_users} | "
                f"Осталось: {remaining} | "
                f"Скорость: {messages_per_second:.1f} сообщ/сек"
            )
            
            last_metrics_time = current_time
            last_processed = processed_users
        
        # Пропускаем первые START_INDEX пользователей
        if START_INDEX > 0:
            if START_INDEX >= total_users:
                logger.warning(f"Указанный индекс {START_INDEX} превышает количество пользователей {total_users}")
                return {"status": "completed", "message": "Все пользователи уже обработаны"}
            
            logger.info(f"Пропускаем первых {START_INDEX} пользователей")
            users = users[START_INDEX:]
            total_users = len(users)
            logger.info(f"Будет обработано {total_users} пользователей")
        
        # Обрабатываем всех пользователей поочередно с соблюдением лимита
        for user in users:
            if not user.telegram_chat_id:
                continue
                
            # Ожидаем, чтобы соблюсти лимит сообщений в секунду
            await asyncio.sleep(1 / RATE_LIMIT)
            
            # Отправляем сообщение
            success = await send_message_to_user(
                bot=bot,
                chat_id=user.telegram_chat_id,
                message=message,
                image=image_content
            )
            
            # Обновляем счетчики
            processed_users += 1
            if success:
                successful_users += 1
            else:
                failed_users += 1
            
            # Выводим метрики каждые 10 секунд
            current_time = time.time()
            if current_time - last_metrics_time >= 10:
                print_metrics()
        
        # Выводим финальные метрики
        print_metrics()
        
        # Если это запланированная рассылка, обновляем её статус
        if mailing_id:
            try:
                mailing = ScheduledMailing.objects.get(id=mailing_id)
                mailing.is_sent = True
                mailing.in_progress = False
                mailing.save()
            except Exception as e:
                logger.error(f"Ошибка обновления статуса рассылки {mailing_id}: {e}")
        
        total_time = time.time() - start_time
        avg_speed = processed_users / total_time if total_time > 0 else 0
        
        logger.info(
            f"РАССЫЛКА ЗАВЕРШЕНА: Всего отправлено {processed_users} сообщений "
            f"({successful_users} успешно, {failed_users} ошибок) "
            f"за {total_time:.1f} сек. Средняя скорость: {avg_speed:.1f} сообщ/сек"
        )
        
        return {
            "total": total_users,
            "global_total": total_users + START_INDEX,
            "processed": processed_users,
            "global_processed": START_INDEX + processed_users,
            "successful": successful_users,
            "failed": failed_users,
            "time": total_time
        }
        
    finally:
        # Корректно закрываем сессию бота
        try:
            session = await bot.get_session()
            await session.close()
        except Exception as e:
            logger.error(f"Ошибка закрытия сессии бота: {e}")

@shared_task(name="api.mailing.process_scheduled", queue="mailing")
def process_scheduled_mailings():
    """Обрабатывает запланированные рассылки"""
    logger.info("Обработка запланированных рассылок")

    try:
        # Получаем все рассылки, которые должны быть отправлены сейчас
        mailings = ScheduledMailing.objects.filter(
            scheduled_time__lte=timezone.now(),
            is_sent=False,
            in_progress=False
        )

        logger.info(f"Найдено {mailings.count()} рассылок для обработки")

        for mailing in mailings:
            logger.info(f"Обработка рассылки ID: {mailing.id}")
            
            # Подготавливаем изображение
            image_content = None
            if mailing.image:
                mailing.image.open('rb')
                image_content = mailing.image.read()
                mailing.image.close()
            
            # Отмечаем, что рассылка в процессе
            mailing.in_progress = True
            mailing.save()
            
            # Запускаем задачу немедленной рассылки
            process_immediate_mailing_task.delay(
                mailing.message, 
                image_content, 
                mailing.id
            )

        return True

    except Exception as error:
        logger.exception(f"Ошибка в process_scheduled_mailings: {error}")
        return False