# from aiogram import types

# CANCEL_CODE_CB = "CANCEL_CODE"

# CANCEL_INPUT_LOGIN_CODE_KB = types.InlineKeyboardMarkup(
#     inline_keyboard=[
#         [types.InlineKeyboardButton(text="Отмена", callback_data=CANCEL_CODE_CB)]
#     ]
# )
from aiogram import types

CANCEL_CODE_CB = "CANCEL_CODE"

CANCEL_INPUT_LOGIN_CODE_KB = types.InlineKeyboardMarkup(
    inline_keyboard=[
        [types.InlineKeyboardButton(text="Отмена", callback_data=CANCEL_CODE_CB)]
    ]
)

# Добавляем клавиатуру с кнопкой для получения реферальной ссылки
MAIN_MENU_KB = types.ReplyKeyboardMarkup(
    keyboard=[
        [
            types.KeyboardButton(text="🛒 Магазин"),
            types.KeyboardButton(text="👥 Реферальная программа")
        ],
        [
            types.KeyboardButton(text="❓ Помощь"),
            types.KeyboardButton(text="📱 Мой профиль")
        ]
    ],
    resize_keyboard=True,
    input_field_placeholder="Выберите действие"
)