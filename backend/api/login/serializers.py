from rest_framework import serializers
from core.models import User, Role

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class TokenSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = serializers.SerializerMethodField()

    def get_user(self, obj):
        user = self.context['user']
        return {
            'id': user.id,
            'username': user.username,
            'roles': [role.name for role in user.roles.all()]
        }
