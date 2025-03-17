from django.urls import path
from api.seller_bot import views as seller_bot_views
from api.customer import views as customer_views

urlpatterns = [
    path(
        "seller_bot/<int:seller_chat_id>/processing_orders/",
        seller_bot_views.SellerOrdersView.as_view(),
    ),
    path("customer_bot/login_data/", customer_views.UpdateLoginDataView.as_view()),
    path("customer_bot/process_referral/", customer_views.ProcessReferralView.as_view()),
    path("customer_bot/register_user/", customer_views.RegisterUserView.as_view()),
    path("customer_bot/get_referral_link/", customer_views.GetReferralLinkView.as_view()),
]
