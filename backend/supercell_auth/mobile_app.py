# import json
# import logging
# from typing import Any
# import enum

# import requests

# logger = logging.getLogger(__name__)


# class ApiException(Exception):
#     pass


# class Games(enum.Enum):
#     CLASH_ROYALE = "scroll"
#     CLASH_OF_CLANS = "magic"
#     HAY_DAY = "soil"
#     BOOM_BEACH = "reef"
#     BRAWL_STARS = "laser"


# class GameClient:
#     def __init__(self, game: Games, version: str, os: str, language: str):
#         self.__game = game
#         self.__version = version
#         self.__os = os
#         self.__language = language

#     def get_game(self) -> Games:
#         return self.__game

#     def get_version(self) -> str:
#         return self.__version

#     def get_os(self) -> str:
#         return self.__os

#     def get_language(self) -> str:
#         return self.__language


# class BaseClient:
#     __BASE_URL = "https://id.supercell.com/api"

#     def __init__(
#         self,
#         game_client: GameClient,
#     ):
#         self.__game_client = game_client

#     def __handle_response(self, req: requests.Response) -> dict[str, Any]:
#         try:
#             content = req.json()
#         except json.decoder.JSONDecodeError:
#             raise ApiException(req.text)

#         if not content.get("ok", False):
#             error = content.get("error")
#             raise ApiException(error)

#         return content.get("data")

#     @staticmethod
#     def __format_token(token: str) -> str:
#         if token != "":
#             token = f"Bearer {token}"

#         return token

#     def _build_headers(self, token: str) -> dict[str, str]:
#         headers = {
#             "User-Agent": (
#                 f"scid/{self.__game_client.get_version()} "
#                 f"({self.__game_client.get_os()}; "
#                 f"{self.__game_client.get_game().value}-prod)"
#             ),
#             "Authorization": self.__format_token(token),
#         }

#         return headers

#     def post(
#         self, endpoint: str, data: dict[str, Any], token: str = ""
#     ) -> dict[str, Any]:
#         headers = self._build_headers(token)
#         res = requests.post(
#             f"{BaseClient.__BASE_URL}/{endpoint}", data=data, headers=headers
#         )

#         return self.__handle_response(res)


# class AuthClient:
#     def __init__(
#         self,
#         mail: str,
#         game_client: GameClient,
#     ):
#         self._request = BaseClient(game_client)
#         self.__game_client = game_client
#         self.__email = mail

#     def login(self) -> Any:
#         login_data = {
#             "lang": self.__game_client.get_language(),
#             "email": self.__email,
#             "remember": "true",
#             "game": self.__game_client.get_game().value,
#             "env": "prod",
#         }
#         return self._request.post("ingame/account/login", login_data)


# GAME_CLIENTS = {
#     "clash_of_clans": GameClient(Games.CLASH_OF_CLANS, "16.137.13", "android", "en"),
#     "clash_royale": GameClient(Games.CLASH_ROYALE, "6.256.8", "android", "en"),
#     "hay_day": GameClient(Games.HAY_DAY, "1.61.264", "android", "en"),
#     "brawl_stars": GameClient(Games.BRAWL_STARS, "54.298", "android", "en"),
# }


# def request_code_from_mobile(email: str, game_name: str) -> bool:
#     success = False
#     try:
#         if game_name in GAME_CLIENTS:
#             AuthClient(email, GAME_CLIENTS[game_name]).login()
#             success = True
#         else:
#             logger.warning(f"Game {game_name} not found in GAME_CLIENTS")
#     except Exception as err:
#         logger.warning(err)

#     return success


import base64
import hmac
import json
import logging
import subprocess
import time
from typing import Any
from urllib.parse import urlencode

logger = logging.getLogger(__name__)


def shuffle(base: bytes, seed: int) -> bytes:
    size = len(base)
    numbers = list(range(size))
    x = seed
    for i in range(size):
        j = (size - 1) - i
        x = (0x19660D * x + 0x3C6EF35F) & 0xFFFFFFFF
        k = x % (j + 1)
        numbers[j], numbers[k] = numbers[k], numbers[j]
    offsets = [0] * size
    for i in range(size):
        offsets[numbers[i]] = i
    result = [0] * size
    for i in range(size):
        result[i] = base[offsets[i]]
    return bytes(result)


