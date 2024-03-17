from aiogram.fsm.state import StatesGroup, State


class BotState(StatesGroup):
    INPUT_LOGIN_CODE = State()
