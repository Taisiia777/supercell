from django.contrib.auth import authenticate, get_user_model
from drf_spectacular.utils import extend_schema
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from rest_framework import generics, status, viewsets, mixins
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from api.permissions import IsDavDamer, IsSellerOwner, IsProductOwner
from core.models import City
from . import serializers

User = get_user_model()
Seller = get_model("partner", "Seller")
Order = get_model("order", "Order")
Product = get_model("catalogue", "Product")
CoreProductClassAdminList = get_api_class(
    "views.admin.product", "ProductClassAdminList"
)


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
        chat_id = serializer.validated_data.pop("telegram_chat_id", None)

        city = None
        city_name = serializer.validated_data.pop("city", None)
        if city_name:
            city, _ = City.objects.get_or_create(
                name__iexact=city_name, defaults={"name": city_name}
            )

        seller = serializer.save(davdamer=self.request.user.davdamer, city=city)

        if chat_id:
            self.create_seller_user(seller, chat_id)
            seller.save()

    @staticmethod
    def create_seller_user(seller, telegram_chat_id: int):
        user, _ = User.objects.get_or_create(
            telegram_chat_id=telegram_chat_id,
            defaults={"username": "TG:" + str(telegram_chat_id)},
        )
        seller.users.add(user)


class SellersListView(generics.ListAPIView):
    serializer_class = serializers.SellerResponseSerializer
    queryset = Seller.objects.all().order_by("-pk")
    permission_classes = [IsDavDamer]

    def get_queryset(self):
        return self.queryset.filter(davdamer=self.request.user.davdamer)


class OrderListView(generics.ListAPIView):
    serializer_class = serializers.OrderSerializer
    permission_classes = [IsDavDamer]

    def get_queryset(self):
        davdamer = self.request.user.davdamer
        return Order.objects.filter(seller__davdamer=davdamer).order_by("-pk")


class OrderDetailView(
    mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet
):
    permission_classes = [IsDavDamer]
    lookup_field = "number"
    lookup_url_kwarg = "order_number"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.OrderDetailSerializer
        elif self.action == "partial_update":
            return serializers.OrderUpdateSerializer

    def get_object(self):
        number = self.kwargs[self.lookup_url_kwarg]
        davdamer = self.request.user.davdamer
        return get_object_or_404(
            Order.objects.all(), number=number, seller__davdamer=davdamer
        )

    def get_queryset(self):
        davdamer = self.request.user.davdamer
        return Order.objects.filter(seller__davdamer=davdamer).order_by("-pk")

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)


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


class ProductClassAdminList(CoreProductClassAdminList):
    permission_classes = [IsDavDamer]
    serializer_class = serializers.ProductClassSerializer

    @extend_schema(exclude=True)
    def post(self, request, *args, **kwargs):
        raise MethodNotAllowed("POST")


class CreateProductView(generics.CreateAPIView):
    serializer_class = serializers.CreateProductSerializer
    queryset = Product.objects.get_queryset()
    permission_classes = [IsDavDamer, IsSellerOwner]


class UpdateProductView(generics.UpdateAPIView, generics.DestroyAPIView):
    serializer_class = serializers.CreateProductSerializer
    queryset = Product.objects.get_queryset()
    permission_classes = [IsDavDamer, IsProductOwner]
    lookup_url_kwarg = "product_id"

    @extend_schema(exclude=True)
    def put(self, request, *args, **kwargs):
        raise MethodNotAllowed("PUT")


class SellerView(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Seller.objects.get_queryset()
    permission_classes = [IsDavDamer, IsSellerOwner]
    lookup_url_kwarg = "seller_id"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return serializers.SellerResponseSerializer
        elif self.action == "partial_update":
            return serializers.UpdateSellerSerializer
        elif self.action == "update":
            return serializers.UpdateSellerSerializer
        elif self.action == "destroy":
            return serializers.SellerResponseSerializer

    def perform_update(self, serializer):
        city_name = serializer.validated_data.pop("city", None)
        if city_name:
            city, _ = City.objects.get_or_create(
                name__iexact=city_name, defaults={"name": city_name}
            )
            serializer.save(city=city)
        else:
            serializer.save()

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
