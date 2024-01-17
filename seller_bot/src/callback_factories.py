from aiogram.filters.callback_data import CallbackData

from src.enums import OrderAction


class SellerActionCf(CallbackData, prefix="slr_act"):
    order_number: str
    action: OrderAction
