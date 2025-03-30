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
# from api.mailing.send import send_message_to_user, process_mailing
from api.mailing.send import send_message_to_user, process_scheduled_mailings as process_mailing

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


# @shared_task(name="api.davdamer.request_code", queue="celery")
# def davdamer_requested_code(line_id: int):
#     try:
#         line = OrderLine.objects.get(pk=line_id)
#         game = line.product.game
#     except OrderLine.DoesNotExist:
#         logger.info(f"OrderLine with id {line_id} does not exist")
#         return

#     login_data = line.login_data.first()
#     if not login_data:
#         logger.info(f"No logindata for OrderLine with id {line_id}")
#         return

#     if "@" not in login_data.account_id:
#         logger.info(
#             f"Account id {login_data.account_id} is not an email (line_id: {line_id})"
#         )
#         return

#     requested_successful = request_code_from_mobile(login_data.account_id, game)
#     EmailCodeRequest.objects.create(
#         email=login_data.account_id, game=game, is_successful=requested_successful
#     )
#     if requested_successful:
#         CustomerAccountCodeNotifier(
#             line.order.user, login_data.account_id, line_id
#         ).notify()
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

# @shared_task(name="api.shop.failed_payment", queue="celery")
# def failed_payment_task(order_number: str):
#     CustomerFailedPaymentNotifier(order_number).notify()


# @shared_task(name="api.shop.success_payment")
# def success_payment_task(order_number: str):
#     CustomerSuccessOrderNotifier(order_number).notify()
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
        
        # Формируем данные для уведомления
        lines = []
        for line in order.lines.all():
            login_data = line.login_data.first()
            if login_data:
                lines.append({
                    "product_title": line.product.title,
                    "quantity": line.quantity,
                    "mailbox": login_data.account_id,
                    "code": login_data.code if login_data.code else ""
                })
        
        if lines:  # Отправляем только если есть данные
            notify_data = {
                "number": order.number,
                "lines": lines,
                "total_incl_tax": int(order.total_incl_tax),
                "client_id": str(order.user.telegram_chat_id) if order.user and order.user.telegram_chat_id else ""
            }
            
            # Отправляем запрос в MamoStore
            response = requests.post(
                "https://api.mamostore.ru/bot/order/notify", 
                json=notify_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            response.raise_for_status()
            logger.info(f"Successfully notified MamoStore about order {order.number}")
            
    except Exception as err:
        logger.exception("Failed to notify MamoStore about order %s: %s", order_number, err)
        if hasattr(err, 'response') and err.response is not None:
            logger.error(f"Error response body: {err.response.text}")

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