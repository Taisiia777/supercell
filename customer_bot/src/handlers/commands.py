# from pathlib import Path

# from aiogram import Router, types
# from aiogram.filters import Command

# from create_bot import settings

# router = Router()

# HELLO_TEXT = (
#     '<b>🎊Welcome! 📲<a href="https://t.me/Mamoyan_shop">Mamostore</a> '
#     "- сервис внутриигровых покупок и услуг</b>"
# )

# file = Path(__file__).parent.parent.parent / "static" / "main.png"
# HELLO_IMAGE = types.FSInputFile(file)
# webapp_button = None
# if settings.CUSTOMER_WEBAPP_URL:
#     webapp_button = types.InlineKeyboardMarkup(
#         inline_keyboard=[
#             [
#                 types.InlineKeyboardButton(
#                     text="Магазин",
#                     web_app=types.WebAppInfo(url=str(settings.CUSTOMER_WEBAPP_URL)),
#                 )
#             ]
#         ]
#     )


# @router.message(Command("start"))
# async def start_command(message: types.Message):
#     await message.answer_photo(
#         HELLO_IMAGE, caption=HELLO_TEXT, reply_markup=webapp_button
#     )

#     if settings.CUSTOMER_WEBAPP_URL:
#         await message.bot.set_chat_menu_button(
#             message.from_user.id,
#             menu_button=types.MenuButtonWebApp(
#                 text="Магазин",
#                 web_app=types.WebAppInfo(
#                     url=str(settings.CUSTOMER_WEBAPP_URL),
#                 ),
#             ),
#         )
from pathlib import Path

from aiogram import Router, types
from aiogram.filters import Command, CommandObject
from aiogram.utils.deep_linking import decode_payload, create_start_link

from create_bot import settings, bot
from customer_api.client import CustomerAPIClient

router = Router()
api_client = CustomerAPIClient()

HELLO_TEXT = (
    '<b>🎊Welcome! 📲<a href="https://t.me/Mamoyan_shop">Mamostore</a> '
    "- сервис внутриигровых покупок и услуг</b>"
)

file = Path(__file__).parent.parent.parent / "static" / "main.png"
HELLO_IMAGE = types.FSInputFile(file)
webapp_button = None
if settings.CUSTOMER_WEBAPP_URL:
    webapp_button = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="Магазин",
                    web_app=types.WebAppInfo(url=str(settings.CUSTOMER_WEBAPP_URL)),
                )
            ]
        ]
    )


@router.message(Command("start"))
async def start_command(message: types.Message, command: CommandObject = None):
    # Отправляем приветственное сообщение
    await message.answer_photo(
        HELLO_IMAGE, caption=HELLO_TEXT, reply_markup=webapp_button
    )
    
    # Добавляем основную клавиатуру
    from src import keyboards as kb
    await message.answer("Выберите действие:", reply_markup=kb.MAIN_MENU_KB)

    if settings.CUSTOMER_WEBAPP_URL:
        await message.bot.set_chat_menu_button(
            message.from_user.id,
            menu_button=types.MenuButtonWebApp(
                text="Магазин",
                web_app=types.WebAppInfo(
                    url=str(settings.CUSTOMER_WEBAPP_URL),
                ),
            ),
        )
    
    # Обрабатываем реферальный код, если есть
    if command and command.args:
        referral_code = command.args
        user_id = message.from_user.id
        
        # Применяем реферальный код
        result = await api_client.apply_referral_code(user_id, referral_code)
        
        if result.get("status"):
            await message.answer("🎉 Поздравляем! Реферальный код применен успешно.")
        else:
            error_msg = result.get("message", "Не удалось применить реферальный код")
            await message.answer(f"ℹ️ {error_msg}")


@router.message(Command("ref"))
async def referral_command(message: types.Message):
    """Команда для получения реферальной ссылки"""
    user_id = message.from_user.id
    result = await api_client.get_referral_link(user_id)
    
    if result.get("status") and result.get("link"):
        # Создаем клавиатуру со статистикой
        keyboard = types.InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    types.InlineKeyboardButton(
                        text="Моя статистика", 
                        callback_data="ref_stats"
                    )
                ]
            ]
        )
        
        await message.answer(
            f"🔗 Ваша реферальная ссылка:\n{result['link']}\n\n"
            f"Поделитесь ею с друзьями и получайте бонусы за приглашенных пользователей!",
            reply_markup=keyboard
        )
    else:
        await message.answer("😔 Не удалось получить реферальную ссылку. Попробуйте позже.")