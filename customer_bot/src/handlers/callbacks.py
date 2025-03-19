# from aiogram import Router, types, F
# from aiogram.fsm.context import FSMContext

# from src.callback_factories import RequestLoginCodeCf
# from src.states import BotState
# from src import keyboards as kb

# router = Router()


# @router.callback_query(RequestLoginCodeCf.filter())
# async def input_login_code(
#     callback_query: types.CallbackQuery,
#     callback_data: RequestLoginCodeCf,
#     state: FSMContext,
# ):
#     await state.update_data(
#         line_id=callback_data.line_id, code_message_id=callback_query.message.message_id
#     )
#     text = f"Введите код для входа в аккаунт {callback_data.email}"
#     await callback_query.message.answer(text)
#     await state.set_state(BotState.INPUT_LOGIN_CODE)
#     await callback_query.answer()


# @router.callback_query(F.data == kb.CANCEL_CODE_CB)
# async def cancel_input_login_code(
#     callback_query: types.CallbackQuery, state: FSMContext
# ):
#     await state.update_data(line_id=None, code_message_id=None)
#     await state.set_state()
#     await callback_query.message.edit_reply_markup()
#     await callback_query.answer()
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext

from src.callback_factories import RequestLoginCodeCf
from src.states import BotState
from src import keyboards as kb
from customer_api.client import CustomerAPIClient

router = Router()
api_client = CustomerAPIClient()


@router.callback_query(RequestLoginCodeCf.filter())
async def input_login_code(
    callback_query: types.CallbackQuery,
    callback_data: RequestLoginCodeCf,
    state: FSMContext,
):
    await state.update_data(
        line_id=callback_data.line_id, code_message_id=callback_query.message.message_id
    )
    text = f"Введите код для входа в аккаунт {callback_data.email}"
    await callback_query.message.answer(text)
    await state.set_state(BotState.INPUT_LOGIN_CODE)
    await callback_query.answer()


@router.callback_query(F.data == kb.CANCEL_CODE_CB)
async def cancel_input_login_code(
    callback_query: types.CallbackQuery, state: FSMContext
):
    await state.update_data(line_id=None, code_message_id=None)
    await state.set_state()
    await callback_query.message.edit_reply_markup()
    await callback_query.answer()


@router.callback_query(F.data == "ref_stats")
async def referral_stats_handler(callback_query: types.CallbackQuery):
    """Обработчик для получения статистики рефералов"""
    user_id = callback_query.from_user.id
    
    # Получаем статистику по рефералам
    result = await api_client.get_referral_stats(user_id)
    
    if result.get("status"):
        referrals_count = result.get("referrals_count", 0)
        
        # Формируем сообщение со статистикой
        text = f"📊 <b>Статистика ваших рефералов</b>\n\n"
        text += f"👥 Количество приглашенных пользователей: <b>{referrals_count}</b>\n"
        
        if "bonus_points" in result:
            text += f"🎁 Накоплено бонусных баллов: <b>{result['bonus_points']}</b>\n"
            
        if "additional_info" in result:
            text += f"\n{result['additional_info']}"
            
        await callback_query.message.edit_text(
            text,
            reply_markup=callback_query.message.reply_markup
        )
    else:
        await callback_query.answer("Не удалось получить статистику рефералов", show_alert=True)