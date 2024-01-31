import asyncio

from aiogram import Bot


def send_message(bot: Bot, *args, **kwargs):
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    loop.run_until_complete(bot.send_message(*args, **kwargs))
