from django.contrib.auth.models import AbstractUser
from django.db import models
from oscar.core.loading import get_model

Order = get_model("order", "Order")

class ScheduledMailing(models.Model):
    message = models.TextField()
    image = models.ImageField(upload_to='mailings/', null=True, blank=True)
    scheduled_time = models.DateTimeField()
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-scheduled_time']

class Role(models.Model):
    ADMIN = 'ADMIN'
    ORDER_MANAGER = 'ORDER_MANAGER' 
    PRODUCT_MANAGER = 'PRODUCT_MANAGER'

    ROLE_CHOICES = [
        (ADMIN, 'Администратор'),
        (ORDER_MANAGER, 'Менеджер заказов'),
        (PRODUCT_MANAGER, 'Менеджер товаров')
    ]

    name = models.CharField(max_length=20, choices=ROLE_CHOICES)

    class Meta:
        verbose_name = 'Роль'
        verbose_name_plural = 'Роли'

class User(AbstractUser):
    telegram_chat_id = models.BigIntegerField(null=True, blank=True, unique=True)
    roles = models.ManyToManyField(Role, related_name='users')

    receiver_name = models.CharField(
        max_length=50, verbose_name="Имя получателя", blank=True, null=True
    )
    receiver_phone = models.CharField(
        max_length=16, verbose_name="Телефон получателя", blank=True, null=True
    )
    delivery_country = models.CharField(
        max_length=30, verbose_name="Страна доставки", blank=True, null=True
    )
    delivery_city = models.CharField(
        max_length=50, verbose_name="Город доставки", blank=True, null=True
    )
    delivery_address = models.CharField(
        max_length=255, verbose_name="Адрес доставки", blank=True, null=True
    )
    delivery_district = models.CharField(
        max_length=100, verbose_name="ЖК", blank=True, null=True
    )
    delivery_notes = models.CharField(
        max_length=255, verbose_name="Комментарий к доставке", blank=True, null=True
    )
    brawl_stars_email = models.EmailField(null=True)
    clash_of_clans_email = models.EmailField(null=True)
    clash_royale_email = models.EmailField(null=True)
    hay_day_email = models.EmailField(null=True)
    referral_code = models.CharField(max_length=16, unique=True, null=True, blank=True)
    
    # Ссылка на пользователя, пригласившего текущего
    referred_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='referrals'
    )
    
    def get_referral_link(self):
        """Сформировать реферальную ссылку для пользователя"""
        from django.conf import settings
        if not self.referral_code:
            self.referral_code = self.generate_unique_code()
            self.save(update_fields=['referral_code'])
        
        bot_username = getattr(settings, 'TELEGRAM_BOT_USERNAME', settings.BOT_TOKEN.split(':')[0])
        return f"https://t.me/{bot_username}?start={self.referral_code}"
    
    @staticmethod
    def generate_unique_code(length=8):
        """Генерирует уникальный реферальный код"""
        import string
        import random
        chars = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(random.choice(chars) for _ in range(length))
            if not User.objects.filter(referral_code=code).exists():
                return code

class DavDamer(models.Model):
    name = models.CharField(max_length=128, db_index=True)
    user = models.OneToOneField(User, on_delete=models.PROTECT, related_name="davdamer")
    image = models.ImageField(upload_to="images/avatars", null=True, blank=True)
    registered_dt = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "ДавДамер"
        verbose_name_plural = "ДавДамеры"


class City(models.Model):
    name = models.CharField(max_length=128, db_index=True, unique=True)

    def __str__(self):
        return self.name


class EmailCodeRequest(models.Model):
    email = models.EmailField()
    is_successful = models.BooleanField(default=None, null=True)
    game = models.CharField(max_length=50, null=True)

    created_dt = models.DateTimeField(auto_now_add=True)
    updated_dt = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Запрос кода"
        verbose_name_plural = "Запросы кода"


class OrderLoginData(models.Model):
    order_line = models.ForeignKey(
        "order.Line", on_delete=models.CASCADE, related_name="login_data", null=True
    )
    account_id = models.CharField(max_length=255, verbose_name="ID аккаунта", null=True)
    code = models.CharField(
        max_length=15, verbose_name="Код для входа", null=True, blank=True
    )

    email_changed = models.BooleanField(default=False, verbose_name="Почта изменена")
    code_changed = models.BooleanField(default=False, verbose_name="Код изменен")
    created_dt = models.DateTimeField(auto_now_add=True)


    class Meta:
        verbose_name = "Данные для входа"
        verbose_name_plural = "Данные для входа"
        ordering = ["-created_dt"]

class OrderReview(models.Model):
    order = models.ForeignKey(
        "order.Order", on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.PositiveSmallIntegerField(
        verbose_name="Оценка", choices=[(i, str(i)) for i in range(1, 6)]
    )
    comment = models.TextField(verbose_name="Комментарий", blank=True)
    created_dt = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Отзыв к заказу"
        verbose_name_plural = "Отзывы к заказам"
        ordering = ["-created_dt"]
