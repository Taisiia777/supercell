from rest_framework import serializers


class MassMailingSerializer(serializers.Serializer):
    """Сериализатор для массовой рассылки сообщений"""
    message = serializers.CharField(
        required=True,
        help_text="Текст сообщения для рассылки"
    )
    image = serializers.ImageField(
        required=False,
        allow_null=True,
        help_text="Опциональное изображение для рассылки"
    )