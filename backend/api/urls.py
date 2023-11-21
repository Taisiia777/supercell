from django.urls import path

from api import views

urlpatterns = [
    path("sellers/", views.SellersListView.as_view()),
    path("seller/<int:seller_id>/products/", views.SellerProductsListView.as_view()),
    path("product/<int:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
]
