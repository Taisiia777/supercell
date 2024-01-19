from django.urls import path
from api.seller_bot import views as seller_bot_views

urlpatterns = [
    path(
        "seller_bot/<int:seller_chat_id>/processing_orders/",
        seller_bot_views.SellerOrdersView.as_view(),
    ),
]
