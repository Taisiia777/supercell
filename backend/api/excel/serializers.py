# from rest_framework import serializers
# from django.contrib.auth import get_user_model

# User = get_user_model()

# class UserExportSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = [
#             'telegram_chat_id',
#             'username',
#             'first_name',
#             'last_name',
#             'email',
#             'receiver_name',
#             'receiver_phone',
#             'delivery_country',
#             'delivery_city',
#             'delivery_address',
#             'delivery_district',
#             'delivery_notes',
#             'brawl_stars_email',
#             'clash_of_clans_email',
#             'clash_royale_email',
#             'hay_day_email'
#         ]

#     def to_representation(self, instance):
#         # Получаем базовое представление
#         data = super().to_representation(instance)
#         # Заменяем None на пустые строки для Excel
#         return {k: '' if v is None else v for k, v in data.items()}


# class ImportRequestSerializer(serializers.Serializer):
#     file = serializers.FileField(
#         allow_empty_file=False,
#         help_text="Excel file with user data"
#     )


# class ImportResponseSerializer(serializers.Serializer):
#     processed = serializers.IntegerField()
#     errors = serializers.ListField(child=serializers.CharField())
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserExportSerializer(serializers.ModelSerializer):
    userid = serializers.IntegerField(source='telegram_chat_id')
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'userid']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {k: '' if v is None else v for k, v in data.items()}


class ImportRequestSerializer(serializers.Serializer):
    file = serializers.FileField(
        allow_empty_file=False,
        help_text="Excel файл со списком пользователей (first_name, last_name, userid)"
    )


class ImportResponseSerializer(serializers.Serializer):
    processed = serializers.IntegerField()
    errors = serializers.ListField(child=serializers.CharField())