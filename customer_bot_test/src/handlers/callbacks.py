# from aiogram import Router, types, F
# from aiogram.fsm.context import FSMContext

# from src.callback_factories import RequestLoginCodeCf
# from src.states import BotState
# from src import keyboards as kb

# router = Router()


# @router.callback_query(RequestLoginCodeCf.filter())
# async def input_login_code(
#     callback_query: types.CallbackQuery,
#     callback_data: RequestLoginCodeCf,
#     state: FSMContext,
# ):
#     await state.update_data(
#         line_id=callback_data.line_id, code_message_id=callback_query.message.message_id
#     )
#     text = f"Введите код для входа в аккаунт {callback_data.email}"
#     await callback_query.message.answer(text)
#     await state.set_state(BotState.INPUT_LOGIN_CODE)
#     await callback_query.answer()


# @router.callback_query(F.data == kb.CANCEL_CODE_CB)
# async def cancel_input_login_code(
#     callback_query: types.CallbackQuery, state: FSMContext
# ):
#     await state.update_data(line_id=None, code_message_id=None)
#     await state.set_state()
#     await callback_query.message.edit_reply_markup()
#     await callback_query.answer()
import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext

from src.callback_factories import RequestLoginCodeCf
from src.states import BotState
from src import keyboards as kb
from customer_api.client import CustomerAPIClient
from customer_api.exceptions import CustomerAPIError

router = Router()
api_client = CustomerAPIClient()
logger = logging.getLogger(__name__)


@router.callback_query(RequestLoginCodeCf.filter())
async def input_login_code(
    callback_query: types.CallbackQuery,
    callback_data: RequestLoginCodeCf,
    state: FSMContext,
):
    await state.update_data(
        line_id=callback_data.line_id, code_message_id=callback_query.message.message_id
    )
    text = f"Введите код для входа в аккаунт {callback_data.email}"
    await callback_query.message.answer(text)
    await state.set_state(BotState.INPUT_LOGIN_CODE)
    await callback_query.answer()


@router.callback_query(F.data == kb.CANCEL_CODE_CB)
async def cancel_input_login_code(
    callback_query: types.CallbackQuery, state: FSMContext
):
    await state.update_data(line_id=None, code_message_id=None)
    await state.set_state()
    await callback_query.message.edit_reply_markup()
    await callback_query.answer()


@router.callback_query(F.data == "ref_stats")
async def referral_stats_handler(callback_query: types.CallbackQuery):
    """Обработчик для получения статистики рефералов"""
    user_id = callback_query.from_user.id
    
    # Отправляем индикатор загрузки
    await callback_query.answer("Загружаем вашу статистику...")
    
    try:
        # Получаем статистику по рефералам
        result = await api_client.get_referral_stats(user_id)
        
        if result.get("status"):
            referrals_count = result.get("referrals_count", 0)
            bonus_points = result.get("bonus_points", 0)
            
            # Формируем сообщение со статистикой
            text = f"📊 <b>Статистика ваших рефералов</b>\n\n"
            
            if referrals_count > 0:
                text += f"👥 Приглашенных пользователей: <b>{referrals_count}</b>\n"
                text += f"🎁 Накоплено бонусных баллов: <b>{bonus_points}</b>\n\n"
                
                # Добавляем информацию о преимуществах
                if referrals_count >= 10:
                    text += "🔥 <b>Ваш статус:</b> Золотой партнер\n"
                    text += "💎 Вы получаете +10% к каждому бонусу!\n\n"
                elif referrals_count >= 5:
                    text += "🔥 <b>Ваш статус:</b> Серебряный партнер\n"
                    text += "💎 Вы получаете +5% к каждому бонусу!\n\n"
                
                text += result.get("additional_info", "")
            else:
                text += "У вас пока нет приглашенных пользователей.\n\n"
                text += "Отправьте свою реферальную ссылку друзьям и получайте бонусы за каждого приглашенного пользователя!"
            
            # Добавляем кнопку для обновления статистики и получения ссылки
            keyboard = types.InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        types.InlineKeyboardButton(
                            text="🔄 Обновить статистику", 
                            callback_data="ref_stats"
                        )
                    ],
                    [
                        types.InlineKeyboardButton(
                            text="🔗 Получить мою ссылку", 
                            callback_data="get_ref_link"
                        )
                    ]
                ]
            )
            
            # Обновляем сообщение
            await callback_query.message.edit_text(text, reply_markup=keyboard, parse_mode="HTML")
        else:
            # В случае ошибки не меняем сообщение, просто отправляем уведомление
            await callback_query.answer("Не удалось получить статистику рефералов", show_alert=True)
    except Exception as e:
        logger.exception(f"Ошибка при получении статистики рефералов: {str(e)}")
        await callback_query.answer("Произошла ошибка при получении статистики", show_alert=True)


