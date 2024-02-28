from aiogram import Router, types
from aiogram.filters import Command

from create_bot import settings

router = Router()

HELLO_TEXT = """Добро пожаловать - приложение «ДОСТАВКА ФУДСИТИ»!

Все самое свежее и натуральное с легендарного рынка! 

👉 Бесплатная доставка
👉 Низкие цены
👉 Гарантия качества

Продукты со всего мира 🌍"""
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
async def start_command(message: types.Message):
    await message.answer(HELLO_TEXT, reply_markup=webapp_button)

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
