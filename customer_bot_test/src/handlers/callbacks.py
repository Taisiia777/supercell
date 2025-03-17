from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext

from src.callback_factories import RequestLoginCodeCf
from src.states import BotState
from src import keyboards as kb

router = Router()


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
