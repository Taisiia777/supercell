# from contextlib import suppress

# from aiogram import Router, types
# from aiogram.fsm.context import FSMContext

# from src.states import BotState
# from src import keyboards as kb
# from customer_api.client import CustomerAPIClient

# router = Router()
# api_client = CustomerAPIClient()


# @router.message(BotState.INPUT_LOGIN_CODE)
# async def receive_login_code_handler(message: types.Message, state: FSMContext):
#     if not (message.text.isdigit() and len(message.text) == 6):
#         await message.answer(
#             "Код должен состоять из 6 цифр", reply_markup=kb.CANCEL_INPUT_LOGIN_CODE_KB
#         )
#         return

#     data = await state.get_data()
#     result = await api_client.save_new_login_code(data.get("line_id"), message.text)
#     code_message_id = data.get("code_message_id")
#     await state.set_state()
#     await state.update_data(line_id=None, code_message_id=None)
#     await message.answer("Код принят" if result else "Не удалось сохранить код")

#     with suppress(Exception):
#         await message.bot.delete_message(message.chat.id, code_message_id)
from contextlib import suppress

from aiogram import Router, types, F
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


@router.message(F.text == "👥 Реферальная программа")
async def referral_program_handler(message: types.Message):
    """Обработчик для кнопки Реферальная программа"""
    user_id = message.from_user.id
    
    # Получаем информацию о реферальной ссылке
    result = await api_client.get_referral_link(user_id)
    
    if result.get("status") and result.get("link"):
        # Создаем клавиатуру со статистикой
        keyboard = types.InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    types.InlineKeyboardButton(
                        text="📊 Моя статистика", 
                        callback_data="ref_stats"
                    )
                ]
            ]
        )
        
        text = (
            "👥 <b>Реферальная программа</b>\n\n"
            "Приглашайте друзей в наш сервис и получайте бонусы за каждого приглашенного пользователя!\n\n"
            f"🔗 <b>Ваша реферальная ссылка:</b>\n{result['link']}\n\n"
            "Как это работает:\n"
            "1. Отправьте вашу реферальную ссылку друзьям\n"
            "2. Когда друг перейдет по ссылке и совершит первую покупку, вы получите бонус\n"
            "3. Чем больше друзей вы пригласите, тем больше бонусов получите\n\n"
            "Воспользуйтесь кнопкой ниже, чтобы посмотреть вашу статистику рефералов."
        )
        
        await message.answer(text, reply_markup=keyboard)
    else:
        await message.answer(
            "😔 Не удалось получить информацию о реферальной программе. Попробуйте позже."
        )