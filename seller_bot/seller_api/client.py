import logging
import os
import urllib

from .exceptions import SellerAPIError
from .http_client import HTTPRequestMaker
from . import schemas

logger = logging.getLogger(__name__)


class SellerAPIClient:
    http = HTTPRequestMaker()
    api_host = os.getenv("API_HOST", "http://localhost:8000")

    def check_api_host(self):
        try:
            url = f"{self.api_host}/private_api/ping/"
            urllib.request.urlopen(url)
        except Exception:
            raise SellerAPIError("API host %s is not available", self.api_host)

    async def get_processing_orders(self, chat_id) -> list[schemas.OrderSchema]:
        url = f"{self.api_host}/private_api/seller_bot/{chat_id}/processing_orders/"
        try:
            response = await self.http.get(url)
            return [schemas.OrderSchema(**order) for order in response]
        except Exception as err:
            logger.exception(err)
            return []
