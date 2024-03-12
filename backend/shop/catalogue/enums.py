from django.db import models


class LoginType(models.TextChoices):
    EMAIL_CODE = "EMAIL_CODE", "требуется вход"
    LINK = "LINK", "без входа"
