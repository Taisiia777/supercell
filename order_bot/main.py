# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# import asyncio
# from telegram import Bot
# import os
# from datetime import datetime
# import logging
# from typing import Optional, List

# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger(__name__)

# # Инициализация FastAPI
# app = FastAPI()


# # Модели данных
# class OrderLineModel(BaseModel):
#     product_id: int
#     quantity: int
#     price_incl_tax: float
#     product_title: str
    
# class OrderModel(BaseModel):
#     order_id: int
#     number: str
#     user_name: Optional[str]
#     phone: Optional[str]
#     lines: List[OrderLineModel]
#     total_incl_tax: float
#     shipping_address: Optional[str]
#     seller_name: Optional[str]
#     status: str
#     date_placed: datetime

# # Загрузка конфигурации
# TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
# TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

# if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
#     raise ValueError("Необходимо указать TELEGRAM_TOKEN и TELEGRAM_CHAT_ID в переменных окружения")

# async def send_order_to_telegram(order: OrderModel):
#     """Отправка заказа в Telegram чат"""
#     message = (
#         f"🆕 Новый заказ #{order.number}\n\n"
#         f"👤 Клиент: {order.user_name or 'Анонимный пользователь'}\n"
#         f"📞 Телефон: {order.phone or 'Не указан'}\n\n"
#         f"📦 Заказ:\n"
#     )

#     for line in order.lines:
#         message += (
#             f"- {line.product_title} x{line.quantity} - "
#             f"{line.price_incl_tax}₽\n"
#         )

#     message += (
#         f"\n💰 Итого: {order.total_incl_tax}₽\n"
#         f"📍 Адрес доставки: {order.shipping_address or 'Не указан'}\n"
#         f"🏪 Продавец: {order.seller_name or 'Не указан'}\n"
#         f"📋 Статус: {order.status}\n"
#         f"\n⏰ Время заказа: {order.date_placed.strftime('%Y-%m-%d %H:%M:%S')}."
#     )

#     try:
#         bot = Bot(token=TELEGRAM_TOKEN)
#         # Исправление: правильно вызываем send_message
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
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
from telegram import Bot
import os
import logging
from typing import List

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

class OrderModel(BaseModel):
    number: str
    lines: List[OrderLineModel]
    total_incl_tax: float
    client_id: str

# Загрузка конфигурации
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
    raise ValueError("Необходимо указать TELEGRAM_TOKEN и TELEGRAM_CHAT_ID в переменных окружения")

async def send_order_to_telegram(order: OrderModel):
    """Отправка заказа в Telegram чат"""
    message = f"🎯New order: №{order.number}\n"

    for i, line in enumerate(order.lines):
        star_emoji = "🌟" if i == 0 else "⭐️"
        message += (
            f"{star_emoji}{line.product_title} - {line.quantity} шт.\n"
            f"📨 mailbox: {line.mailbox}\n"
            f"💬 code: {line.code}\n"
        )

    message += (
        f"💳На сумму - {order.total_incl_tax}₽\n"
        f"👤Client ID: {order.client_id}"
    )

    try:
        bot = Bot(token=TELEGRAM_TOKEN)
        await bot.send_message(
            chat_id=TELEGRAM_CHAT_ID,
            text=message
        )
        logger.info(f"Заказ #{order.number} успешно отправлен в Telegram")
    except Exception as e:
        error_msg = f"Ошибка при отправке заказа #{order.number} в Telegram: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/order/notify")
async def notify_order(order: OrderModel):
    """Endpoint для отправки уведомления о заказе"""
    try:
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