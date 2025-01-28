from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView

urlpatterns = [
    path('auth/', LoginView.as_view(), name='auth'), 
    path('token/refresh/', TokenRefreshView.as_view()),
]