from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from django.conf import settings
from aiogram.utils.web_app import safe_parse_webapp_init_data

User = get_user_model()


class WebAppAuthentication(BaseAuthentication):
    header_name = "HTTP_AUTHORIZATION"

    def parse_token(self, request) -> str:
        header = request.META.get(self.header_name)
        if not header:
            raise ValueError("No token provided")
        auth_info = header.split()
        if len(auth_info) != 2 and auth_info[0] != "Bearer":
            raise ValueError("Invalid token format")
        return auth_info[1]

    def authenticate(self, request):
        try:
            token = self.parse_token(request)
            user_data = safe_parse_webapp_init_data(settings.BOT_TOKEN, token)
            telegram_chat_id = user_data.user.id
            user = User.objects.get(
                telegram_chat_id=telegram_chat_id, telegram_chat_id__isnull=False
            )
            return user, None
        except (ValueError, User.DoesNotExist):
            return None
