from django.urls import path
from api.seller_bot import views as seller_bot_views
from api.customer import views as customer_views

urlpatterns = [
    path(
        "seller_bot/<int:seller_chat_id>/processing_orders/",
        seller_bot_views.SellerOrdersView.as_view(),
    ),
    path("customer_bot/login_data/", customer_views.UpdateLoginDataView.as_view()),
]
