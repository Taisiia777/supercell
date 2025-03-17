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

]
