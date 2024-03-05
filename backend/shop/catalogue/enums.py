from django.db import models


class LoginType(models.TextChoices):
    NEED_LOGIN = "NEED_LOGIN", "требуется вход"
    WITHOUT_LOGIN = "WITHOUT_LOGIN", "без входа"