@router.callback_query(F.data == "get_ref_link")
async def get_ref_link_callback(callback_query: types.CallbackQuery):
    """Обработчик для получения реферальной ссылки через callback"""
    # Получаем информацию о пользователе
    user_id = callback_query.from_user.id
    
    # Отправляем индикатор загрузки
    await callback_query.answer("Получаем вашу реферальную ссылку...")
    
    try:
        result = await api_client.get_referral_link(user_id)
        
        if result.get("status") and result.get("link"):
            # Формируем прямую ссылку для Telegram
            referral_link = result['link']
            
            # Создаем копируемый формат для удобства пользователя
            # Убедимся, что это точно ссылка на Telegram бота с параметром start
            if "t.me/" in referral_link and "?start=" in referral_link:
                bot_username = "Mamoshop_bot"  # Или извлекаем из ссылки
                referral_code = referral_link.split("?start=")[1]
                
                formatted_link = f"https://t.me/{bot_username}?start={referral_code}"
            else:
                formatted_link = referral_link
            
            # Создаем клавиатуру со статистикой
            keyboard = types.InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        types.InlineKeyboardButton(
                            text="📊 Моя статистика", 
                            callback_data="ref_stats"
                        )
                    ]
                ]
            )
            
            # Отправляем новое сообщение с ссылкой
            text = (
                f"🔗 <b>Ваша реферальная ссылка готова!</b>\n\n"
                f"<code>{formatted_link}</code>\n\n"
                f"<b>Как это работает:</b>\n"
                f"1️⃣ Отправьте эту ссылку друзьям\n"
                f"2️⃣ Когда друг перейдет по ссылке и совершит первую покупку, вы получите бонус\n"
                f"3️⃣ Чем больше друзей, тем больше бонусов!\n\n"
                f"Нажмите на кнопку ниже, чтобы посмотреть вашу статистику рефералов."
            )
            
            # Отправляем новое сообщение вместо редактирования старого
            await callback_query.message.answer(text, reply_markup=keyboard, parse_mode="HTML")
        else:
            await callback_query.answer("Не удалось получить вашу реферальную ссылку", show_alert=True)
    except Exception as e:
        logger.exception(f"Ошибка при получении реферальной ссылки: {str(e)}")
        await callback_query.answer("Произошла ошибка. Попробуйте позже", show_alert=True)


@router.callback_query(F.data == "ref_how_it_works")
async def ref_how_it_works_handler(callback_query: types.CallbackQuery):
    """Обработчик для получения подробной информации о реферальной программе"""
    how_it_works_text = (
        "<b>❓ Как работает реферальная программа</b>\n\n"
        "<b>Шаг 1:</b> Получите свою реферальную ссылку с помощью команды /ref\n\n"
        "<b>Шаг 2:</b> Отправьте эту ссылку друзьям через любой мессенджер, социальную сеть или email\n\n"
        "<b>Шаг 3:</b> Когда ваш друг перейдет по ссылке, он автоматически будет привязан к вашему аккаунту как реферал\n\n"
        "<b>Шаг 4:</b> После первой покупки вашего реферала вы получите бонусные баллы\n\n"
        "<b>Бонусы:</b>\n"
        "• За каждого реферала: <b>50 баллов</b>\n"
        "• За первую покупку реферала: <b>10% от суммы</b>\n"
        "• За последующие покупки: <b>5% от суммы</b>\n\n"
        "<b>Уровни партнерства:</b>\n"
        "• 5-9 рефералов: <b>Серебряный партнер</b> (+5% к бонусам)\n"
        "• 10-19 рефералов: <b>Золотой партнер</b> (+10% к бонусам)\n"
        "• 20+ рефералов: <b>VIP-партнер</b> (+15% к бонусам)\n\n"
        "Бонусные баллы можно использовать для оплаты до 30% стоимости покупок в нашем магазине."
    )
    
    # Создаем клавиатуру с кнопкой возврата
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="◀️ Назад", 
                    callback_data="ref_back_to_menu"
                )
            ],
            [
                types.InlineKeyboardButton(
                    text="🔗 Получить мою ссылку", 
                    callback_data="get_ref_link"
                )
            ]
        ]
    )
    
    await callback_query.message.edit_text(how_it_works_text, reply_markup=keyboard, parse_mode="HTML")


@router.callback_query(F.data == "ref_back_to_menu")
async def ref_back_to_menu_handler(callback_query: types.CallbackQuery):
    """Обработчик возврата в меню реферальной программы"""
    # Здесь мы должны показать основное меню реферальной программы
    # Импортируем функцию из messages.py
    from src.handlers.messages import referral_program_handler
    
    # Вызываем ее с сообщением из callback
    await referral_program_handler(callback_query.message)
    await callback_query.answer()