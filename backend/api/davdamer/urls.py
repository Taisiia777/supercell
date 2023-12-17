from django.urls import path

from . import views

urlpatterns = [
    path("seller/", views.SellerAddView.as_view()),
    path("sellers/", views.SellersListView.as_view()),
]
