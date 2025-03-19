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

    def check_api_host(self):
        try:
            url = f"{self.api_host}/private_api/ping/"
            urllib.request.urlopen(url)
        except Exception:
            raise CustomerAPIError("API host %s is not available", self.api_host)

    async def save_new_login_code(self, line_id: int, code: str) -> bool:
        url = f"{self.api_host}/private_api/customer_bot/login_data/"
        try:
            data = {"line_id": line_id, "code": code}
            response = await self.http.post(url, data)
            return response.get("status", False)
        except Exception as err:
            logger.exception(err)
            return False
            
    async def get_referral_link(self, user_id: int) -> dict:
        """Получает реферальную ссылку пользователя"""
        url = f"{self.api_host}/private_api/customer_bot/referral_link/{user_id}/"
        try:
            response = await self.http.get(url)
            return response
        except Exception as err:
            logger.exception(err)
            return {"status": False, "link": None}
            
    async def apply_referral_code(self, user_id: int, referral_code: str) -> dict:
        """Применяет реферальный код для пользователя"""
        url = f"{self.api_host}/private_api/customer_bot/apply_referral/"
        try:
            data = {"user_id": user_id, "referral_code": referral_code}
            response = await self.http.post(url, data)
            return response
        except Exception as err:
            logger.exception(err)
            return {"status": False, "message": "Ошибка при применении реферального кода"}
            
    async def get_referral_stats(self, user_id: int) -> dict:
        """Получает статистику по рефералам пользователя"""
        url = f"{self.api_host}/private_api/customer_bot/referral_stats/{user_id}/"
        try:
            response = await self.http.get(url)
            return response
        except Exception as err:
            logger.exception(err)
            return {"status": False, "referrals_count": 0, "message": "Ошибка при получении статистики"}