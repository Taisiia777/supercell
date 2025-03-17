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
            
    async def process_referral(self, telegram_id: int, username: str, full_name: str, referral_code: str) -> bool:
        """Обрабатывает реферальный код"""
        url = f"{self.api_host}/private_api/customer_bot/process_referral/"
        try:
            data = {
                "telegram_id": telegram_id,
                "username": username,
                "full_name": full_name,
                "referral_code": referral_code
            }
            response = await self.http.post(url, data)
            return response.get("status", False)
        except Exception as err:
            logger.exception(err)
            return False
    
    async def register_user(self, telegram_id: int, username: str, full_name: str) -> bool:
        """Регистрирует нового пользователя"""
        url = f"{self.api_host}/private_api/customer_bot/register_user/"
        try:
            data = {
                "telegram_id": telegram_id,
                "username": username,
                "full_name": full_name
            }
            response = await self.http.post(url, data)
            return response.get("status", False)
        except Exception as err:
            logger.exception(err)
            return False
    
    async def get_referral_link(self, telegram_id: int) -> str:
        """Получает реферальную ссылку пользователя"""
        url = f"{self.api_host}/private_api/customer_bot/get_referral_link/?telegram_id={telegram_id}"
        try:
            response = await self.http.get(url)
            return response.get("referral_link")
        except Exception as err:
            logger.exception(err)
            return None