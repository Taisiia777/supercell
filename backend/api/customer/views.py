from drf_spectacular.utils import extend_schema
from oscar.core.loading import get_model
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import serializers

Order = get_model("order", "Order")


class OrdersListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.CustomerOrderListSerializer

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("lines")
            .order_by("-pk")
        )

    def get(self, request):
        queryset = self.get_queryset()
        context = {"request": request}
        data = {"orders": queryset, "user": request.user}
        serializer = self.serializer_class(data, context=context)
        return Response(serializer.data)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.CustomerOrderDetailSerializer

    def get_queryset(self):
        number = self.kwargs.get("order_number")
        return (
            Order.objects.filter(user=self.request.user, number=number)
            .select_related("shipping_address")
            .prefetch_related("lines")
            .first()
        )

    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        context = {"request": request}
        data = {"order": queryset, "user": request.user}
        serializer = self.serializer_class(data, context=context)
        return Response(serializer.data)


class CustomerView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.CustomerSerializer

    @extend_schema(exclude=True)
    def put(self, request, *args, **kwargs):
        raise NotImplementedError()

    def get_object(self):
        return self.request.user
