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
import logging
from contextlib import suppress

from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext

from src.states import BotState
from src import keyboards as kb
from customer_api.client import CustomerAPIClient
from customer_api.exceptions import CustomerAPIError

router = Router()
api_client = CustomerAPIClient()
logger = logging.getLogger(__name__)


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
    """Обработчик для кнопки Реферальная программа в меню"""
    user_id = message.from_user.id
    
    # Отправляем информацию о реферальной программе
    intro_text = (
        "<b>👥 Реферальная программа Mamostore</b>\n\n"
        "Приглашайте друзей и получайте бонусы за каждого приглашенного пользователя!\n\n"
        "<b>Как это работает:</b>\n"
        "1️⃣ Получите уникальную реферальную ссылку\n"
        "2️⃣ Отправьте её друзьям\n"
        "3️⃣ Когда друг перейдет по ссылке и совершит покупку, вы получите бонус\n\n"
        "<b>Преимущества:</b>\n"
        "• 5️⃣ рефералов — статус Серебряного партнера (+5% к бонусам)\n"
        "• 🔟 рефералов — статус Золотого партнера (+10% к бонусам)\n"
        "• 2️⃣0️⃣ рефералов — статус VIP-партнера (+15% к бонусам)\n\n"
        "Выберите действие:"
    )
    
    # Создаем клавиатуру с выбором действий
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="🔗 Получить мою ссылку", 
                    callback_data="get_ref_link"
                )
            ],
            [
                types.InlineKeyboardButton(
                    text="📊 Моя статистика", 
                    callback_data="ref_stats"
                )
            ],
            [
                types.InlineKeyboardButton(
                    text="❓ Как это работает", 
                    callback_data="ref_how_it_works"
                )
            ]
        ]
    )
    
    await message.answer(intro_text, reply_markup=keyboard, parse_mode="HTML")


@router.message(Command("ref"))
async def referral_command(message: types.Message):
    """Команда для получения реферальной ссылки"""
    user_id = message.from_user.id
    
    try:
        result = await api_client.get_referral_link(user_id)
        
        if result.get("status") and result.get("link"):
            # Формируем прямую ссылку для Telegram
            referral_link = result['link']
            
            # Создаем копируемый формат для удобства пользователя
            # Убедимся, что это точно ссылка на Telegram бота с параметром start
            if "t.me/" in referral_link and "?start=" in referral_link:
                bot_username = "Mamoshop_bot"  # Или извлекаем из ссылки
                referral_code = referral_link.split("?start=")[1]
                
                formatted_link = f"https://t.me/{bot_username}?start={referral_code}"
            else:
                formatted_link = referral_link
            
            # Создаем клавиатуру со статистикой и кнопкой копирования
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
            
            # Отправляем красивое сообщение с ссылкой
            text = (
                f"🔗 <b>Ваша реферальная ссылка готова!</b>\n\n"
                f"<code>{formatted_link}</code>\n\n"
                f"<b>Как это работает:</b>\n"
                f"1️⃣ Отправьте эту ссылку друзьям\n"
                f"2️⃣ Когда друг перейдет по ссылке и совершит первую покупку, вы получите бонус\n"
                f"3️⃣ Чем больше друзей, тем больше бонусов!\n\n"
                f"Нажмите на кнопку ниже, чтобы посмотреть вашу статистику рефералов."
            )
            
            await message.answer(text, reply_markup=keyboard, parse_mode="HTML")
        else:
            await message.answer("😔 Не удалось получить вашу реферальную ссылку. Пожалуйста, попробуйте позже.")
    except Exception as e:
        logger.exception(f"Ошибка при получении реферальной ссылки: {str(e)}")
        await message.answer("😔 Произошла ошибка. Пожалуйста, попробуйте позже.")