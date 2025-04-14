from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.CustomerView.as_view()),
    path("orders/", views.OrdersListView.as_view()),
    path("order/webhook/", views.OrderWebhookView.as_view(), name="api_order_webhook"),
    path("order/<str:order_number>/", views.OrderDetailView.as_view()),
    path("order/<str:order_number>/review/", views.OrderReviewForPaymentView.as_view(), name="api_order_review_payment"),
    path("reviews/", views.OrderReviewView.as_view(), name="api_order_review"),
    path(
        "order/<str:order_number>/confirm_payment/",
        views.ConfirmPaymentView.as_view(),
        name="api_confirm_payment",
    ),
    path("order/<str:order_number>/login_data/", views.OrderLoginDataView.as_view()),
    path("referral/process/", views.ProcessReferralView.as_view(), name="process_referral"),
    path("referral/register/", views.RegisterUserView.as_view(), name="register_user"),
    path("referral/link/", views.GetReferralLinkView.as_view(), name="get_referral_link"),
    path("referral/stats/", views.ReferralStatsView.as_view(), name="referral_stats"),
    path("referral/users/", views.ReferralUsersView.as_view(), name="referral_users"),
    path("referral/payment/", views.ReferralPaymentView.as_view(), name="referral_payment"),
    path("referral/users/<int:user_id>/details/", views.ReferralUserDetailsView.as_view(), name="referral_user_details"),
    path("social-media/", views.UserSocialMediaView.as_view(), name="user_social_media"),
    path("referral/users/<int:user_id>/update/", views.ReferralUserUpdateView.as_view(), name="referral_user_update"),
]
