from aiogram import Router, types
from aiogram.filters import Command, CommandObject
import logging

from customer_api.client import CustomerAPIClient

logger = logging.getLogger(__name__)
router = Router()
api_client = CustomerAPIClient()


@router.message(Command("start"))
async def handle_start_command(message: types.Message, command: CommandObject):
    """
    Обрабатывает команду /start с возможным реферальным кодом
    """
    # Получаем реферальный код из аргументов команды
    if not command.args:
        # Если нет аргументов, просто пропускаем - будет вызван обычный обработчик /start
        return
    
    referral_code = command.args
    
    # Получаем данные пользователя
    user_id = message.from_user.id
    username = message.from_user.username or ""
    full_name = message.from_user.full_name or ""
    
    logger.info(f"Получен реферальный код: {referral_code} от пользователя {user_id}")
    
    # Обрабатываем реферальный код через API
    result = await api_client.process_referral(
        telegram_id=user_id,
        username=username,
        full_name=full_name,
        referral_code=referral_code
    )
    
    if result:
        # Если реферал успешно обработан, отправляем уведомление
        await message.reply("Вы успешно зарегистрировались по реферальной ссылке!")
        
        # Регистрируем пользователя
        await api_client.register_user(
            telegram_id=user_id,
            username=username,
            full_name=full_name
        )


@router.message(Command("referral"))
async def get_referral_command(message: types.Message):
    """Получить собственную реферальную ссылку"""
    user_id = message.from_user.id
    
    # Запрашиваем реферальную ссылку с бэкенда
    referral_link = await api_client.get_referral_link(user_id)
    
    if referral_link:
        await message.answer(
            f"Ваша реферальная ссылка: {referral_link}\n\n"
            f"Поделитесь ей с друзьями и получите бонусы!"
        )
    else:
        await message.answer("Не удалось получить вашу реферальную ссылку. Пожалуйста, попробуйте позже.")