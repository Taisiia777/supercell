# api/mailing/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('send/', views.MassMailingView.as_view(), name='mass-mailing'),
]