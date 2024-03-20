import logging
from typing import Any

from aiogram import Bot, types
from aiogram.filters.callback_data import CallbackData
from django.conf import settings

from core.services.exceptions import InvalidCommandError, CommandWarning
from core.services.utils import send_message
from shop.order.enums import OrderStatus
from shop.order.models import Order
from core.models import User

bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
logger = logging.getLogger(__name__)


class CustomerOrderNotifier:
    def __init__(self, order_pk: int):
        self.order_pk: int = order_pk

        self.order: Order | None = None
        self.customer: User | None = None

    def _load_data(self) -> None:
        try:
            self.order = Order.objects.select_related("user").get(pk=self.order_pk)
        except Order.DoesNotExist:
            raise InvalidCommandError(f"Order with pk={self.order_pk} does not exist")

        if self.order.user and self.order.user.telegram_chat_id:
            self.customer = self.order.user
        else:
            raise InvalidCommandError(
                f"Cannot get customer for order with pk={self.order_pk}"
            )

    def _prepare_message(self) -> tuple[str, Any]:
        match self.order.status:
            case OrderStatus.PAID:
                action = "оплачен"
            case OrderStatus.PROCESSING:
                action = "в процессе обработки"
            case OrderStatus.DELIVERED:
                action = "завершен"
            case OrderStatus.CANCELLED:
                action = "отменён"
            case _:
                raise CommandWarning(
                    f"Unsupported order status {self.order.status} pk={self.order_pk}"
                )

        text = f"Ваш заказ <code>{self.order.number}</code> {action}"
        return text, None

    def notify(self) -> None:
        try:
            self._load_data()
            message, keyboard = self._prepare_message()
            send_message(
                bot, self.customer.telegram_chat_id, message, reply_markup=keyboard
            )
        except CommandWarning as err:
            logger.warning(err)
        except Exception as err:
            logger.exception(err)


class RequestLoginCodeCf(CallbackData, prefix="mgr_req_code"):
    line_id: int
    email: str


class CustomerAccountCodeNotifier:
    def __init__(self, user: User, email: str, line_id: int):
        self.user: User = user
        self.email: str = email
        self.line_id: int = line_id

    def _prepare_message(self) -> tuple[str, Any]:
        text = f"Менеджер запросил код для входа в аккаунт {self.email}"
        keyboard = types.InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    types.InlineKeyboardButton(
                        text="Отправить код",
                        callback_data=RequestLoginCodeCf(
                            line_id=self.line_id, email=self.email
                        ).pack(),
                    )
                ]
            ]
        )
        return text, keyboard

    def notify(self) -> None:
        if not self.user.telegram_chat_id:
            logger.warning(f"User {self.user.pk} has no telegram_chat_id")
            return

        message, keyboard = self._prepare_message()
        send_message(bot, self.user.telegram_chat_id, message, reply_markup=keyboard)
