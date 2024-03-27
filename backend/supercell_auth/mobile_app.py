import json
import logging
from typing import Any
import enum

import requests

logger = logging.getLogger(__name__)


class ApiException(Exception):
    pass


class Games(enum.Enum):
    CLASH_ROYALE = "scroll"
    CLASH_OF_CLANS = "magic"
    HAY_DAY = "soil"
    BOOM_BEACH = "reef"
    BRAWL_STARS = "laser"


class GameClient:
    def __init__(self, game: Games, version: str, os: str, language: str):
        self.__game = game
        self.__version = version
        self.__os = os
        self.__language = language

    def get_game(self) -> Games:
        return self.__game

    def get_version(self) -> str:
        return self.__version

    def get_os(self) -> str:
        return self.__os

    def get_language(self) -> str:
        return self.__language


class BaseClient:
    __BASE_URL = "https://id.supercell.com/api"

    def __init__(
        self,
        game_client: GameClient,
    ):
        self.__game_client = game_client

    def __handle_response(self, req: requests.Response) -> dict[str, Any]:
        try:
            content = req.json()
        except json.decoder.JSONDecodeError:
            raise ApiException(req.text)

        if not content.get("ok", False):
            error = content.get("error")
            raise ApiException(error)

        return content.get("data")

    @staticmethod
    def __format_token(token: str) -> str:
        if token != "":
            token = f"Bearer {token}"

        return token

    def _build_headers(self, token: str) -> dict[str, str]:
        headers = {
            "User-Agent": (
                f"scid/{self.__game_client.get_version()} "
                f"({self.__game_client.get_os()}; "
                f"{self.__game_client.get_game().value}-prod)"
            ),
            "Authorization": self.__format_token(token),
        }

        return headers

    def post(
        self, endpoint: str, data: dict[str, Any], token: str = ""
    ) -> dict[str, Any]:
        headers = self._build_headers(token)
        res = requests.post(
            f"{BaseClient.__BASE_URL}/{endpoint}", data=data, headers=headers
        )

        return self.__handle_response(res)


class AuthClient:
    def __init__(
        self,
        mail: str,
        game_client: GameClient,
    ):
        self._request = BaseClient(game_client)
        self.__game_client = game_client
        self.__email = mail

    def login(self) -> Any:
        login_data = {
            "lang": self.__game_client.get_language(),
            "email": self.__email,
            "remember": "true",
            "game": self.__game_client.get_game().value,
            "env": "prod",
        }
        return self._request.post("ingame/account/login", login_data)


GAME_CLIENTS = {
    "clash_of_clans": GameClient(Games.CLASH_OF_CLANS, "16.137.13", "android", "en"),
    "clash_royale": GameClient(Games.CLASH_ROYALE, "6.256.8", "android", "en"),
    "hay_day": GameClient(Games.HAY_DAY, "1.61.264", "android", "en"),
    "brawl_stars": GameClient(Games.BRAWL_STARS, "54.298", "android", "en"),
}


def request_code_from_mobile(email: str, game_name: str) -> bool:
    success = False
    try:
        if game_name in GAME_CLIENTS:
            AuthClient(email, GAME_CLIENTS[game_name]).login()
            success = True
        else:
            logger.warning(f"Game {game_name} not found in GAME_CLIENTS")
    except Exception as err:
        logger.warning(err)

    return success
