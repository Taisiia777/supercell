from django.urls import path

from api.shop import views

urlpatterns = [
    path("categories/", views.ProductCategoriesListView.as_view()),
    path("categories/popular/", views.PopularCategoriesListView.as_view()),
    path("products/", views.ProductListView.as_view()),
    path("products/popular/", views.PopularProductsListView.as_view()),
    path("product/<int:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("checkout/", views.CheckoutAPIView.as_view()),
]
