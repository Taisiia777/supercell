import logging

from aiogram import Router
from aiogram.filters import ExceptionTypeFilter, Command
from aiogram.types import ErrorEvent, Message

from .callbacks import router as callbacks_router
from .commands import router as commands_router
from .messages import router as messages_router
from ..filters import PrivateChatFilter
# from .referral import router as referral_router

logger = logging.getLogger(__name__)

router = Router()

router.message.filter(PrivateChatFilter())
router.callback_query.filter(PrivateChatFilter())
router.include_routers( commands_router, callbacks_router, messages_router)


@router.message(Command("get_id"))
async def get_chat_id_handler(message: Message):
    await message.answer(str(message.chat.id))


@router.error(ExceptionTypeFilter(Exception))
async def error_handler(event: ErrorEvent):
    logger.exception(event.exception)

    try:
        chat_id = event.update.event.chat.id
    except Exception:
        chat_id = event.update.event.from_user.id

    await event.update.bot.send_message(
        chat_id,
        "Произошла ошибка бота, повторите попытку позже или введите /start",
    )
