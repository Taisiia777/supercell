import logging
from typing import Any

from aiogram import Bot, types
from aiogram.filters.callback_data import CallbackData
from django.conf import settings
from oscar.core.loading import get_model

from core.services.exceptions import InvalidCommandError, CommandWarning
from core.services.utils import send_message
from shop.order.enums import OrderStatus
from shop.order.models import Order
from core.models import User

bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
logger = logging.getLogger(__name__)
OrderLine = get_model("order", "Line")


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
                text = (
                    f"Оплата прошла успешно по заказу {self.order.number} на "
                    f"сумму {self.order.total_incl_tax} руб. "
                    "Ожидайте, пожалуйста, менеджер возьмет в работу Ваш заказ в "
                    "течение нескольких минут."
                )
            case OrderStatus.DELIVERED:
                text = (
                    f"🎯 Ваш заказ {self.order.number} был недавно Выполнен!\n"
                    "Мы знаем, что у вас есть выбор! Спасибо, что выбрали нас!"
                )
            case OrderStatus.CANCELLED:
                text = (
                    f"🎯 К сожалению, по вашему заказу {self.order.number} "
                    "был оформлен возврат!\n\n"
                    "Надеемся, что ваш опыт пользования сервисом остался положительным!"
                    " Будем рады видеть вас вновь, всего доброго!"
                )
            case _:
                raise CommandWarning(
                    f"Unsupported order status {self.order.status} pk={self.order_pk}"
                )

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

        self.order: Order = OrderLine.objects.get(pk=line_id).order

    def _prepare_message(self) -> tuple[str, Any]:
        text = (
            f"По заказу {self.order.number} к почте {self.email} неправильно указан "
            f"код. Проверьте, пожалуйста, почтовый ящик, затем, направьте нам новый "
            f"код в бота"
        )
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


class CustomerFailedPaymentNotifier:
    def __init__(self, order_number: str):
        self.order_number = order_number
        self.order = None
        self.customer = None

    def _load_data(self):
        try:
            self.order = Order.objects.get(number=self.order_number)
            self.customer = self.order.user
        except Order.DoesNotExist:
            raise InvalidCommandError(
                f"Order with number={self.order_number} does not exist"
            )

        if self.customer is None or self.customer.telegram_chat_id is None:
            raise InvalidCommandError(
                f"Cannot get customer for order with number={self.order_number}"
            )

    def _prepare_message(self) -> tuple[str, Any]:
        text = (
            f"💡 К сожалению, у вас не прошла оплата по вашему заказу "
            f"{self.order.number}. Попробуйте, пожалуйста, другой метод оплаты "
            f"в приложении!."
        )
        return text, None

    def notify(self) -> None:
        try:
            self._load_data()
            message, keyboard = self._prepare_message()
            send_message(
                bot, self.customer.telegram_chat_id, message, reply_markup=keyboard
            )
        except Exception as err:
            logger.warning(err)
