from aiogram import Router, types
from aiogram.filters import Command

from create_bot import settings

router = Router()


@router.message(Command("start"))
async def start_command(message: types.Message):
    await message.answer("Добро пожаловать!")
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
