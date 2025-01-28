from django.urls import path, include

from api import views

urlpatterns = [
    path("shop/", include("api.shop.urls")),
    path("seller/", include("api.seller.urls")),
    path("davdamer/", include("api.davdamer.urls")),
    path("customer/", include("api.customer.urls")),
    path('mailing/', include('api.mailing.urls')),
    path('excel/', include('api.excel.urls')),
    path('login/', include('api.login.urls')),

]
