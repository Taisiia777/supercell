from aiogram import Router, types
from aiogram.filters import Command

from seller_api.client import SellerAPIClient

router = Router()
seller_api = SellerAPIClient()


@router.message(Command("waiting_orders"))
async def waiting_orders_command(message: types.Message):
    orders = await seller_api.get_processing_orders(message.from_user.id)
    text = "Заказы на сборке:\n"
    for order in orders:
        text += f"{order.number} - {order.date_placed}\n"
    await message.answer(text)
