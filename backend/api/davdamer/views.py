from drf_spectacular.utils import extend_schema
from oscar.core.loading import get_model
from rest_framework import generics, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from . import serializers
from api.permissions import IsDavDamer

Seller = get_model("partner", "Seller")
Order = get_model("order", "Order")


@extend_schema(
    request=serializers.CreateSellerSerializer,
    responses=serializers.SellerResponseSerializer,
)
class SellerAddView(generics.CreateAPIView):
    serializer_class = serializers.CreateSellerSerializer
    response_serializer_class = serializers.SellerResponseSerializer
    queryset = Seller.objects.all()
    permission_classes = [IsDavDamer]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        response_serializer = self.response_serializer_class(
            instance=serializer.instance
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(davdamer=self.request.user.davdamer)


class SellersListView(generics.ListAPIView):
    serializer_class = serializers.SellerResponseSerializer
    queryset = Seller.objects.all()
    permission_classes = [IsDavDamer]

    def get_queryset(self):
        return self.queryset.filter(davdamer=self.request.user.davdamer)


class OrderListView(generics.ListAPIView):
    serializer_class = serializers.OrderSerializer
    permission_classes = [IsDavDamer]

    def get_queryset(self):
        davdamer = self.request.user.davdamer
        return Order.objects.filter(seller__davdamer=davdamer).order_by("-pk")


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = serializers.OrderDetailSerializer
    permission_classes = [IsDavDamer]

    def get_object(self):
        number = self.kwargs["order_number"]
        davdamer = self.request.user.davdamer
        return get_object_or_404(
            Order.objects.all(), number=number, seller__davdamer=davdamer
        )
