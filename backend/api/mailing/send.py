
# import logging
# import asyncio
# import time
# from django.utils import timezone
# from celery import shared_task
# from django.conf import settings
# from aiogram import Bot, types
# from django.contrib.auth import get_user_model
# from core.models import ScheduledMailing, User

# # Индекс, с которого начинать рассылку (чтобы продолжить прерванную рассылку)
# START_INDEX = 0  # Измените на нужное значение, 0 для начала с первого пользователя

# logger = logging.getLogger(__name__)
# User = get_user_model()

# # Оптимизированные константы для соблюдения лимитов Telegram
# RATE_LIMIT = 150  # Максимальное количество сообщений в секунду

# async def send_message_to_user(bot: Bot, chat_id: int, message: str, image=None) -> bool:
#     """Отправляет сообщение пользователю без повторных попыток"""
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
#         error_msg = str(e)
#         # Только логируем ошибку, но не пытаемся отправить повторно
#         return False

# @shared_task(bind=True, name="api.mailing.process_immediate", queue="mailing")
# def process_immediate_mailing_task(self, message, image_content=None, mailing_id=None):
#     """Запускает немедленную рассылку в одном потоке с метриками"""
#     loop = asyncio.new_event_loop()
#     asyncio.set_event_loop(loop)
    
#     try:
#         # Получаем всех пользователей с telegram_chat_id
#         users = list(User.objects.exclude(telegram_chat_id__isnull=True))
#         total_users = len(users)
        
#         if not total_users:
#             logger.warning("Нет пользователей для рассылки")
#             return True
            
#         return loop.run_until_complete(
#             process_mailing_async(users, message, image_content, mailing_id)
#         )
#     finally:
#         loop.close()


# async def process_mailing_async(users, message, image_content, mailing_id=None):
#     """Асинхронная обработка рассылки с метриками"""
#     bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
    
#     try:
#         total_users = len(users)
#         processed_users = 0
#         successful_users = 0
#         failed_users = 0
        
#         # Для метрик
#         start_time = time.time()
#         last_metrics_time = start_time
#         last_processed = 0
        
#         # Создаем таймер для отправки метрик каждые 10 секунд
#         def print_metrics():
#             nonlocal last_metrics_time, last_processed
#             current_time = time.time()
#             elapsed = current_time - last_metrics_time
#             messages_per_second = (processed_users - last_processed) / elapsed if elapsed > 0 else 0
            
#             # Учитываем общий прогресс с учетом пропущенных пользователей
#             global_processed = START_INDEX + processed_users
#             global_total = total_users
#             global_percent = (global_processed / global_total) * 100 if global_total > 0 else 0
            
#             remaining = total_users - processed_users
#             percent_complete = (processed_users / total_users) * 100 if total_users > 0 else 0
            
#             logger.info(
#                 f"МЕТРИКИ РАССЫЛКИ: "
#                 f"Отправлено: {global_processed}/{global_total} ({global_percent:.1f}%) | "
#                 f"В текущей сессии: {processed_users}/{total_users} ({percent_complete:.1f}%) | "
#                 f"Успешно: {successful_users} | "
#                 f"Ошибок: {failed_users} | "
#                 f"Осталось: {remaining} | "
#                 f"Скорость: {messages_per_second:.1f} сообщ/сек"
#             )
            
#             last_metrics_time = current_time
#             last_processed = processed_users
        
#         # Пропускаем первые START_INDEX пользователей
#         if START_INDEX > 0:
#             if START_INDEX >= total_users:
#                 logger.warning(f"Указанный индекс {START_INDEX} превышает количество пользователей {total_users}")
#                 return {"status": "completed", "message": "Все пользователи уже обработаны"}
            
#             logger.info(f"Пропускаем первых {START_INDEX} пользователей")
#             users = users[START_INDEX:]
#             total_users = len(users)
#             logger.info(f"Будет обработано {total_users} пользователей")
        
#         # Обрабатываем всех пользователей поочередно с соблюдением лимита
#         for user in users:
#             if not user.telegram_chat_id:
#                 continue
                
#             # Ожидаем, чтобы соблюсти лимит сообщений в секунду
#             await asyncio.sleep(1 / RATE_LIMIT)
            
#             # Отправляем сообщение
#             success = await send_message_to_user(
#                 bot=bot,
#                 chat_id=user.telegram_chat_id,
#                 message=message,
#                 image=image_content
#             )
            
