from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter()
router.register("order", views.OrderDetailView, basename="order")
router.register("product", views.ProductView, basename="davdamer-product")

urlpatterns = [
    path("enums/address/", views.AddressOptionsView.as_view()),
    path("enums/category/", views.CategoryListView.as_view()),
    path("enums/attribute/", views.ProductAttributeListView.as_view()),
    path("me/", views.ProfileView.as_view()),
    path("login/", views.DavdamerLoginView.as_view()),
    path("seller/<int:seller_id>/add_product/", views.CreateProductView.as_view()),
    path("product/<int:product_id>/image/", views.UploadProductImageView.as_view()),
    path(
        "product/<int:product_id>/image/<int:image_id>/",
        views.DeleteProductImageView.as_view(),
    ),
    path("order/<int:id>/request_code/<int:line_id>/", views.RequestCodeView.as_view()),
    *router.urls,
    path('product/<int:product_id>/toggle_visibility/', views.ToggleProductVisibilityView.as_view()),

]
