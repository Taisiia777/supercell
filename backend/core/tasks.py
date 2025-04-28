import logging
import asyncio
import requests

from celery import shared_task
from oscar.core.loading import get_model

from core.services.customer import (
    CustomerOrderNotifier,
    CustomerAccountCodeNotifier,
    CustomerFailedPaymentNotifier,
    CustomerSuccessOrderNotifier,
    CustomerInvalidEmailNotifier  

)
from core.models import EmailCodeRequest
from supercell_auth.mobile_app import request_code_from_mobile
from core.models import ScheduledMailing
from django.utils import timezone
from api.mailing.send import send_message_to_user, process_scheduled_mailings as process_mailing
from shop.order.enums import OrderStatus
from .models import User, Role
from aiogram import Bot, types
from django.conf import settings
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)
OrderLine = get_model("order", "Line")
Order = get_model("order", "Order")


@shared_task(name="api.davdamer.order_status_updated", queue="celery")
def order_status_updated(order_pk: int):
    CustomerOrderNotifier(order_pk).notify()



@shared_task(name="api.davdamer.request_code")
def davdamer_requested_code(line_id: int, send_code: bool = True):
    try:
        line = OrderLine.objects.get(pk=line_id)
        game = line.product.game
    except OrderLine.DoesNotExist:
        logger.info(f"OrderLine with id {line_id} does not exist")
        return

    login_data = line.login_data.first()
    if not login_data:
        logger.info(f"No logindata for OrderLine with id {line_id}")
        return

    if "@" not in login_data.account_id:
        logger.info(
            f"Account id {login_data.account_id} is not an email (line_id: {line_id})"
        )
        return

    # Только если send_code=True, отправляем запрос на получение кода
    requested_successful = False
    if send_code:
        requested_successful = request_code_from_mobile(login_data.account_id, game)
        EmailCodeRequest.objects.create(
            email=login_data.account_id, game=game, is_successful=requested_successful
        )
    
    # Выбираем, какое уведомление отправить пользователю
    if send_code:
        # Отправляем уведомление о неверном коде, запрашиваем новый код
        CustomerAccountCodeNotifier(
            line.order.user, login_data.account_id, line_id
        ).notify()
    else:
        # Отправляем уведомление о неверной почте, без запроса кода
        CustomerInvalidEmailNotifier(
            line.order.user, login_data.account_id, line_id
        ).notify()


@shared_task(name="api.shop.request_code", queue="celery")
def request_supercell_code(code_request_pk: int):
    try:
        code_request = EmailCodeRequest.objects.get(pk=code_request_pk)
        game = code_request.game or "brawl_stars"
        result = request_code_from_mobile(code_request.email, game)
        code_request.is_successful = result
        code_request.save()
        print(f"Code request completed: {result}") # Временно добавьте print
        return result
    except Exception as e:
        print(f"Error in request_code task: {e}")  # Временно добавьте print
        return False



