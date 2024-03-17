import httpx

from customer_api.exceptions import CustomerAPIError


class HTTPRequestMaker:
    @staticmethod
    async def post(url: str, json: dict | list | None = None):
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=json, timeout=10.0)
            if 200 <= response.status_code < 300:
                return response.json()
            raise CustomerAPIError(
                f"Invalid response: {response.status_code}, {response.text}"
            )

    @staticmethod
    async def get(url: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if 200 <= response.status_code < 300:
                return response.json()
            raise CustomerAPIError(
                f"Invalid response: {response.status_code}, {response.text}"
            )

    @staticmethod
    async def patch(url: str, json: dict | list):
        async with httpx.AsyncClient() as client:
            response = await client.patch(url, json=json, timeout=10.0)
            if 200 <= response.status_code < 300:
                return response.json()
            raise CustomerAPIError(
                f"Invalid response: {response.status_code}, {response.text}"
            )
