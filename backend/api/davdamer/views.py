from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema
from oscar.core.loading import get_model
from rest_framework import generics, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from api.permissions import IsDavDamer, IsSellerOwner
from . import serializers

Seller = get_model("partner", "Seller")
Order = get_model("order", "Order")
Product = get_model("catalogue", "Product")


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


class SellerProductsListView(generics.ListAPIView):
    permission_classes = [IsDavDamer, IsSellerOwner]
    serializer_class = serializers.ProductSerializer

    def get_queryset(self):
        seller_id = self.kwargs["seller_id"]
        return Product.objects.filter(seller_id=seller_id, parent=None)


class DavdamerLoginView(generics.GenericAPIView):
    serializer_class = serializers.LoginSerializer

    @extend_schema(
        responses={
            200: serializers.SuccessLogin,
            400: serializers.ErrorLogin,
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response({"password": ["Неправильный логин или пароль"]}, status=400)

        refresh = RefreshToken.for_user(user)
        data = {
            "access_token": str(refresh.access_token),
            "user": user,
        }
        response_serializer = serializers.SuccessLogin(data)
        return Response(response_serializer.data)


class CreateProductView(generics.CreateAPIView):
    serializer_class = serializers.CreateProductSerializer
    queryset = Product.objects.get_queryset()
