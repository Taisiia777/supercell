
# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# import asyncio
# from telegram import Bot
# import os
# import logging
# from typing import List

# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger(__name__)

# app = FastAPI()

# # Упрощенные модели данных
# class OrderLineModel(BaseModel):
#     product_title: str
#     quantity: int
#     mailbox: str
#     code: str

# class OrderModel(BaseModel):
#     number: str
#     lines: List[OrderLineModel]
#     total_incl_tax: float
#     client_id: str

# # Загрузка конфигурации
# TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
# TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

# if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
#     raise ValueError("Необходимо указать TELEGRAM_TOKEN и TELEGRAM_CHAT_ID в переменных окружения")

# async def send_order_to_telegram(order: OrderModel):
#     """Отправка заказа в Telegram чат"""
#     message = f"🎯New order: №{order.number}\n"

#     for i, line in enumerate(order.lines):
#         star_emoji = "🌟" if i == 0 else "⭐️"
#         message += (
#             f"{star_emoji}{line.product_title} - {line.quantity} шт.\n"
#             f"📨 mailbox: {line.mailbox}\n"
#             f"💬 code: {line.code}\n"
#         )

#     message += (
#         f"💳На сумму - {order.total_incl_tax}₽\n"
#         f"👤Client ID: {order.client_id}"
#     )

#     try:
#         bot = Bot(token=TELEGRAM_TOKEN)
#         await bot.send_message(
#             chat_id=TELEGRAM_CHAT_ID,
#             text=message
#         )
#         logger.info(f"Заказ #{order.number} успешно отправлен в Telegram")
#     except Exception as e:
#         error_msg = f"Ошибка при отправке заказа #{order.number} в Telegram: {str(e)}"
#         logger.error(error_msg)
#         raise HTTPException(status_code=500, detail=error_msg)

# @app.post("/order/notify")
# async def notify_order(order: OrderModel):
#     """Endpoint для отправки уведомления о заказе"""
#     try:
#         await send_order_to_telegram(order)
#         return {"status": "success", "message": f"Заказ #{order.number} успешно отправлен"}
#     except Exception as e:
#         logger.error(f"Ошибка при обработке заказа: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/health")
# async def health_check():
#     """Endpoint для проверки работоспособности сервиса"""
#     return {"status": "healthy"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8001)











# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# import asyncio
# from telegram import Bot
# import os
# import logging
# from typing import List, Optional

# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger(__name__)

# app = FastAPI()

# # Упрощенные модели данных
# class OrderLineModel(BaseModel):
#     product_title: str
#     quantity: int
#     mailbox: str
#     code: str
#     type: Optional[str] = None  # Добавляем поле type для определения LINK и URL_LINK

# class OrderModel(BaseModel):
#     number: str
#     lines: List[OrderLineModel]
#     total_incl_tax: float
#     client_id: str

# # Загрузка конфигурации
# TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN', '7673463783:AAHZpW83AVUjAQnEI-AANmg8lXk7etfOmqE')
# TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '-1002250405760')
# # Добавляем новый чат для заказов с LINK и URL_LINK
# # Необходимо указать в переменных окружения нужный ID чата
# TELEGRAM_LINKS_CHAT_ID = "-1002351137755"

# # Если TELEGRAM_LINKS_CHAT_ID не указан, используем временное значение или выводим сообщение
# if not TELEGRAM_LINKS_CHAT_ID:
#     # Можно задать временное значение или использовать основной чат 
#     # в качестве запасного варианта
#     TELEGRAM_LINKS_CHAT_ID = os.getenv('TELEGRAM_LINKS_CHAT_ID_BACKUP', TELEGRAM_CHAT_ID)
#     logger.warning(
#         "TELEGRAM_LINKS_CHAT_ID не указан в переменных окружения. "
#         "Используется запасное значение. Рекомендуется указать TELEGRAM_LINKS_CHAT_ID "
#         "для корректной работы с заказами типа LINK и URL_LINK."
#     )

