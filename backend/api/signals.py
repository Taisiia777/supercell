# import time

# from django.db import transaction
# from django.dispatch import receiver
# from django.utils import timezone
# from oscar.core.loading import get_model
# from oscarapi.signals import oscarapi_post_checkout

# from shop.order.enums import OrderStatus
# from shop.payment.yookassa import create_yoomoney_payment
# from core.models import OrderLoginData

# OrderLine = get_model("order", "Line")


# @receiver(oscarapi_post_checkout)
# def created_api_callback_handler(sender, order, user, **kwargs):
#     start_time = time.time()
#     yoomoney_data = create_yoomoney_payment(order=order, request=sender.request)
#     print(time.time() - start_time, "yoomoney latency")

#     product_account_id = {
#         product["product_id"]: (product["account_id"], product.get("code"))
#         for product in sender.serializer.validated_data["products"]
#     }

#     with transaction.atomic():
#         order.status = OrderStatus.NEW
#         order.payment_link = yoomoney_data["confirmation_url"]
#         order.payment_id = yoomoney_data["payment_id"]
#         order.guest_email = sender.serializer.validated_data["email"]
#         order.save(
#             update_fields=["status", "payment_link", "payment_id", "guest_email"]
#         )

#         updated_lines = []
#         login_data = []
#         now = timezone.now()
#         for line in order.lines.all():
#             line.measurement = line.stockrecord.measurement
#             updated_lines.append(line)

#             login_data.append(
#                 OrderLoginData(
#                     order_line_id=line.pk,
#                     account_id=product_account_id[line.product_id][0],
#                     code=product_account_id[line.product_id][1],
#                     created_dt=now,
#                 )
#             )
#         OrderLoginData.objects.bulk_create(login_data)
#         OrderLine.objects.bulk_update(updated_lines, ["measurement"])
import time
import requests
import logging

from django.db import transaction
from django.dispatch import receiver
from django.utils import timezone
from oscar.core.loading import get_model
from oscarapi.signals import oscarapi_post_checkout

from shop.order.enums import OrderStatus
from shop.payment.yookassa import create_yoomoney_payment
from core.models import OrderLoginData

logger = logging.getLogger(__name__)
OrderLine = get_model("order", "Line")

@receiver(oscarapi_post_checkout)
def created_api_callback_handler(sender, order, user, **kwargs):
    try:
        start_time = time.time()
        yoomoney_data = create_yoomoney_payment(order=order, request=sender.request)
        print(time.time() - start_time, "yoomoney latency")

        product_account_id = {
            product["product_id"]: (product["account_id"], product.get("code"))
            for product in sender.serializer.validated_data["products"]
        }

        with transaction.atomic():
            order.status = OrderStatus.NEW
            order.payment_link = yoomoney_data["confirmation_url"]
            order.payment_id = yoomoney_data["payment_id"]
            order.guest_email = sender.serializer.validated_data["email"]
            order.save(
                update_fields=["status", "payment_link", "payment_id", "guest_email"]
            )

            updated_lines = []
            login_data = []
            now = timezone.now()
            for line in order.lines.all():
                line.measurement = line.stockrecord.measurement
                updated_lines.append(line)

                login_data.append(
                    OrderLoginData(
                        order_line_id=line.pk,
                        account_id=product_account_id[line.product_id][0],
                        code=product_account_id[line.product_id][1],
                        created_dt=now,
                    )
                )
            OrderLoginData.objects.bulk_create(login_data)
            OrderLine.objects.bulk_update(updated_lines, ["measurement"])

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
                    "total_incl_tax": int(order.total_incl_tax),  # Преобразуем в целое число
                    "client_id": str(order.user.telegram_chat_id) if order.user and order.user.telegram_chat_id else ""
                }
                
                try:
                    response = requests.post(
                        "https://api.mamostore.ru/bot/order/notify", 
                        json=notify_data,
                        headers={"Content-Type": "application/json"}
                    )
                    response.raise_for_status()
                    logger.info(f"Successfully notified MamoStore about order {order.number}")
                except Exception as err:
                    logger.exception("Failed to notify MamoStore: %s", err)
                    # Логируем тело ответа для отладки
                    if hasattr(err, 'response') and err.response is not None:
                        logger.error(f"Error response body: {err.response.text}")
                        logger.error(f"Request body was: {notify_data}")
    except Exception as err:
        logger.exception("Error in post_checkout handler: %s", err)
        raise