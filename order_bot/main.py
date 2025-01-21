from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
from telegram import Bot
import os
from datetime import datetime
import logging
from typing import Optional, List

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Инициализация FastAPI
app = FastAPI()

# Модели данных
class OrderLineModel(BaseModel):
    product_id: int
    quantity: int
    price_incl_tax: float
    product_title: str
    
class OrderModel(BaseModel):
    order_id: int
    number: str
    user_name: Optional[str]
    phone: Optional[str]
    lines: List[OrderLineModel]
    total_incl_tax: float
    shipping_address: Optional[str]
    seller_name: Optional[str]
    status: str
    date_placed: datetime

# Загрузка конфигурации
TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
    raise ValueError("Необходимо указать TELEGRAM_TOKEN и TELEGRAM_CHAT_ID в переменных окружения")

bot = Bot(token=TELEGRAM_TOKEN)

async def send_order_to_telegram(order: OrderModel):
    """Отправка заказа в Telegram чат"""
    
    message = (
        f"🆕 Новый заказ #{order.number}\n\n"
        f"👤 Клиент: {order.user_name or 'Анонимный пользователь'}\n"
        f"📞 Телефон: {order.phone or 'Не указан'}\n\n"
        f"📦 Заказ:\n"
    )
    
    # Добавляем информацию о товарах
    for line in order.lines:
        message += (
            f"- {line.product_title} x{line.quantity} - "
            f"{line.price_incl_tax}₽\n"
        )
    
    message += (
        f"\n💰 Итого: {order.total_incl_tax}₽\n"
        f"📍 Адрес доставки: {order.shipping_address or 'Не указан'}\n"
        f"🏪 Продавец: {order.seller_name or 'Не указан'}\n"
        f"📋 Статус: {order.status}\n"
        f"\n⏰ Время заказа: {order.date_placed.strftime('%Y-%m-%d %H:%M:%S')}"
    )
    
    try:
        await bot.send_message(
            chat_id=TELEGRAM_CHAT_ID,
            text=message,
            parse_mode='HTML'
        )
        logger.info(f"Заказ #{order.number} успешно отправлен в Telegram")
    except Exception as e:
        logger.error(f"Ошибка при отправке заказа #{order.number} в Telegram: {str(e)}")
        raise HTTPException(status_code=500, detail="Ошибка отправки в Telegram")

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