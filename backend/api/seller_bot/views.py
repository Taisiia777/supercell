from oscar.core.loading import get_model
from rest_framework import generics

from shop.order.enums import OrderStatus
from .serializers import SellerOrderSerializer

Order = get_model("order", "Order")


class SellerOrdersView(generics.ListAPIView):
    serializer_class = SellerOrderSerializer

    def get_queryset(self):
        seller_chat_id = self.kwargs["seller_chat_id"]
        queryset = (
            Order.objects.filter(
                seller__users__telegram_chat_id=seller_chat_id,
                status=OrderStatus.PROCESSING,
            )
            .prefetch_related("lines")
            .select_related("seller")
            .order_by("date_placed")
        )
        return queryset
