from aiogram import Router, types
from aiogram.filters import Command

from seller_api.client import SellerAPIClient
from src import callback_factories as cf
from src.enums import OrderAction
from src.utils import format_dt

router = Router()
seller_api = SellerAPIClient()


@router.message(Command("waiting_orders"))
async def waiting_orders_command(message: types.Message):
    def make_order_message(order):
        text = (
            f"<b>Заказ <code>{order.number}</code></b>\n"
            f"Дата заказа: {format_dt(order.date_placed)}\n"
            f"Магазин: {order.seller.name}\n\n"
            f"Товары:\n"
        )
        for line in order.lines:
            text += f"- {line.product.title} x {line.quantity} шт.\n"

        keyboard = types.InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    types.InlineKeyboardButton(
                        text="Заказ собран",
                        callback_data=cf.SellerActionCf(
                            order_number=order.number, action=OrderAction.READY
                        ).pack(),
                    )
                ],
                [
                    types.InlineKeyboardButton(
                        text="Отменить заказ",
                        callback_data=cf.SellerActionCf(
                            order_number=order.number, action=OrderAction.CANCEL
                        ).pack(),
                    )
                ],
            ]
        )

        return text, keyboard

    orders = await seller_api.get_processing_orders(message.from_user.id)
    for current_order in orders[:5]:
        order_text, markup = make_order_message(current_order)
        await message.answer(order_text, reply_markup=markup)

    if len(orders) == 0:
        await message.answer("Заказов на сборку нет")
    elif len(orders) > 5:
        await message.answer(f"Показаны первые 5 заказов, всего: {len(orders)}")
