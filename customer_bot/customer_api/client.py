import logging
import os
import urllib

from .exceptions import CustomerAPIError
from .http_client import HTTPRequestMaker

logger = logging.getLogger(__name__)


class SellerAPIClient:
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
