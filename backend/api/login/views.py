from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from core.models import Role
from core.permissions import AdminPermission
from .serializers import LoginSerializer, TokenSerializer

# class LoginView(APIView):
#     serializer_class = LoginSerializer

#     def post(self, request):
#         serializer = self.serializer_class(data=request.data)  
#         serializer.is_valid(raise_exception=True)

#         user = authenticate(
#             username=serializer.validated_data['username'],
#             password=serializer.validated_data['password']
#         )

#         if not user:
#             return Response({'detail': 'Invalid credentials'}, status=401)

#         if not user.is_staff:  
#             return Response({'detail': 'Access denied'}, status=403)
            
#         refresh = RefreshToken.for_user(user)
#         return Response({
#             'access': str(refresh.access_token),
#             'refresh': str(refresh),
#             'user': {
#                 'id': user.id, 
#                 'username': user.username
#             }
#         })
        
class LoginView(APIView):
    serializer_class = LoginSerializer

    def get(self, request):
        serializer = self.serializer_class(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )

        if not user:
            return Response({'detail': 'Неверные учетные данные'}, status=401)

        if not user.is_staff:
            return Response({'detail': 'Доступ запрещен'}, status=403)
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id, 
                'username': user.username
            }
        })