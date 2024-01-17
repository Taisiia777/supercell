from aiogram import Router, types

from src import callback_factories as cf
from src.external import app as celery_app

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
    await callback_query.message.edit_reply_markup(reply_markup=None)
    await callback_query.answer()
