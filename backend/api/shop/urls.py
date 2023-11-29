from django.urls import path

from api.shop import views

urlpatterns = [
    path("sellers/", views.SellersListView.as_view()),
    path(
        "seller/<int:seller_id>/products/",
        views.SellerProductsListView.as_view(),
        name="seller-products",
    ),
    path("product/<int:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("checkout/", views.CheckoutAPIView.as_view()),
    path("payment/<int:pk>/", views.PaymentView.as_view(), name="api-payment"),
    path("test_allocation/", views.ProductAllocationTestView.as_view()),
]
