# import logging
# import os
# import urllib

# from .exceptions import CustomerAPIError
# from .http_client import HTTPRequestMaker

# logger = logging.getLogger(__name__)


# class CustomerAPIClient:
#     http = HTTPRequestMaker()
#     api_host = os.getenv("API_HOST", "http://localhost:8000")

#     def check_api_host(self):
#         try:
#             url = f"{self.api_host}/private_api/ping/"
#             urllib.request.urlopen(url)
#         except Exception:
#             raise CustomerAPIError("API host %s is not available", self.api_host)

#     async def save_new_login_code(self, line_id: int, code: str) -> bool:
#         url = f"{self.api_host}/private_api/customer_bot/login_data/"
#         try:
#             data = {"line_id": line_id, "code": code}
#             response = await self.http.post(url, data)
#             return response.get("status", False)
#         except Exception as err:
#             logger.exception(err)
#             return False
import logging
import os
import urllib

from .exceptions import CustomerAPIError
from .http_client import HTTPRequestMaker

logger = logging.getLogger(__name__)


class CustomerAPIClient:
    http = HTTPRequestMaker()
    api_host = os.getenv("API_HOST", "http://localhost:8000")
    
    # Префикс для API
    api_prefix = "/private_api"

    def check_api_host(self):
        try:
            url = f"{self.api_host}/ping/"
            urllib.request.urlopen(url)
        except Exception:
            raise CustomerAPIError("API host %s is not available", self.api_host)

    async def save_new_login_code(self, line_id: int, code: str) -> bool:
        url = f"{self.api_host}{self.api_prefix}/customer_bot/login_data/"
        try:
            data = {"line_id": line_id, "code": code}
            response = await self.http.post(url, data)
            return response.get("status", False)
        except Exception as err:
            logger.exception(err)
            return False
            
    async def apply_referral_code(self, user_id: int, referral_code: str) -> dict:
        """Применяет реферальный код для пользователя"""
        url = f"{self.api_host}{self.api_prefix}/customer_bot/process_referral/"
        try:
            data = {"telegram_id": user_id, "referral_code": referral_code}
            logger.info(f"Отправка запроса на {url} с данными: {data}")
            
            response = await self.http.post(url, data)
            logger.info(f"Получен ответ: {response}")
            
            # Проверяем ответ
            if not isinstance(response, dict):
                logger.warning(f"Неверный формат ответа: {response}")
                return {"status": False, "message": "Неверный формат ответа"}
                
            status = response.get("status", False)
            message = response.get("message", "")
            
            return {"status": status, "message": message}
        except Exception as err:
            logger.exception(err)
            return {"status": False, "message": f"Ошибка при применении реферального кода: {str(err)}"}