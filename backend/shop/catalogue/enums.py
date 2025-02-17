from django.db import models


# class LoginType(models.TextChoices):
#     EMAIL_CODE = "EMAIL_CODE", "требуется вход"
#     LINK = "LINK", "без входа"
class LoginType(models.TextChoices):
    EMAIL_CODE = "EMAIL_CODE", "требуется вход"
    LINK = "LINK", "без входа"
    URL_EMAIL = "URL_EMAIL", "вход + ссылка в друзья"
    

class FiltersType(models.TextChoices):
    NEW_ACCOUNT = "NEW_ACCOUNT", "Новый аккаунт"
    PROMO = "PROMO", "Акции" 
    GEMS = "GEMS", "Гемы"
    PASS = "PASS", "Пропуски"

class GameType(models.TextChoices):
    BRAWL_STARS = "brawl_stars", "Brawl Stars"
    CLASH_OF_CLANS = "clash_of_clans", "Clash of Clans"
    CLASH_ROYALE = "clash_royale", "Clash Royale"
    HAY_DAY = "hay_day", "Hay Day"