# # Данные базы данных (не используются в текущей реализации, но могут понадобиться позже)
# DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:W8gR0kfpR2mAMqRBApOdw15CVpmHMt7f@db:5432/supercell')
# DB_NAME = os.getenv('DB_NAME', 'supercell')
# DB_USER = os.getenv('DB_USER', 'user')
# DB_PASSWORD = os.getenv('DB_PASSWORD', 'W8gR0kfpR2mAMqRBApOdw15CVpmHMt7f')

# async def send_order_to_telegram(order: OrderModel):
#     """Отправка заказа в Telegram чат с учетом типов LINK и URL_LINK"""
#     message = f"🎯New order: №{order.number}\n"

#     # Улучшенная проверка типов
#     has_link_types = False
    
#     # Отладочная информация
#     logger.info(f"Получен заказ: {order.number}")
#     logger.info(f"Типы линий в заказе: {[line.type for line in order.lines]}")
    
#     for line in order.lines:
#         # Проверяем тип более надежным способом
#         if line.type and str(line.type).upper() in ["LINK", "URL_LINK"]:
#             has_link_types = True
#             logger.info(f"Найдена линия с типом {line.type}")
#             break
    
#     logger.info(f"has_link_types = {has_link_types}")
    
#     # Выбираем чат в зависимости от наличия линий с типами LINK или URL_LINK
#     chat_id = TELEGRAM_LINKS_CHAT_ID if has_link_types else TELEGRAM_CHAT_ID
    
#     logger.info(f"Выбранный chat_id: {chat_id}")
#     logger.info(f"TELEGRAM_CHAT_ID: {TELEGRAM_CHAT_ID}")
#     logger.info(f"TELEGRAM_LINKS_CHAT_ID: {TELEGRAM_LINKS_CHAT_ID}")
    
#     for i, line in enumerate(order.lines):
#         star_emoji = "🌟" if i == 0 else "⭐️"
#         message += (
#             f"{star_emoji}{line.product_title} - {line.quantity} шт.\n"
#             f"📨 mailbox: {line.mailbox}\n"
#             f"💬 code: {line.code}\n"
#         )
        
#         # Добавляем тип линии в сообщение, если он есть
#         if line.type:
#             message += f"🔗 type: {line.type}\n"

#     message += (
#         f"💳На сумму - {order.total_incl_tax}₽\n"
#         f"👤Client ID: {order.client_id}"
#     )

#     try:
#         bot = Bot(token=TELEGRAM_TOKEN)
#         await bot.send_message(
#             chat_id=chat_id,
#             text=message
#         )
        
#         chat_type = "LINKS" if has_link_types else "основной"
#         logger.info(f"Заказ #{order.number} успешно отправлен в {chat_type} Telegram чат (ID: {chat_id})")
#     except Exception as e:
#         error_msg = f"Ошибка при отправке заказа #{order.number} в Telegram: {str(e)}"
#         logger.error(error_msg)
#         raise HTTPException(status_code=500, detail=error_msg)

# @app.post("/order/notify")
# async def notify_order(order: OrderModel):
#     """Endpoint для отправки уведомления о заказе"""
#     try:
#         await send_order_to_telegram(order)
#         return {"status": "success", "message": f"Заказ #{order.number} успешно отправлен"}
#     except Exception as e:
#         logger.error(f"Ошибка при обработке заказа: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/health")
# async def health_check():
#     """Endpoint для проверки работоспособности сервиса"""
#     return {"status": "healthy"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8001)





from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
from telegram import Bot
import os
import logging
import json
from typing import List, Optional

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Упрощенные модели данных
class OrderLineModel(BaseModel):
    product_title: str
    quantity: int
    mailbox: str
    code: str
    type: Optional[str] = None  # Добавляем поле type для определения LINK и URL_LINK

class OrderModel(BaseModel):
    number: str
    lines: List[OrderLineModel]
    total_incl_tax: float
    client_id: str

