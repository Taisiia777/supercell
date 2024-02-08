from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter()
router.register("seller", views.SellerView, basename="seller")
router.register("order", views.OrderDetailView, basename="order")
router.register("product", views.ProductView, basename="product")

urlpatterns = [
    path("enums/address/", views.AddressOptionsView.as_view()),
    path("enums/category/", views.CategoryListView.as_view()),
    path("enums/attribute/", views.ProductAttributeListView.as_view()),
    path("me/", views.ProfileView.as_view()),
    path("productclasses/", views.ProductClassAdminList.as_view()),
    path("login/", views.DavdamerLoginView.as_view()),
    path("seller/<int:seller_id>/products/", views.SellerProductsListView.as_view()),
    path("seller/<int:seller_id>/add_product/", views.CreateProductView.as_view()),
    path("sellers/", views.SellersListView.as_view()),
    path("orders/", views.OrderListView.as_view()),
    path("product/<int:product_id>/image/", views.UploadProductImageView.as_view()),
    path(
        "product/<int:product_id>/image/<int:image_id>/",
        views.DeleteProductImageView.as_view(),
    ),
    *router.urls,
]
