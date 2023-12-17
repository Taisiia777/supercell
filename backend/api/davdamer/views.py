from drf_spectacular.utils import extend_schema
from oscar.core.loading import get_model
from rest_framework import generics, status
from rest_framework.response import Response

from . import serializers
from api.permissions import IsDavDamer

Seller = get_model("partner", "Seller")


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
