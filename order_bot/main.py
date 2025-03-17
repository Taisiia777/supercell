
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