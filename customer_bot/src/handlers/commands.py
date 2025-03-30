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
import logging
from pathlib import Path

from aiogram import Router, types
from aiogram.filters import Command, CommandObject

from create_bot import settings, bot
from customer_api.client import CustomerAPIClient
from customer_api.exceptions import CustomerAPIError

router = Router()
api_client = CustomerAPIClient()
logger = logging.getLogger(__name__)

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
    """
    Обработчик команды /start
    Поддерживает реферальные коды через параметр start
    """
    user_id = message.from_user.id
    
    # Отправляем приветственное сообщение
    await message.answer_photo(
        HELLO_IMAGE, caption=HELLO_TEXT, reply_markup=webapp_button
    )

    if settings.CUSTOMER_WEBAPP_URL:
        await message.bot.set_chat_menu_button(
            user_id,
            menu_button=types.MenuButtonWebApp(
                text="Магазин",
                web_app=types.WebAppInfo(
                    url=str(settings.CUSTOMER_WEBAPP_URL),
                ),
            ),
        )
    
    # Обрабатываем реферальный код, если есть
    if command and command.args:
        referral_code = command.args.strip()
        logger.info(f"Пользователь {user_id} запустил бота с реферальным кодом: {referral_code}")
        
        # Применяем реферальный код
        try:
            result = await api_client.apply_referral_code(user_id, referral_code)
            logger.info(f"Результат применения кода: {result}")
            
            if result.get("status"):
                logger.info(f"Успешно применен реферальный код {referral_code} для пользователя {user_id}")
                # Не отправляем дополнительного сообщения пользователю
            else:
                msg = result.get("message", "")
                if msg:
                    logger.warning(f"Ошибка применения реферального кода {referral_code}: {msg}")
                else:
                    logger.warning(f"Ошибка применения реферального кода {referral_code}. Пустое сообщение об ошибке.")
        except Exception as e:
            logger.exception(f"Исключение при применении реферального кода: {str(e)}")