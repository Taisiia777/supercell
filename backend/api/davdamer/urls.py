from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter()
router.register("seller", views.SellerView, basename="seller")

urlpatterns = [
    path("productclasses/", views.ProductClassAdminList.as_view()),
    path("login/", views.DavdamerLoginView.as_view()),
    path("seller/", views.SellerAddView.as_view()),
    path("seller/<int:seller_id>/products/", views.SellerProductsListView.as_view()),
    path("seller/<int:seller_id>/add_product/", views.CreateProductView.as_view()),
    path(
        "seller/product/<int:product_id>/",
        views.UpdateProductView.as_view(),
    ),
    path("sellers/", views.SellersListView.as_view()),
    path("orders/", views.OrderListView.as_view()),
    path("order/<str:order_number>/", views.OrderDetailView.as_view()),
    *router.urls,
]
