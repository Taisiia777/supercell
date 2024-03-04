import logging

from aiogram import Bot, types
from aiogram.filters.callback_data import CallbackData
from django.conf import settings

from core.services.exceptions import InvalidCommandError
from core.services.utils import send_message
from shop.order.enums import OrderStatus
from shop.order.models import Order

logger = logging.getLogger(__name__)

bot = Bot(token=settings.SELLER_BOT_TOKEN, parse_mode="HTML")


class SellerActionCf(CallbackData, prefix="slr_act"):
    order_number: str
    action: str


class SellerNotifier:
    def __init__(self, order_pk: int):
        self.order_pk = order_pk

        self.order = None
        self.seller = None
        self.seller_profile = None

    def _load_data(self):
        try:
            self.order = (
                Order.objects.select_related("seller")
                .prefetch_related("lines")
                .get(pk=self.order_pk)
            )
            seller = self.order.seller
        except Order.DoesNotExist:
            raise InvalidCommandError(f"Order with pk={self.order_pk} does not exist")

        seller_profile = seller.users.first()
        self.seller_profile = seller_profile
        if not seller_profile or not seller_profile.telegram_chat_id:
            raise InvalidCommandError(
                f"Seller with pk={seller.pk} does not have a profile"
            )

    def _prepare_message(self):
        text = (
            f"<b>Новый заказ <code>{self.order.number}</code></b>\n"
            f"Дата заказа: {self.order.date_placed.strftime('%d.%m.%Y %H:%M:%S')}\n"
            f"Магазин: {self.order.seller.name}\n\n"
            f"Товары:\n"
        )
        for line in self.order.lines.all():
            text += f"- {line.product.title} x {line.quantity} шт.\n"

        keyboard = types.InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    types.InlineKeyboardButton(
                        text="Отменить заказ",
                        callback_data=SellerActionCf(
                            order_number=self.order.number, action="cancel"
                        ).pack(),
                    ),
                ],
            ]
        )
        return text, keyboard

    def _mark_order_as_processing(self):
        self.order.status = OrderStatus.PROCESSING
        self.order.save(update_fields=["status"])

    def _send_message_to_seller(self):
        text, keyboard = self._prepare_message()
        send_message(
            bot, self.seller_profile.telegram_chat_id, text, reply_markup=keyboard
        )

    def notify(self):
        try:
            self._load_data()
            self._send_message_to_seller()
            self._mark_order_as_processing()
        except Exception as err:
            logger.exception(err)


class SellerActionHandler:
    def __init__(self, order_number: str, action: str):
        self.order_number = order_number
        self.action = action

        self.order = None

    def _load_data(self):
        try:
            self.order = Order.objects.get(number=self.order_number)
        except Order.DoesNotExist:
            raise InvalidCommandError(
                f"Order with number={self.order_number} does not exist"
            )

    def _handle_action(self):
        if self.action == "cancel":
            self.order.status = OrderStatus.CANCELLED

        self.order.save(update_fields=["status", "updated_dt"])

    def act(self):
        try:
            self._load_data()
            self._handle_action()
        except Exception as err:
            logger.exception(err)
