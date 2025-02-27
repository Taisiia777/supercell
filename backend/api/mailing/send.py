# import logging 
# import asyncio
# import time
# from django.utils import timezone
# from celery import shared_task
# from django.conf import settings
# from aiogram import Bot, types
# from django.contrib.auth import get_user_model
# from core.models import ScheduledMailing, User, Role
# from asgiref.sync import sync_to_async

# logger = logging.getLogger(__name__)
# User = get_user_model()

# # Константы для настройки
# BATCH_SIZE = 100  # Размер пакета пользователей
# RATE_LIMIT = 30  # Максимальное количество сообщений в секунду

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

# # Обрабатывает одну рассылку (для совместимости с существующим кодом)
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

# async def process_user_batch(user_batch, message, image):
#     """Обрабатывает пакет пользователей асинхронно"""
#     bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
#     try:
#         start_time = time.time()
#         success_count = 0
        
#         for user in user_batch:
#             try:
#                 success = await send_message_to_user(
#                     bot=bot,
#                     chat_id=user.telegram_chat_id,
#                     message=message,
#                     image=image
#                 )
#                 if success:
#                     success_count += 1
                
#                 # Ограничение скорости отправки
#                 if time.time() - start_time < 1 and success_count >= RATE_LIMIT:
#                     await asyncio.sleep(1 - (time.time() - start_time))
#                     start_time = time.time()
#                     success_count = 0
                    
#             except Exception as e:
#                 logger.error(f"Ошибка отправки пользователю {user.id}: {e}")
                
#     finally:
#         await bot.session.close()
        
#     return len(user_batch)

# @shared_task(name="api.mailing.process_batch")
# def process_user_batch_task(user_ids, message, image, mailing_id=None):
#     """Обрабатывает пакет пользователей"""
#     try:
#         # Получаем пользователей по ID
#         users = list(User.objects.filter(id__in=user_ids, telegram_chat_id__isnull=False))
        
#         if not users:
#             return 0
            
#         # Создаем event loop
#         loop = asyncio.new_event_loop()
#         asyncio.set_event_loop(loop)
        
#         try:
#             processed = loop.run_until_complete(process_user_batch(users, message, image))
#             return processed
#         finally:
#             loop.close()
            
#     except Exception as e:
#         logger.exception(f"Ошибка в process_user_batch_task: {e}")
#         return 0

# @shared_task(name="api.mailing.process_scheduled")
# def process_scheduled_mailings(message=None, image=None, *args, **kwargs):
#     """
#     Обрабатывает запланированные рассылки
    
#     Поддерживает два режима:
#     1. Без аргументов - обрабатывает все запланированные рассылки
#     2. С аргументами message, image - обрабатывает конкретную рассылку
#     """
#     logger.info("Обработка запланированных рассылок")

#     try:
#         # Если переданы параметры message и image, значит это вызов для конкретной рассылки
#         if message is not None:
#             # Получаем все ID пользователей для рассылки
#             user_ids = list(User.objects.exclude(telegram_chat_id__isnull=False).values_list('id', flat=True))
#             total_users = len(user_ids)
            
#             if not user_ids:
#                 logger.warning("Нет пользователей для рассылки")
#                 return True
                
#             # Разбиваем на пакеты и отправляем задачи
#             for i in range(0, total_users, BATCH_SIZE):
#                 batch = user_ids[i:i+BATCH_SIZE]
#                 process_user_batch_task.delay(
#                     batch, 
#                     message, 
#                     image, 
#                     None
#                 )
            
#             return True
                
#         # Иначе обрабатываем все запланированные рассылки
#         mailings = ScheduledMailing.objects.filter(
#             scheduled_time__lte=timezone.now(),
#             is_sent=False
#         )

#         logger.info(f"Найдено {mailings.count()} рассылок для обработки")

#         for mailing in mailings:
#             logger.info(f"Обработка рассылки ID: {mailing.id}")
            