class ApiException(Exception):
    pass


class BaseClient:
    __BASE_URL = "https://id.supercell.com"
    __SIGNING_KEY = shuffle(
        bytes.fromhex("4d5875b5afc4aee2cffa68dfe5788d730e602e1cb6061ff3c3cb5ba37bd4bf58"),
        42
    )

    def __init__(self):
        self.version = "1.5.8-f"
        self.game_version = "59.197"

    def __handle_response(self, response: bytes) -> dict[str, Any]:
        try:
            content = json.loads(response)
        except json.JSONDecodeError:
            raise ApiException(response.decode('utf-8'))

        if not content.get("ok", False):
            error = content.get("error")
            raise ApiException(error)

        return content.get("data")

    def _build_headers(self, body: str) -> dict[str, str]:
        headers = {
            "User-Agent": f"scid/{self.version} (iPadOS 18.1; laser-prod; iPad8,6) com.supercell.laser/{self.game_version}",
            "Accept-Language": "en",
            "Accept-Encoding": "gzip",
            "X-Supercell-Device-Id": "1E923809-1680-535C-80F0-EFEFEFEFEF38",
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            "Content-Length": str(len(body)),
            "Accept": "",
            "Connection": "",
        }

        timestamp = int(time.time())
        headers["X-Supercell-Request-Forgery-Protection"] = self.__sign_request(
            timestamp, "/api/ingame/account/login", "POST", body, headers
        )

        return headers

    def __sign_request(
        self, timestamp: int, path: str, method: str, body: str, headers: dict[str, str]
    ) -> str:
        headers_to_sign = ["Authorization", "User-Agent", "X-Supercell-Device-Id"]
        headers_str = ""
        headers_value_str = ""
        
        for header in headers_to_sign:
            if header in headers and headers[header]:
                header_lower = header.lower()
                if headers_str:
                    headers_str += ";"
                headers_str += header_lower
                headers_value_str += f"{header_lower}={headers[header]}"

        to_sign = f"{timestamp}{method}{path}{body}{headers_value_str}"

        signature = hmac.digest(
            self.__SIGNING_KEY, to_sign.encode("utf-8"), "sha256"
        )
        signature_b64 = (
            base64.b64encode(signature)
            .decode("utf-8")
            .replace("+", "-")
            .replace("/", "_")
            .replace("=", "")
        )

        return f"RFPv1 Timestamp={timestamp},SignedHeaders={headers_str},Signature={signature_b64}"

    def post(self, endpoint: str, data: dict[str, Any]) -> dict[str, Any]:
        body = urlencode(data)
        headers = self._build_headers(body)
        
        curl_cmd = ["curl", "-s", "-X", "POST", f"{self.__BASE_URL}{endpoint}"]
        
        for key, value in headers.items():
            curl_cmd.extend(["-H", f"{key}: {value}"])
            
        curl_cmd.extend(["--data", body])
        
        result = subprocess.run(curl_cmd, capture_output=True)
        return self.__handle_response(result.stdout)


class AuthClient:
    def __init__(self, mail: str):
        self._request = BaseClient()
        self.__email = mail

    def login(self) -> Any:
        login_data = {
            "lang": "en",
            "email": self.__email,
            "remember": "true",
            "game": "laser",  # Always using laser as it's tied to the key
            "env": "prod",
            "unified_flow": "LOGIN",
            "recaptchaToken": "FAILED_EXECUTION",
            "recaptchaSiteKey": "6Lf3ThsqAAAAABuxaWIkogybKxfxoKxtR-aq5g7l",
        }
        return self._request.post("/api/ingame/account/login", login_data)


def request_code_from_mobile(email: str, game_name: str) -> bool:
    """
    Request verification code for Supercell ID.
    Note: Always sends code through Brawl Stars (laser) regardless of game_name,
    as the verification key is tied to Brawl Stars.
    The received code will work for all Supercell games.
    """
    success = False
    try:
        AuthClient(email).login()
        success = True
    except Exception as err:
        logger.warning(f"Failed to request code: {err}")

    return success