from aiogram import Router, types
from aiogram.fsm.context import FSMContext

from src.states import BotState
from src import keyboards as kb

router = Router()


@router.message(BotState.INPUT_LOGIN_CODE)
async def receive_login_code_handler(message: types.Message, state: FSMContext):
    if not (message.text.isdigit() and len(message.text) == 6):
        await message.answer(
            "Код должен состоять из 6 цифр", reply_markup=kb.CANCEL_INPUT_LOGIN_CODE_KB
        )
        return

    await state.update_data(login_code=message.text)
    await state.set_state()
    await message.answer("Код принят")