#             # Получаем все ID пользователей для рассылки
#             user_ids = list(User.objects.exclude(telegram_chat_id__isnull=True).values_list('id', flat=True))
#             total_users = len(user_ids)
            
#             if not user_ids:
#                 logger.warning("Нет пользователей для рассылки")
#                 mailing.is_sent = True
#                 mailing.save()
#                 continue
                
#             # Подготавливаем изображение
#             image_content = None
#             if mailing.image:
#                 mailing.image.open('rb')
#                 image_content = mailing.image.read()
#                 mailing.image.close()
            
#             # Разбиваем на пакеты и отправляем задачи
#             for i in range(0, total_users, BATCH_SIZE):
#                 batch = user_ids[i:i+BATCH_SIZE]
#                 process_user_batch_task.delay(
#                     batch, 
#                     mailing.message, 
#                     image_content, 
#                     mailing.id
#                 )
            
#             # Отмечаем как отправленную
#             mailing.is_sent = True
#             mailing.save()

#         return True

#     except Exception as error:
#         logger.exception(f"Ошибка в process_scheduled_mailings: {error}")
#         return False






# import logging 
# import asyncio
# import time
# import threading
# import concurrent.futures
# from functools import partial
# from django.utils import timezone
# from celery import shared_task
# from django.conf import settings
# from aiogram import Bot, types
# from django.contrib.auth import get_user_model
# from core.models import ScheduledMailing, User
# from asgiref.sync import sync_to_async

# logger = logging.getLogger(__name__)
# User = get_user_model()

# # Оптимизированные константы
# BATCH_SIZE = 500  # Размер пакета пользователей
# MAX_THREADS = 8   # Максимальное количество потоков для обработки
# RATE_LIMIT = 60   # Максимальное количество сообщений в секунду
# CONCURRENCY_LIMIT = 100  # Ограничение одновременных запросов к API

# # Семафор для ограничения конкурентности
# sem = None

# async def initialize_semaphore():
#     """Инициализирует семафор для ограничения конкурентности"""
#     global sem
#     if sem is None:
#         sem = asyncio.Semaphore(CONCURRENCY_LIMIT)
#     return sem

# async def send_message_to_user(bot: Bot, chat_id: int, message: str, image=None) -> bool:
#     """Отправляет сообщение пользователю с ограничением конкурентности"""
#     global sem
#     if sem is None:
#         sem = await initialize_semaphore()
        
#     async with sem:
#         try:
#             keyboard = types.InlineKeyboardMarkup(
#                 inline_keyboard=[[
#                     types.InlineKeyboardButton(
#                         text="В магазин",
#                         web_app=types.WebAppInfo(url="https://shop.mamostore.ru")
#                     )
#                 ]]
#             )

#             if image:
#                 image_input = types.BufferedInputFile(
#                     file=image,
#                     filename='mailing_image.jpg'
#                 )

#                 await bot.send_photo(
#                     chat_id=chat_id,
#                     photo=image_input,
#                     caption=message,
#                     reply_markup=keyboard
#                 )
#             else:
#                 await bot.send_message(
#                     chat_id=chat_id,
#                     text=message,
#                     reply_markup=keyboard
#                 )
#             return True
#         except Exception as e:
#             logger.error(f"Ошибка отправки сообщения пользователю {chat_id}: {str(e)}")
#             return False

# async def process_user_batch_async(user_batch, message, image):
#     """Асинхронная обработка пакета пользователей"""
#     bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
#     try:
#         tasks = []
#         sent_count = 0
#         start_time = time.time()
        
#         # Создаем задачи для всех пользователей в пакете
#         for user in user_batch:
#             if user.telegram_chat_id:
#                 tasks.append(
#                     send_message_to_user(
#                         bot=bot,
#                         chat_id=user.telegram_chat_id,
#                         message=message,
#                         image=image
#                     )
#                 )
        
#         # Запускаем все задачи параллельно с ограничением конкурентности через семафор
#         results = await asyncio.gather(*tasks, return_exceptions=True)
        
