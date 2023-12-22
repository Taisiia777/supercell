from django.urls import path

from . import views

urlpatterns = [
    path("seller/", views.SellerAddView.as_view()),
    path("seller/<int:seller_id>/products/", views.SellerProductsListView.as_view()),
    path("sellers/", views.SellersListView.as_view()),
    path("orders/", views.OrderListView.as_view()),
    path("order/<str:order_number>/", views.OrderDetailView.as_view()),
]
