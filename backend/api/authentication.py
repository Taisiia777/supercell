import logging
from typing import Union, List

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from rest_framework.authentication import BaseAuthentication
from django.conf import settings
from aiogram.utils.web_app import safe_parse_webapp_init_data, WebAppInitData
from drf_spectacular.extensions import OpenApiAuthenticationExtension

logger = logging.getLogger(__name__)
User: AbstractUser = get_user_model()


class WebAppAuthentication(BaseAuthentication):
    header_name = "HTTP_AUTHORIZATION"

    def parse_token(self, request) -> str:
        header = request.META.get(self.header_name)
        if not header:
            raise ValueError("No token provided")
        auth_info = header.split()
        if len(auth_info) != 2 or auth_info[0] != "Bearer":
            raise ValueError("Invalid token format")
        return auth_info[1]

    @staticmethod
    def get_user(user_data: WebAppInitData) -> User:
        user, _ = User.objects.get_or_create(
            telegram_chat_id=user_data.user.id,
            defaults={
                "username": "TG:" + str(user_data.user.id),
                "first_name": user_data.user.first_name,
                "last_name": user_data.user.last_name or "",
            },
        )
        return user

    def authenticate(self, request):
        try:
            token = self.parse_token(request)
            logger.info(f"Token: {token}")
            user_data = safe_parse_webapp_init_data(settings.BOT_TOKEN, token)
            if user_data.user is None:
                raise ValueError("Token has no user data")

            user = self.get_user(user_data)
            return user, None
        except ValueError:
            # todo: remove this
            try:
                user = User.objects.get(pk=2)
                return user, None
            except Exception:
                return None

            return None
        except Exception as err:
            logger.exception(err)
            return None


class OpenApiWebAppAuthentication(OpenApiAuthenticationExtension):
    target_class = WebAppAuthentication
    name = "WebAppAuthentication"

    def get_security_definition(self, auto_schema) -> Union[dict, List[dict]]:
        return {
            "type": "http",
            "scheme": "bearer",
        }