#         # Подсчитываем количество успешных отправок
#         sent_count = sum(1 for r in results if r is True)
        
#         # Адаптивное ожидание для соблюдения ограничений API
#         elapsed = time.time() - start_time
#         rate = sent_count / max(elapsed, 0.1)  # сообщений в секунду
        
#         if rate > RATE_LIMIT and elapsed < 1:
#             await asyncio.sleep(1 - elapsed + 0.1)  # Добавляем небольшой запас
        
#         return sent_count
        
#     finally:
#         # Корректно закрываем сессию бота
#         session = await bot.get_session()
#         await session.close()
        
#     return len(user_batch)

# def process_batch_in_thread(sub_batch, message, image):
#     """Функция для обработки пакета пользователей в отдельном потоке"""
#     loop = asyncio.new_event_loop()
#     asyncio.set_event_loop(loop)
#     try:
#         return loop.run_until_complete(process_user_batch_async(sub_batch, message, image))
#     finally:
#         loop.close()

# def split_batch(users, num_threads):
#     """Разбивает список пользователей на подгруппы для многопоточной обработки"""
#     avg = len(users) // num_threads
#     remainder = len(users) % num_threads
#     result = []
    
#     start = 0
#     for i in range(num_threads):
#         size = avg + (1 if i < remainder else 0)
#         if size == 0:
#             break
#         result.append(users[start:start+size])
#         start += size
        
#     return result

# @shared_task(name="api.mailing.process_batch")
# def process_user_batch_task(user_ids, message, image, mailing_id=None):
#     """Обрабатывает пакет пользователей с использованием многопоточности"""
#     try:
#         # Получаем пользователей по ID
#         users = list(User.objects.filter(id__in=user_ids).exclude(telegram_chat_id__isnull=True))
        
#         if not users:
#             return 0
            
#         # Определяем оптимальное количество потоков
#         num_threads = min(MAX_THREADS, len(users))
        
#         if num_threads <= 1:
#             # Для малого количества пользователей просто запускаем в текущем потоке
#             loop = asyncio.new_event_loop()
#             asyncio.set_event_loop(loop)
#             try:
#                 processed = loop.run_until_complete(process_user_batch_async(users, message, image))
#             finally:
#                 loop.close()
#         else:
#             # Разбиваем пользователей на подгруппы для многопоточной обработки
#             sub_batches = split_batch(users, num_threads)
            
#             # Используем ThreadPoolExecutor для параллельной обработки
#             processed = 0
#             with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
#                 # Создаем частичные функции с фиксированными аргументами
#                 func = partial(process_batch_in_thread, message=message, image=image)
                
#                 # Запускаем обработку подгрупп в разных потоках
#                 results = list(executor.map(func, sub_batches))
#                 processed = sum(results)
        
#         # Обновляем статус рассылки, если это последний пакет и есть ID рассылки
#         if mailing_id:
#             from celery_app import app as celery_app
#             # Проверяем, осталось ли еще необработанных батчей
#             remaining_tasks = celery_app.control.inspect().active()
#             if not any('process_batch' in task.get('name', '') for tasks in (remaining_tasks or {}).values() for task in tasks):
#                 try:
#                     mailing = ScheduledMailing.objects.get(id=mailing_id)
#                     mailing.is_sent = True
#                     mailing.in_progress = False
#                     mailing.save()
#                 except Exception as e:
#                     logger.error(f"Ошибка обновления статуса рассылки {mailing_id}: {e}")
        
#         return processed
            
#     except Exception as e:
#         logger.exception(f"Ошибка в process_user_batch_task: {e}")
#         return 0

# # Функция для распределения пользователей по пакетам и запуска задач
# def distribute_users_to_batches(user_ids, message, image_content, mailing_id=None, priority=0):
#     """Распределяет пользователей по пакетам и запускает задачи обработки"""
#     from celery_app import app as celery_app
    