@shared_task(name="api.shop.success_payment", queue="celery")
def success_payment_task(order_number: str):
    # Оставляем существующее уведомление пользователя
    CustomerSuccessOrderNotifier(order_number).notify()
   
    try:
        # Загружаем заказ со всеми необходимыми данными
        order = Order.objects.prefetch_related(
            'lines',
            'lines__login_data',
            'lines__product'
        ).get(number=order_number)
       
        # Вывод полной структуры заказа для отладки
        logger.info(f"============ НАЧАЛО ОТЛАДКИ ЗАКАЗА {order_number} ============")
        logger.info(f"ID заказа: {order.id}")
        logger.info(f"Номер заказа: {order.number}")
        logger.info(f"Сумма заказа: {order.total_incl_tax}")
        logger.info(f"Статус заказа до обработки: {order.status}")
        
        # Проверяем, есть ли в заказе продукты с типом логина "LINK" или "URL_LINK"
        has_link_products = False
        for line in order.lines.all():
            login_type = getattr(line.product, 'login_type', None)
            if login_type in ["LINK", "URL_LINK"]:
                has_link_products = True
                logger.info(f"Обнаружен продукт с типом логина {login_type}, ID продукта: {line.product.id}")
                break
        
        # Изменяем статус заказа в зависимости от наличия продуктов с типом логина LINK или URL_LINK
        if has_link_products and order.status == OrderStatus.PAID:
            # Если в заказе есть хотя бы один продукт с типом логина LINK или URL_LINK,
            # меняем статус на PROCESSING
            order.status = OrderStatus.PROCESSING
            order.save(update_fields=["status"])
            logger.info(f"Статус заказа изменен на PROCESSING из-за наличия продуктов типа LINK/URL_LINK")
        
        logger.info(f"Статус заказа после обработки: {order.status}")
       
        # Формируем данные для уведомления
        lines = []
        for line in order.lines.all():
            logger.info(f"Обработка строки заказа ID: {line.id}")
            logger.info(f"Продукт: {line.product.title} (ID: {line.product.id})")
           
            # Получаем login_type из продукта
            login_type = getattr(line.product, 'login_type', None)
            logger.info(f"Тип логина продукта: {login_type}")
           
            login_data = line.login_data.first()
            if login_data:
                logger.info(f"Данные авторизации: {login_data.account_id}, код: {login_data.code}")
               
                # Добавляем в линии с учетом типа login_type
                lines.append({
                    "product_title": line.product.title,
                    "quantity": line.quantity,
                    "mailbox": login_data.account_id,
                    "code": login_data.code if login_data.code else "",
                    "type": login_type  # Передаем именно login_type продукта
                })
       
        if lines:
            notify_data = {
                "number": order.number,
                "lines": lines,
                "total_incl_tax": int(order.total_incl_tax),
                "client_id": str(order.user.telegram_chat_id) if order.user and order.user.telegram_chat_id else ""
            }
           
            # Выводим готовые данные для отправки
            import json
            logger.info("Данные для отправки в API:")
            logger.info(json.dumps(notify_data, indent=2, ensure_ascii=False))
            logger.info(f"============ КОНЕЦ ОТЛАДКИ ЗАКАЗА {order_number} ============")
           
            # Отправляем запрос в MamoStore
            logger.info(f"Отправляем уведомление в MamoStore о заказе {order.number}")
            response = requests.post(
                "https://api.mamostore.ru/bot/order/notify",
                json=notify_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            response.raise_for_status()
            logger.info(f"Успешно отправлено уведомление в MamoStore о заказе {order.number}. Статус: {response.status_code}")
            logger.info(f"Ответ API: {response.text}")
           
    except Exception as err:
        logger.exception("Ошибка при отправке уведомления в MamoStore о заказе %s: %s", order_number, err)
        if hasattr(err, 'response') and err.response is not None:
            logger.error(f"Ответ с ошибкой: {err.response.text}")

@shared_task(name="api.mailing.process_scheduled", queue="celery")
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


# @shared_task(name="core.update_telegram_avatar")
# def update_telegram_avatar(user_id=None):
#     """
#     Обновляет аватарки пользователей из Telegram используя синхронные запросы
#     """
#     from django.contrib.auth import get_user_model
#     User = get_user_model()
    
#     def get_telegram_avatar(chat_id):
#         """Получает URL аватарки пользователя через Telegram API используя синхронные запросы"""
#         try:
#             # Получаем фотографии профиля
#             photos_url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/getUserProfilePhotos"
#             photos_response = requests.get(photos_url, params={
#                 "user_id": chat_id,
#                 "limit": 1
#             })
            
#             if not photos_response.ok:
#                 logger.warning(f"Ошибка при получении фото профиля: {photos_response.text}")
#                 return None
                
#             photos_data = photos_response.json()
            
#             # Проверяем, есть ли фотографии
#             if not photos_data.get("ok") or photos_data.get("result", {}).get("total_count", 0) == 0:
#                 logger.info(f"У пользователя {chat_id} нет фотографий профиля")
#                 return None
                
#             # Получаем ID файла последней фотографии профиля (самого высокого качества)
#             file_id = photos_data["result"]["photos"][0][-1]["file_id"]
            
#             # Получаем информацию о файле
#             file_url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/getFile"
#             file_response = requests.get(file_url, params={"file_id": file_id})
            
#             if not file_response.ok:
#                 logger.warning(f"Ошибка при получении информации о файле: {file_response.text}")
#                 return None
                
#             file_data = file_response.json()
            
#             # Формируем URL для загрузки файла
#             if not file_data.get("ok"):
#                 return None
                
#             file_path = file_data["result"]["file_path"]
#             return f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file_path}"
            
#         except Exception as e:
#             logger.exception(f"Ошибка при получении аватарки для {chat_id}: {e}")
#             return None
    
#     try:
#         # Получаем пользователей
#         if user_id:
#             users = User.objects.filter(id=user_id, telegram_chat_id__isnull=False)
#         else:
#             users = User.objects.filter(
#                 telegram_chat_id__isnull=False, 
#                 telegram_avatar_url__isnull=True
#             )
        
#         if not users:
#             logger.info("Нет пользователей для обновления аватарок")
#             return "Нет пользователей для обновления аватарок"
        
#         logger.info(f"Начало обновления аватарок для {users.count()} пользователей")
        
#         count = 0
#         for user in users:
#             # Получаем аватарку
#             avatar_url = get_telegram_avatar(user.telegram_chat_id)
            
#             # Если получили URL, сохраняем его
#             if avatar_url:
#                 user.telegram_avatar_url = avatar_url
#                 user.save(update_fields=['telegram_avatar_url'])
#                 logger.info(f"Обновлена аватарка для пользователя {user.id}")
#                 count += 1
        
#         return f"Обновлены аватарки для {count} пользователей"
#     except Exception as e:
#         logger.exception(f"Ошибка при выполнении задачи обновления аватарок: {e}")
#         return f"Ошибка: {str(e)}"


# @shared_task(name="core.update_telegram_avatar")
# def update_telegram_avatar(user_id=None):
#     """
#     Обновляет аватарки пользователей из Telegram, которые оставили отзывы
#     """
#     from django.contrib.auth import get_user_model
#     from oscar.core.loading import get_model
#     from core.models import OrderReview  # Используем OrderReview вместо ProductReview
    
#     User = get_user_model()
    
#     def get_telegram_avatar(chat_id):
#         """Получает URL аватарки пользователя через Telegram API используя синхронные запросы"""
#         # Если chat_id содержит префикс TG:, извлекаем числовой ID
#         if isinstance(chat_id, str) and chat_id.startswith('TG:'):
#             chat_id = chat_id.split(':', 1)[1]
        
#         try:
#             # Преобразуем chat_id в число в любом случае
#             chat_id = int(chat_id)
            
#             # Получаем фотографии профиля
#             photos_url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/getUserProfilePhotos"
#             photos_response = requests.get(photos_url, params={
#                 "user_id": chat_id,
#                 "limit": 1
#             })
            
#             if not photos_response.ok:
#                 logger.warning(f"Ошибка при получении фото профиля: {photos_response.text}")
#                 return None
                
#             photos_data = photos_response.json()
            
#             # Подробный лог для отладки
#             logger.info(f"Ответ Telegram API для {chat_id}: {photos_data}")
            
#             # Проверяем, есть ли фотографии
#             if not photos_data.get("ok") or photos_data.get("result", {}).get("total_count", 0) == 0:
#                 logger.info(f"У пользователя {chat_id} нет фотографий профиля")
#                 return None
                
#             # Получаем ID файла последней фотографии профиля (самого высокого качества)
#             file_id = photos_data["result"]["photos"][0][-1]["file_id"]
            
#             # Получаем информацию о файле
#             file_url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/getFile"
#             file_response = requests.get(file_url, params={"file_id": file_id})
            
#             if not file_response.ok:
#                 logger.warning(f"Ошибка при получении информации о файле: {file_response.text}")
#                 return None
                
#             file_data = file_response.json()
            
#             # Формируем URL для загрузки файла
#             if not file_data.get("ok"):
#                 return None
                
#             file_path = file_data["result"]["file_path"]
#             return f"https://api.telegram.org/file/bot{settings.BOT_TOKEN}/{file_path}"
            
#         except Exception as e:
#             logger.exception(f"Ошибка при получении аватарки для {chat_id}: {e}")
#             return None
    
#     try:
#         # Получаем пользователей, которые оставили отзывы
#         if user_id:
#             users = User.objects.filter(id=user_id)
#             logger.info(f"Получаем данные для конкретного пользователя с ID {user_id}")
#         else:
#             # Получаем ID пользователей, оставивших отзывы
#             reviewer_ids = OrderReview.objects.values_list('user_id', flat=True).distinct()
#             logger.info(f"Найдено {len(reviewer_ids)} уникальных пользователей с отзывами")
            
#             # Фильтруем пользователей, которые оставили отзывы, и у которых username начинается с "TG:"
#             users = User.objects.filter(
#                 id__in=reviewer_ids,
#                 username__startswith="TG:"
#             )
            
#             # Добавляем подробное логирование
#             all_users = users.count()
#             users = users.filter(telegram_avatar_url__isnull=True)
#             filtered_users = users.count()
            
#             logger.info(f"Всего пользователей с отзывами и Telegram username: {all_users}")
#             logger.info(f"Из них без аватарок: {filtered_users}")
        
#         if not users:
#             logger.info("Нет пользователей с отзывами для обновления аватарок")
#             return "Нет пользователей с отзывами для обновления аватарок"
        
#         logger.info(f"Начало обновления аватарок для {users.count()} пользователей с отзывами")
        
#         count = 0
#         for user in users:
#             logger.info(f"Обработка пользователя {user.id} с username {user.username}")
            
#             # Получаем аватарку используя username вместо telegram_chat_id
#             avatar_url = get_telegram_avatar(user.username)
            
#             # Если получили URL, сохраняем его
#             if avatar_url:
#                 user.telegram_avatar_url = avatar_url
#                 user.save(update_fields=['telegram_avatar_url'])
#                 logger.info(f"Обновлена аватарка для пользователя {user.id}")
#                 count += 1
#             else:
#                 logger.info(f"Не удалось получить аватарку для пользователя {user.id}, username: {user.username}")
        
#         return f"Обновлены аватарки для {count} пользователей с отзывами"
#     except Exception as e:
#         logger.exception(f"Ошибка при выполнении задачи обновления аватарок: {e}")
#         return f"Ошибка: {str(e)}"