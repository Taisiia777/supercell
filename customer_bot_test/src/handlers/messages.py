from contextlib import suppress

from aiogram import Router, types
from aiogram.fsm.context import FSMContext

from src.states import BotState
from src import keyboards as kb
from customer_api.client import CustomerAPIClient

router = Router()
api_client = CustomerAPIClient()


@router.message(BotState.INPUT_LOGIN_CODE)
async def receive_login_code_handler(message: types.Message, state: FSMContext):
    if not (message.text.isdigit() and len(message.text) == 6):
        await message.answer(
            "Код должен состоять из 6 цифр", reply_markup=kb.CANCEL_INPUT_LOGIN_CODE_KB
        )
        return

    data = await state.get_data()
    result = await api_client.save_new_login_code(data.get("line_id"), message.text)
    code_message_id = data.get("code_message_id")
    await state.set_state()
    await state.update_data(line_id=None, code_message_id=None)
    await message.answer("Код принят" if result else "Не удалось сохранить код")

    with suppress(Exception):
        await message.bot.delete_message(message.chat.id, code_message_id)