#             # Обновляем счетчики
#             processed_users += 1
#             if success:
#                 successful_users += 1
#             else:
#                 failed_users += 1
            
#             # Выводим метрики каждые 10 секунд
#             current_time = time.time()
#             if current_time - last_metrics_time >= 10:
#                 print_metrics()
        
#         # Выводим финальные метрики
#         print_metrics()
        
#         # Если это запланированная рассылка, обновляем её статус
#         if mailing_id:
#             try:
#                 mailing = ScheduledMailing.objects.get(id=mailing_id)
#                 mailing.is_sent = True
#                 mailing.in_progress = False
#                 mailing.save()
#             except Exception as e:
#                 logger.error(f"Ошибка обновления статуса рассылки {mailing_id}: {e}")
        
#         total_time = time.time() - start_time
#         avg_speed = processed_users / total_time if total_time > 0 else 0
        
#         logger.info(
#             f"РАССЫЛКА ЗАВЕРШЕНА: Всего отправлено {processed_users} сообщений "
#             f"({successful_users} успешно, {failed_users} ошибок) "
#             f"за {total_time:.1f} сек. Средняя скорость: {avg_speed:.1f} сообщ/сек"
#         )
        
#         return {
#             "total": total_users,
#             "global_total": total_users + START_INDEX,
#             "processed": processed_users,
#             "global_processed": START_INDEX + processed_users,
#             "successful": successful_users,
#             "failed": failed_users,
#             "time": total_time
#         }
        
#     finally:
#         # Корректно закрываем сессию бота
#         try:
#             session = await bot.get_session()
#             await session.close()
#         except Exception as e:
#             logger.error(f"Ошибка закрытия сессии бота: {e}")

# @shared_task(name="api.mailing.process_scheduled", queue="mailing")
# def process_scheduled_mailings():
#     """Обрабатывает запланированные рассылки"""
#     logger.info("Обработка запланированных рассылок")

#     try:
#         # Получаем все рассылки, которые должны быть отправлены сейчас
#         mailings = ScheduledMailing.objects.filter(
#             scheduled_time__lte=timezone.now(),
#             is_sent=False,
#             in_progress=False
#         )

#         logger.info(f"Найдено {mailings.count()} рассылок для обработки")

#         for mailing in mailings:
#             logger.info(f"Обработка рассылки ID: {mailing.id}")
            
#             # Подготавливаем изображение
#             image_content = None
#             if mailing.image:
#                 mailing.image.open('rb')
#                 image_content = mailing.image.read()
#                 mailing.image.close()
            
#             # Отмечаем, что рассылка в процессе
#             mailing.in_progress = True
#             mailing.save()
            
#             # Запускаем задачу немедленной рассылки
#             process_immediate_mailing_task.delay(
#                 mailing.message, 
#                 image_content, 
#                 mailing.id
#             )

#         return True

#     except Exception as error:
#         logger.exception(f"Ошибка в process_scheduled_mailings: {error}")
#         return False




import logging
import asyncio
import time
import random
from math import ceil
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from core.models import ScheduledMailing
import aiohttp

logger = logging.getLogger(__name__)
User = get_user_model()

# Константы для тестового режима
TEST_MODE = False  # Всегда включен тестовый режим
MESSAGE_RATE = 20  # Сообщений в секунду
WORKER_COUNT = 4   # Количество параллельных воркеров


async def send_message_to_user(chat_id: int, message: str, image=None) -> bool:
    """Отправляет сообщение пользователю"""
    if TEST_MODE:
        await asyncio.sleep(random.uniform(0.01, 0.1))
        success = random.random() > 0.05
        return success
    else:
        try:
            from aiogram import Bot, types
            
            bot = Bot(token=settings.BOT_TOKEN)
            
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
            finally:
                # Закрываем сессию бота
                await bot.session.close()
        except Exception:
            return False
            