#     # Определяем оптимальный размер пакета
#     # Для многопоточной обработки берем больший размер
#     effective_batch_size = BATCH_SIZE
    
#     # Разбиваем на пакеты и запускаем задачи
#     batch_count = 0
#     for i in range(0, len(user_ids), effective_batch_size):
#         batch = user_ids[i:i+effective_batch_size]
#         process_user_batch_task.apply_async(
#             args=[batch, message, image_content, mailing_id],
#             priority=priority
#         )
#         batch_count += 1
    
#     return batch_count

# @shared_task(name="api.mailing.process_scheduled")
# def process_scheduled_mailings():
#     """Обрабатывает запланированные рассылки"""
#     logger.info("Обработка запланированных рассылок")

#     try:
#         # Получаем все рассылки, которые должны быть отправлены сейчас
#         mailings = ScheduledMailing.objects.filter(
#             scheduled_time__lte=timezone.now(),
#             is_sent=False,
#             in_progress=False  # Не берем те, что уже в процессе
#         )

#         logger.info(f"Найдено {mailings.count()} рассылок для обработки")

#         for mailing in mailings:
#             logger.info(f"Обработка рассылки ID: {mailing.id}")
            
#             # Получаем всех пользователей с telegram_chat_id для рассылки
#             user_ids = list(User.objects.exclude(telegram_chat_id__isnull=True).values_list('id', flat=True))
#             total_users = len(user_ids)
            
#             if not user_ids:
#                 logger.warning("Нет пользователей для рассылки")
#                 mailing.is_sent = True
#                 mailing.save()
#                 continue
                
#             # Подготавливаем изображение
#             image_content = None
#             if mailing.image:
#                 mailing.image.open('rb')
#                 image_content = mailing.image.read()
#                 mailing.image.close()
            
#             # Распределяем пользователей по пакетам и запускаем задачи
#             distribute_users_to_batches(user_ids, mailing.message, image_content, mailing.id)
            
#             # Отмечаем, что рассылка в процессе
#             mailing.in_progress = True
#             mailing.save()

#         return True

#     except Exception as error:
#         logger.exception(f"Ошибка в process_scheduled_mailings: {error}")
#         return False

# # Немедленная рассылка сообщения
# @shared_task(name="api.mailing.send_immediate_mailing")
# def send_immediate_mailing(message, image_content=None):
#     """Запускает немедленную рассылку с использованием многопоточности"""
#     try:
#         # Получаем всех пользователей с telegram_chat_id
#         user_ids = list(User.objects.exclude(telegram_chat_id__isnull=True).values_list('id', flat=True))
#         total_users = len(user_ids)
        
#         if not user_ids:
#             logger.warning("Нет пользователей для рассылки")
#             return True
                
#         # Распределяем пользователей по пакетам и запускаем задачи с высоким приоритетом
#         distribute_users_to_batches(user_ids, message, image_content, priority=9)
        
#         return True

#     except Exception as error:
#         logger.exception(f"Ошибка в send_immediate_mailing: {error}")
#         return False

import logging 
import asyncio
import time
import threading
import concurrent.futures
import random
from functools import partial
from django.utils import timezone
from celery import shared_task
from django.conf import settings
from aiogram import Bot, types
from django.contrib.auth import get_user_model
from core.models import ScheduledMailing, User
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)
User = get_user_model()

# Оптимизированные константы для соблюдения лимитов Telegram
BATCH_SIZE = 300        # Уменьшенный размер пакета
MAX_THREADS = 4         # Меньше потоков для меньшей нагрузки
RATE_LIMIT = 15         # Количество сообщений в секунду (снижено)
CONCURRENCY_LIMIT = 25  # Меньше одновременных запросов
RETRY_ATTEMPTS = 3      # Количество повторных попыток при ошибке
BASE_DELAY = 1          # Базовая задержка между попытками
MAX_JITTER = 0.5        # Случайная составляющая задержки
FLOOD_RETRY_DELAY = 65  # Задержка при флуд-контроле (секунды)

