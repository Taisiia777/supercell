from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.CustomerView.as_view()),
    path("orders/", views.OrdersListView.as_view()),
    path("order/<str:order_number>/", views.OrderDetailView.as_view()),
]
