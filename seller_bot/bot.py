import asyncio
import logging
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web

from create_bot import bot, dp, settings

logging.basicConfig(
    level=logging.INFO if settings.BOT_LOGLEVEL_INFO else logging.WARNING,
    format="%(filename)s:%(lineno)d #%(levelname)-8s "
    "[%(asctime)s] - %(name)s - %(message)s",
)


async def on_startup():
    assert settings.BOT_WEBSERVER_URL and settings.BOT_WEBSERVER_PATH
    await bot.set_webhook(
        f"{settings.BOT_WEBSERVER_URL}{settings.BOT_WEBSERVER_PATH}",
        secret_token=settings.BOT_WEBSERVER_SECRET,
    )


async def on_shutdown():
    await bot.delete_webhook()


def start_webhook():
    app = web.Application()
    webhook_requests_handler = SimpleRequestHandler(
        dispatcher=dp, bot=bot, secret_token=settings.BOT_WEBSERVER_SECRET
    )
    webhook_requests_handler.register(app, path=settings.BOT_WEBSERVER_PATH)
    dp.startup.register(on_startup)
    dp.shutdown.register(on_shutdown)
    setup_application(app, dp, bot=bot)
    web.run_app(app, host=settings.BOT_WEBSERVER_HOST, port=settings.BOT_WEBSERVER_PORT)


if __name__ == "__main__":
    from src.handlers import router

    # from src.middlewares import DbSessionMiddleware
    # from core.database import AsyncSession
    #
    # dp.update.middleware(DbSessionMiddleware(session_pool=AsyncSession))
    dp.include_router(router)

    if settings.BOT_WEBSERVER_URL and settings.BOT_WEBSERVER_PATH:
        start_webhook()
    else:
        asyncio.run(dp.start_polling(bot))