# Глобальные переменные для синхронизации между потоками
_rate_limit_lock = threading.RLock()
_last_request_time = {}
_chat_retries = {}
_chat_delays = {}

# Семафор для ограничения конкурентности
sem = None

async def initialize_semaphore():
    """Инициализирует семафор для ограничения конкурентности"""
    global sem
    if sem is None:
        sem = asyncio.Semaphore(CONCURRENCY_LIMIT)
    return sem

def get_retry_delay(chat_id, error_msg=None):
    """Определяет задержку перед повторной попыткой на основе ошибки"""
    # Если это ошибка флуд-контроля, извлекаем время ожидания
    if error_msg and "retry after" in error_msg.lower():
        try:
            # Пытаемся извлечь задержку из сообщения
            import re
            match = re.search(r'retry after (\d+)', error_msg.lower())
            if match:
                delay = int(match.group(1)) + 5  # Добавляем запас
                return delay
        except:
            pass
        return FLOOD_RETRY_DELAY  # По умолчанию 65 секунд
    
    # Экспоненциальная задержка с случайной составляющей
    retries = _chat_retries.get(chat_id, 0)
    base_delay = BASE_DELAY * (2 ** retries)
    jitter = random.uniform(0, MAX_JITTER)
    return base_delay + jitter

async def send_message_to_user(bot: Bot, chat_id: int, message: str, image=None, attempt=0) -> bool:
    """Отправляет сообщение пользователю с соблюдением лимитов и повторными попытками"""
    global sem, _last_request_time, _chat_retries, _chat_delays
    
    if sem is None:
        sem = await initialize_semaphore()
        
    if attempt >= RETRY_ATTEMPTS:
        logger.error(f"Достигнуто максимальное количество попыток для chat_id {chat_id}")
        return False
    
    # Проверяем, не нужно ли отложить отправку этому чату из-за предыдущих ошибок
    with _rate_limit_lock:
        delay = _chat_delays.get(chat_id, 0)
        if delay > 0:
            current_time = time.time()
            if current_time < delay:
                wait_time = delay - current_time
                logger.info(f"Ожидание {wait_time:.1f}с перед отправкой чату {chat_id} (флуд-контроль)")
                await asyncio.sleep(wait_time)
    
    # Делаем паузу, чтобы не превышать глобальный лимит запросов в секунду
    with _rate_limit_lock:
        current_time = time.time()
        last_time = _last_request_time.get('global', 0)
        if current_time - last_time < 1.0/RATE_LIMIT:
            await asyncio.sleep(1.0/RATE_LIMIT - (current_time - last_time))
        _last_request_time['global'] = time.time()
    
    async with sem:
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
                
            # Сбрасываем счетчик попыток при успехе
            with _rate_limit_lock:
                if chat_id in _chat_retries:
                    del _chat_retries[chat_id]
                if chat_id in _chat_delays:
                    del _chat_delays[chat_id]
                    
            return True
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Ошибка отправки сообщения пользователю {chat_id}: {error_msg}")
            
            # Обрабатываем специфические ошибки
            if "chat not found" in error_msg.lower() or "blocked" in error_msg.lower():
                # Пользователь недоступен, отмечаем как ошибку без повторных попыток
                return False
                
            # Определяем задержку на основе ошибки
            retry_delay = get_retry_delay(chat_id, error_msg)
            
            # Обновляем счетчик попыток и задержку для этого чата
            with _rate_limit_lock:
                _chat_retries[chat_id] = _chat_retries.get(chat_id, 0) + 1
                if "flood control" in error_msg.lower() or "too many requests" in error_msg.lower():
                    _chat_delays[chat_id] = time.time() + retry_delay
                    logger.warning(f"Установлена задержка {retry_delay}с для chat_id {chat_id} (флуд-контроль)")
            
            # Пауза перед повторной попыткой
            await asyncio.sleep(retry_delay)
            
            # Рекурсивно пытаемся отправить снова
            return await send_message_to_user(bot, chat_id, message, image, attempt + 1)

