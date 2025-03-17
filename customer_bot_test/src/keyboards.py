from aiogram import types

CANCEL_CODE_CB = "CANCEL_CODE"

CANCEL_INPUT_LOGIN_CODE_KB = types.InlineKeyboardMarkup(
    inline_keyboard=[
        [types.InlineKeyboardButton(text="Отмена", callback_data=CANCEL_CODE_CB)]
    ]
)
