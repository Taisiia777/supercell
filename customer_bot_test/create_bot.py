from aiogram import Bot, Dispatcher
from pydantic import HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class BotConfig(BaseSettings):
    BOT_TOKEN: str = ""  # Оставьте пустым или переименуйте переменную
    TEST_BOT_TOKEN: str  # Добавьте новую переменную для тестового токена
    CELERY_BROKER_URL: str
    REDIS_URL: str | None = None
    CUSTOMER_WEBAPP_URL: HttpUrl

    BOT_LOGLEVEL_INFO: bool = False
    BOT_WEBSERVER_HOST: str = "0.0.0.0"
    BOT_WEBSERVER_PORT: int = 8090  # Измените порт, чтобы отличался от основного бота
    BOT_WEBSERVER_PATH: str | None = "/webhook/test"  # Измените путь для веб-хука
    BOT_WEBSERVER_URL: str | None = None
    BOT_WEBSERVER_SECRET: str | None = None

    model_config = SettingsConfigDict(
        env_file="../.env", env_file_encoding="utf-8", extra="ignore"
    )


settings = BotConfig()
storage = None
if settings.REDIS_URL:
    from aiogram.fsm.storage.redis import RedisStorage

    # Используйте другую базу Redis для тестового бота (например, 9 вместо 0)
    test_redis_url = settings.REDIS_URL.replace("/0", "/9")
    storage = RedisStorage.from_url(test_redis_url)

# Используйте TEST_BOT_TOKEN вместо BOT_TOKEN
bot = Bot(token=settings.TEST_BOT_TOKEN, parse_mode="HTML")
dp = Dispatcher(storage=storage)