# Загрузка конфигурации
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN', '7673463783:AAHZpW83AVUjAQnEI-AANmg8lXk7etfOmqE')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '-1002250405760')
TELEGRAM_LINKS_CHAT_ID = "-1002351137755"

if not TELEGRAM_LINKS_CHAT_ID:
    TELEGRAM_LINKS_CHAT_ID = os.getenv('TELEGRAM_LINKS_CHAT_ID_BACKUP', TELEGRAM_CHAT_ID)
    logger.warning(
        "TELEGRAM_LINKS_CHAT_ID не указан в переменных окружения. "
        "Используется запасное значение."
    )

async def send_order_to_telegram(order: OrderModel):
    """Отправка заказа в Telegram чат с учетом типов LINK и URL_LINK"""
    # Выводим все данные заказа в консоль для отладки
    logger.info("============ ПОЛНАЯ СТРУКТУРА ЗАКАЗА ============")
    logger.info(f"Номер заказа: {order.number}")
    logger.info(f"Сумма заказа: {order.total_incl_tax}")
    logger.info(f"ID клиента: {order.client_id}")
    logger.info("Строки заказа:")
    
    # Выводим каждую строку заказа
    for idx, line in enumerate(order.lines):
        logger.info(f"  Строка {idx+1}:")
        for field_name, field_value in line.dict().items():
            logger.info(f"    {field_name}: {field_value}")
    
    # Дополнительно выводим полный JSON для отладки
    logger.info("Полный JSON заказа:")
    logger.info(json.dumps(order.dict(), indent=2, ensure_ascii=False))
    logger.info("============ КОНЕЦ СТРУКТУРЫ ЗАКАЗА ============")

    # Составляем сообщение для Telegram
    message = f"🎯New order: №{order.number}\n"

    # Проверка типов для определения нужного чата
    has_link_types = False
    
    # Отладочная информация о типах
    logger.info(f"Типы линий в заказе: {[line.type for line in order.lines]}")
    
    for line in order.lines:
        # Проверяем тип более надежным способом
        if line.type and str(line.type).upper() in ["LINK", "URL_LINK"]:
            has_link_types = True
            logger.info(f"Найдена линия с типом {line.type}")
            break
    
    logger.info(f"has_link_types = {has_link_types}")
    
    # Выбираем чат в зависимости от наличия линий с типами LINK или URL_LINK
    chat_id = TELEGRAM_LINKS_CHAT_ID if has_link_types else TELEGRAM_CHAT_ID
    
    logger.info(f"Выбранный chat_id: {chat_id}")
    
    for i, line in enumerate(order.lines):
        star_emoji = "🌟" if i == 0 else "⭐️"
        message += (
            f"{star_emoji}{line.product_title} - {line.quantity} шт.\n"
            f"📨 mailbox: {line.mailbox}\n"
            f"💬 code: {line.code}\n"
        )
        
        # Добавляем тип линии в сообщение, если он есть
        if line.type:
            message += f"🔗 type: {line.type}\n"

    message += (
        f"💳На сумму - {order.total_incl_tax}₽\n"
        f"👤Client ID: {order.client_id}"
    )

    try:
        bot = Bot(token=TELEGRAM_TOKEN)
        await bot.send_message(
            chat_id=chat_id,
            text=message
        )
        
        chat_type = "LINKS" if has_link_types else "основной"
        logger.info(f"Заказ #{order.number} успешно отправлен в {chat_type} Telegram чат (ID: {chat_id})")
    except Exception as e:
        error_msg = f"Ошибка при отправке заказа #{order.number} в Telegram: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/order/notify")
async def notify_order(order: OrderModel):
    """Endpoint для отправки уведомления о заказе"""
    try:
        logger.info(f"Получен запрос на отправку уведомления о заказе #{order.number}")
        await send_order_to_telegram(order)
        return {"status": "success", "message": f"Заказ #{order.number} успешно отправлен"}
    except Exception as e:
        logger.error(f"Ошибка при обработке заказа: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Endpoint для проверки работоспособности сервиса"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)