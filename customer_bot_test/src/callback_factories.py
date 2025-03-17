from aiogram.filters.callback_data import CallbackData


class RequestLoginCodeCf(CallbackData, prefix="mgr_req_code"):
    line_id: int
    email: str