@shared_task(name="api.mailing.process_batch", queue="mailing")
def process_batch_mailing(batch_id, user_ids, message, image_content=None, scheduled_time=None, mailing_id=None):
    """Обрабатывает одну партию пользователей в тестовом режиме"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        return loop.run_until_complete(
            process_batch_async(batch_id, user_ids, message, image_content, scheduled_time, mailing_id)
        )
    finally:
        loop.close()

async def process_batch_async(batch_id, user_ids, message, image_content=None, scheduled_time=None, mailing_id=None):
    """Асинхронно обрабатывает одну партию пользователей"""
    # Выводим информацию о начале обработки партии
    logger.info(f"[Партия {batch_id}] Начало обработки. Пользователей: {len(user_ids)}")
    
    from aiogram import Bot, types
    bot = None if TEST_MODE else Bot(token=settings.BOT_TOKEN)
    
    # Инициализируем счетчики
    total_users = len(user_ids)
    processed_users = 0
    successful_users = 0
    failed_users = 0
    
    # Метрики времени
    start_time = time.time()
    last_metrics_time = start_time
    last_processed = 0
    
    # Загружаем данные пользователей
    users_data = []
    for user_id in user_ids:
        # В тестовом режиме просто создаем фейковый chat_id
        users_data.append({
            "id": user_id,
            "chat_id": user_id if isinstance(user_id, int) else random.randint(10000000, 999999999)
        })
    
    # Функция для вывода метрик
    def print_metrics(force=False):
        nonlocal last_metrics_time, last_processed
        current_time = time.time()
        elapsed = current_time - last_metrics_time
        
        # Выводим метрики каждые 5 секунд или по запросу
        if force or elapsed >= 5:
            messages_per_second = (processed_users - last_processed) / elapsed if elapsed > 0 else 0
            percent_complete = (processed_users / total_users) * 100 if total_users > 0 else 0
            eta_seconds = ((total_users - processed_users) / messages_per_second) if messages_per_second > 0 else 0
            
            logger.info(
                f"[Партия {batch_id}] МЕТРИКИ: "
                f"Прогресс: {processed_users}/{total_users} ({percent_complete:.1f}%) | "
                f"Успешно: {successful_users} | "
                f"Ошибок: {failed_users} | "
                f"Скорость: {messages_per_second:.1f} сообщ/сек | "
                f"Осталось: {int(eta_seconds)} сек"
            )
            
            last_metrics_time = current_time
            last_processed = processed_users
    
    # Обрабатываем пользователей с заданной скоростью
    batch_size = min(50, total_users)  # Обрабатываем по 50 пользователей за раз
    for i in range(0, total_users, batch_size):
        batch = users_data[i:i+batch_size]
        
        batch_start = time.time()
        tasks = []
        
        for user in batch:
            if TEST_MODE:
                # Имитация отправки в тестовом режиме
                task = asyncio.create_task(
                    send_message_to_user(
                        chat_id=user["chat_id"],
                        message=message,
                        image=None
                    )
                )
            else:
                # Реальная отправка в рабочем режиме
                task = asyncio.create_task(
                    send_message_to_user(
                        chat_id=user["chat_id"],
                        message=message,
                        image=image_content
                    )
                )
            tasks.append(task)
        
        # Ожидаем выполнения всех задач в текущей мини-пачке
        results = await asyncio.gather(*tasks)
        
        # Обновляем счетчики
        processed_users += len(batch)
        successful_users += sum(1 for r in results if r)
        failed_users += sum(1 for r in results if not r)
        
        # Вывод метрик
        print_metrics()
        
        # Контроль скорости отправки
        batch_duration = time.time() - batch_start
        expected_duration = len(batch) / MESSAGE_RATE
        
        # Если обработка была быстрее, чем нужно - добавляем задержку
        if batch_duration < expected_duration:
            await asyncio.sleep(expected_duration - batch_duration)
    
    # Финальные метрики
    print_metrics(force=True)
    
    # Общая статистика
    total_time = time.time() - start_time
    avg_speed = processed_users / total_time if total_time > 0 else 0
    
    logger.info(
        f"[Партия {batch_id}] ЗАВЕРШЕНА: Всего обработано {processed_users} сообщений "
        f"({successful_users} успешно, {failed_users} ошибок) "
        f"за {total_time:.1f} сек. Средняя скорость: {avg_speed:.1f} сообщ/сек"
    )
    
    # Обновляем статус рассылки, если это запланированная рассылка
    if mailing_id:
        try:
            mailing = ScheduledMailing.objects.get(id=mailing_id)
            mailing.is_sent = True
            mailing.in_progress = False
            mailing.save()
        except Exception as e:
            logger.error(f"Ошибка обновления статуса рассылки {mailing_id}: {e}")
    
    return {
        "batch_id": batch_id,
        "total": total_users,
        "processed": processed_users,
        "successful": successful_users,
        "failed": failed_users,
        "time": total_time
    }

@shared_task(bind=True, name="api.mailing.process_immediate", queue="mailing")
def process_immediate_mailing_task(self, message, image_content=None, mailing_id=None):
    """Запускает немедленную рассылку в рабочем или тестовом режиме"""
    start_time = time.time()
    
    if TEST_MODE:
        logger.info("Запуск тестовой рассылки в режиме имитации")
    else:
        logger.info("Запуск боевой рассылки в рабочем режиме")
    
    # Получаем ID пользователей для рассылки
    if TEST_MODE:
        # В тестовом режиме создаем фиктивные ID пользователей
        user_count = 25000
        user_ids = list(range(1, user_count + 1))
        logger.info(f"Создано {user_count} фиктивных пользователей для тестовой рассылки")
    else:
        # В реальном режиме получаем пользователей из базы данных
        users = list(User.objects.exclude(telegram_chat_id__isnull=True))
        user_ids = [user.telegram_chat_id for user in users]
        user_count = len(user_ids)
        logger.info(f"Найдено {user_count} пользователей для рассылки")
    
    if not user_ids:
        logger.warning("Нет пользователей для рассылки")
        
        # Обновляем статус рассылки, если это запланированная рассылка
        if mailing_id:
            try:
                mailing = ScheduledMailing.objects.get(id=mailing_id)
                mailing.is_sent = True
                mailing.in_progress = False
                mailing.save()
                logger.info(f"Рассылка {mailing_id} помечена как завершенная (нет пользователей)")
            except Exception as e:
                logger.error(f"Ошибка обновления статуса рассылки {mailing_id}: {e}")
                
        return {"status": "completed", "message": "Нет пользователей для рассылки"}
    
    # Обработка изображения для запланированной рассылки
    if mailing_id and not TEST_MODE and not image_content:
        try:
            mailing = ScheduledMailing.objects.get(id=mailing_id)
            if mailing.image:
                image_content = mailing.image.read()
                logger.info(f"Загружено изображение для рассылки {mailing_id}")
        except Exception as e:
            logger.error(f"Ошибка загрузки изображения для рассылки {mailing_id}: {e}")
    
    # Разделяем пользователей на партии для параллельной обработки
    users_per_batch = ceil(len(user_ids) / WORKER_COUNT)
    batches = []
    
    for i in range(WORKER_COUNT):
        start_idx = i * users_per_batch
        end_idx = min(start_idx + users_per_batch, len(user_ids))
        batch_user_ids = user_ids[start_idx:end_idx]
        
        if batch_user_ids:  # Проверяем, что партия не пустая
            batches.append(batch_user_ids)
    
    logger.info(f"Разделено на {len(batches)} партий по ~{users_per_batch} пользователей")
    
    # Запускаем обработку каждой партии в отдельной задаче
    for i, batch in enumerate(batches):
        # Передаем изображение только если оно есть и мы в рабочем режиме
        if image_content and not TEST_MODE:
            process_batch_mailing.delay(
                batch_id=i+1, 
                user_ids=batch,
                message=message,
                image_content=image_content,
                scheduled_time=None,
                mailing_id=mailing_id if i == 0 else None
            )
        else:
            process_batch_mailing.delay(
                batch_id=i+1, 
                user_ids=batch,
                message=message,
                scheduled_time=None,
                mailing_id=mailing_id if i == 0 else None
            )
    
    total_time = time.time() - start_time
    logger.info(
        f"Запущено {len(batches)} параллельных задач для {len(user_ids)} пользователей. "
        f"Подготовка заняла {total_time:.2f} сек."
    )
    
    return {
        "status": "started", 
        "batches": len(batches),
        "total_users": len(user_ids),
        "preparation_time": total_time,
        "has_image": image_content is not None
    }

@shared_task(name="api.mailing.process_scheduled", queue="mailing")
def process_scheduled_mailings():
    """Обрабатывает запланированные рассылки"""
    logger.info("Обработка запланированных рассылок (тестовый режим)")

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
            
            # Отмечаем, что рассылка в процессе
            mailing.in_progress = True
            mailing.save()
            
            # Запускаем задачу немедленной рассылки в тестовом режиме
            process_immediate_mailing_task.delay(
                mailing.message, 
                None,  # В тестовом режиме изображения не обрабатываем
                mailing.id
            )

        return {"status": "completed", "processed": mailings.count()}

    except Exception as error:
        logger.exception(f"Ошибка в process_scheduled_mailings: {error}")
        return {"status": "error", "message": str(error)}