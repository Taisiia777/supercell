from django.urls import path
from . import views

urlpatterns = [
    path('users/import/', views.UserImportView.as_view(), name='user-import'),
    path('users/export/', views.UserExportView.as_view(), name='user-export'),
]