async def process_user_batch_async(user_batch, message, image):
    """Асинхронная обработка пакета пользователей с учетом лимитов"""
    bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
    try:
        tasks = []
        
        # Создаем задачи для всех пользователей в пакете
        for user in user_batch:
            if user.telegram_chat_id:
                # Добавляем небольшую случайную задержку для распределения нагрузки
                await asyncio.sleep(random.uniform(0.05, 0.2))
                
                tasks.append(
                    send_message_to_user(
                        bot=bot,
                        chat_id=user.telegram_chat_id,
                        message=message,
                        image=image
                    )
                )
        
        # Запускаем задачи с лимитированной конкурентностью через семафор
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Подсчитываем количество успешных отправок
        sent_count = sum(1 for r in results if r is True)
        logger.info(f"Обработано {len(user_batch)} пользователей, успешно отправлено {sent_count} сообщений")
        
        return sent_count
        
    finally:
        # Корректно закрываем сессию бота
        try:
            session = await bot.get_session()
            await session.close()
        except Exception as e:
            logger.error(f"Ошибка закрытия сессии бота: {e}")

def process_batch_in_thread(sub_batch, message, image):
    """Функция для обработки пакета пользователей в отдельном потоке"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(process_user_batch_async(sub_batch, message, image))
    finally:
        loop.close()

def split_batch(users, num_threads):
    """Разбивает список пользователей на подгруппы для многопоточной обработки"""
    avg = len(users) // num_threads
    remainder = len(users) % num_threads
    result = []
    
    start = 0
    for i in range(num_threads):
        size = avg + (1 if i < remainder else 0)
        if size == 0:
            break
        result.append(users[start:start+size])
        start += size
        
    return result

@shared_task(bind=True, name="api.mailing.process_batch", queue="mailing", max_retries=3)
def process_user_batch_task(self, user_ids, message, image, mailing_id=None):
    """Обрабатывает пакет пользователей с использованием многопоточности и соблюдением лимитов"""
    try:
        # Получаем пользователей по ID
        users = list(User.objects.filter(id__in=user_ids).exclude(telegram_chat_id__isnull=True))
        
        if not users:
            return 0
            
        # Определяем оптимальное количество потоков, но не больше MAX_THREADS
        num_threads = min(MAX_THREADS, max(1, len(users) // 50))
        
        if num_threads <= 1:
            # Для малого количества пользователей просто запускаем в текущем потоке
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                processed = loop.run_until_complete(process_user_batch_async(users, message, image))
            finally:
                loop.close()
        else:
            # Разбиваем пользователей на подгруппы для многопоточной обработки
            sub_batches = split_batch(users, num_threads)
            
            # Используем ThreadPoolExecutor для параллельной обработки
            processed = 0
            with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
                # Создаем частичные функции с фиксированными аргументами
                func = partial(process_batch_in_thread, message=message, image=image)
                
                # Запускаем обработку подгрупп в разных потоках
                results = list(executor.map(func, sub_batches))
                processed = sum(results)
                
        # Обновляем статус рассылки, если это необходимо
        if mailing_id:
            try:
                mailing = ScheduledMailing.objects.get(id=mailing_id)
                
                # Проверяем, что другие батчи этой рассылки завершены
                from celery_app import app as celery_app
                try:
                    active_tasks = celery_app.control.inspect().active() or {}
                    batch_tasks = []
                    for tasks in active_tasks.values():
                        batch_tasks.extend([
                            task for task in tasks 
                            if task.get('name') == 'api.mailing.process_batch' and 
                               task.get('args') and len(task.get('args')) > 3 and
                               task.get('args')[3] == mailing_id and
                               task.get('id') != self.request.id
                        ])
                    
                    if not batch_tasks:
                        mailing.is_sent = True
                        mailing.in_progress = False
                        mailing.save()
                        logger.info(f"Рассылка {mailing_id} завершена")
                except Exception as e:
                    logger.error(f"Ошибка при проверке активных задач: {e}")
            except Exception as e:
                logger.error(f"Ошибка обновления статуса рассылки {mailing_id}: {e}")
        
        return processed
            
    except Exception as e:
        logger.exception(f"Ошибка в process_user_batch_task: {e}")
        # Пробуем повторить задачу при ошибке, но не чаще чем раз в минуту
        self.retry(exc=e, countdown=60)
        return 0

# Функция для распределения пользователей по пакетам и запуска задач
def distribute_users_to_batches(user_ids, message, image_content, mailing_id=None, priority=0):
    """Распределяет пользователей по пакетам и запускает задачи обработки с учетом лимитов"""
    from celery_app import app as celery_app
    
    # Перемешиваем пользователей для равномерного распределения нагрузки
    import random
    shuffled_ids = list(user_ids)
    random.shuffle(shuffled_ids)
    
    # Разбиваем на пакеты и запускаем задачи с увеличивающейся задержкой
    batch_count = 0
    for i in range(0, len(shuffled_ids), BATCH_SIZE):
        batch = shuffled_ids[i:i+BATCH_SIZE]
        
        # Добавляем возрастающую задержку между пакетами
        delay = min((batch_count * 15), 300)  # Не более 5 минут
        
        # Используем отдельную очередь для рассылок, чтобы не блокировать другие задачи
        process_user_batch_task.apply_async(
            args=[batch, message, image_content, mailing_id],
            priority=priority,
            countdown=delay,
            queue='mailing'  # Явно указываем очередь
        )
        
        batch_count += 1
        logger.info(f"Запланирован пакет {batch_count} с задержкой {delay}с")
    
    return batch_count

@shared_task(name="api.mailing.process_scheduled", queue="mailing")
def process_scheduled_mailings():
    """Обрабатывает запланированные рассылки с учетом лимитов"""
    logger.info("Обработка запланированных рассылок")

    try:
        # Получаем все рассылки, которые должны быть отправлены сейчас
        mailings = ScheduledMailing.objects.filter(
            scheduled_time__lte=timezone.now(),
            is_sent=False,
            in_progress=False  # Не берем те, что уже в процессе
        )

        logger.info(f"Найдено {mailings.count()} рассылок для обработки")

        for mailing in mailings:
            logger.info(f"Обработка рассылки ID: {mailing.id}")
            
            # Получаем всех пользователей с telegram_chat_id для рассылки
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
            
            # Распределяем пользователей по пакетам и запускаем задачи
            distribute_users_to_batches(user_ids, mailing.message, image_content, mailing.id, priority=5)
            
            # Отмечаем, что рассылка в процессе
            mailing.in_progress = True
            mailing.save()

        return True

    except Exception as error:
        logger.exception(f"Ошибка в process_scheduled_mailings: {error}")
        return False

# Немедленная рассылка сообщения
@shared_task(name="api.mailing.send_immediate_mailing", queue="mailing")
def send_immediate_mailing(message, image_content=None):
    """Запускает немедленную рассылку с соблюдением лимитов API"""
    try:
        # Получаем всех пользователей с telegram_chat_id
        user_ids = list(User.objects.exclude(telegram_chat_id__isnull=True).values_list('id', flat=True))
        total_users = len(user_ids)
        
        if not user_ids:
            logger.warning("Нет пользователей для рассылки")
            return True
                
        # Распределяем пользователей по пакетам и запускаем задачи с высоким приоритетом
        distribute_users_to_batches(user_ids, message, image_content, priority=9)
        
        return True

    except Exception as error:
        logger.exception(f"Ошибка в send_immediate_mailing: {error}")
        return False

@shared_task(name="api.mailing.set_max_threads", queue="mailing")
def set_max_threads(threads):
    """Устанавливает максимальное количество потоков для обработки"""
    global MAX_THREADS
    if threads and 1 <= threads <= 8:
        MAX_THREADS = threads
        return True
    return False