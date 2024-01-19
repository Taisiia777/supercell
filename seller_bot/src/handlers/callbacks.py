import datetime

from aiogram import Router, types

from src import callback_factories as cf
from src.enums import OrderAction
from src.external import app as celery_app
from src.utils import format_dt

router = Router()


@router.callback_query(cf.SellerActionCf.filter())
async def handle_order_callback(
    callback_query: types.CallbackQuery, callback_data: cf.SellerActionCf
):
    celery_app.send_task(
        "bot.seller.act",
        kwargs={
            "order_number": callback_data.order_number,
            "action": callback_data.action,
        },
    )
    action_text = "Собран" if callback_data.action == OrderAction.READY else "Отменён"
    time_text = format_dt(datetime.datetime.now())
    upd = callback_query.message.html_text + f"\n\n<i>{action_text} {time_text}</i>"
    await callback_query.message.edit_text(upd, reply_markup=None)
    await callback_query.answer()
