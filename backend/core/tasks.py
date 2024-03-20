import logging

from celery import shared_task
from oscar.core.loading import get_model

from core.services.customer import (
    CustomerOrderNotifier,
    CustomerAccountCodeNotifier,
    CustomerFailedPaymentNotifier,
)
from core.models import EmailCodeRequest
from supercell_auth.login import request_the_code

logger = logging.getLogger(__name__)
OrderLine = get_model("order", "Line")


@shared_task(name="api.davdamer.order_status_updated")
def order_status_updated(order_pk: int):
    CustomerOrderNotifier(order_pk).notify()


@shared_task(name="api.davdamer.request_code")
def davdamer_requested_code(line_id: int):
    try:
        line = OrderLine.objects.get(pk=line_id)
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

    requested_successful = request_the_code(login_data.account_id)
    EmailCodeRequest.objects.create(
        email=login_data.account_id, is_successful=requested_successful
    )
    if requested_successful:
        CustomerAccountCodeNotifier(
            line.order.user, login_data.account_id, line_id
        ).notify()


@shared_task(name="api.shop.request_code")
def request_supercell_code(code_request_pk: int):
    try:
        code_request = EmailCodeRequest.objects.get(pk=code_request_pk)
    except EmailCodeRequest.DoesNotExist:
        return

    result = request_the_code(code_request.email)
    code_request.is_successful = result
    code_request.save()


@shared_task(name="api.shop.failed_payment")
def failed_payment_task(order_number: str):
    CustomerFailedPaymentNotifier(order_number).notify()
