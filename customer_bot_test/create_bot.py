from aiogram import Bot, Dispatcher
from pydantic import HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class BotConfig(BaseSettings):
    BOT_TOKEN: str
    CELERY_BROKER_URL: str
    REDIS_URL: str | None = None
    CUSTOMER_WEBAPP_URL: HttpUrl

    BOT_LOGLEVEL_INFO: bool = False
    BOT_WEBSERVER_HOST: str = "0.0.0.0"
    BOT_WEBSERVER_PORT: int = 8080
    BOT_WEBSERVER_PATH: str | None = None
    BOT_WEBSERVER_URL: str | None = None
    BOT_WEBSERVER_SECRET: str | None = None

    model_config = SettingsConfigDict(
        env_file="../.env", env_file_encoding="utf-8", extra="ignore"
    )


settings = BotConfig()
storage = None
if settings.REDIS_URL:
    from aiogram.fsm.storage.redis import RedisStorage

    storage = RedisStorage.from_url(str(settings.REDIS_URL))

bot = Bot(token=settings.BOT_TOKEN, parse_mode="HTML")
dp = Dispatcher(storage=storage)
