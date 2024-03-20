from django.db import models


class LoginType(models.TextChoices):
    EMAIL_CODE = "EMAIL_CODE", "требуется вход"
    LINK = "LINK", "без входа"


class GameType(models.TextChoices):
    BRAWL_STARS = "brawl_stars", "Brawl Stars"
    CLASH_OF_CLANS = "clash_of_clans", "Clash of Clans"
    CLASH_ROYALE = "clash_royale", "Clash Royale"
    STUMBLE_GUYS = "stumble_guys", "Stumble Guys"
