from celery import shared_task

from core.services.customer import CustomerOrderNotifier
from core.services.seller import SellerNotifier, SellerActionHandler
from core.models import EmailCodeRequest
from supercell_auth.login import request_the_code


@shared_task(name="api.shop.new_order")
def new_order(order_pk: int):
    SellerNotifier(order_pk).notify()


@shared_task(name="api.davdamer.order_status_updated")
def order_status_updated(order_pk: int):
    CustomerOrderNotifier(order_pk).notify()


@shared_task(name="bot.seller.act")
def seller_action(order_number: str, action: str):
    SellerActionHandler(order_number, action).act()


@shared_task(name="api.shop.request_code")
def request_supercell_code(code_request_pk: int):
    try:
        code_request = EmailCodeRequest.objects.get(pk=code_request_pk)
    except EmailCodeRequest.DoesNotExist:
        return

    result = request_the_code(code_request.email)
    code_request.is_successful = result
    code_request.save()
