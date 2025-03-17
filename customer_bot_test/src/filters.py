from aiogram import types
from aiogram.filters import BaseFilter


class PrivateChatFilter(BaseFilter):
    async def __call__(self, message) -> bool:
        if isinstance(message, types.Message):
            return message.chat.type == "private"
        return True
