from celery import shared_task

from core.services.seller import SellerNotifier, SellerActionHandler


@shared_task(name="api.shop.new_order")
def new_order(order_pk: int):
    SellerNotifier(order_pk).notify()


@shared_task(name="bot.seller.act")
def seller_action(order_number: str, action: str):
    SellerActionHandler(order_number, action).act()
