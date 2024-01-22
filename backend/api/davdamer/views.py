from django.contrib.auth import authenticate, get_user_model
from django.db.models import Max
from drf_spectacular.utils import extend_schema
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from rest_framework import generics, status, viewsets, mixins
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters import rest_framework as filters

from api.permissions import IsDavDamer, IsSellerOwner
from api.shop import serializers as shop_serializers
from core.models import City
from . import serializers
from .filtersets import OrderFilter, ProductFilter, SellerFilter
from ..pagination import DefaultPageNumberPagination

User = get_user_model()
Seller = get_model("partner", "Seller")
Order = get_model("order", "Order")
Product = get_model("catalogue", "Product")
CoreProductClassAdminList = get_api_class(
    "views.admin.product", "ProductClassAdminList"
)
ProductImage = get_model("catalogue", "ProductImage")
Category = get_model("catalogue", "Category")


class SellersListView(generics.ListAPIView):
    serializer_class = serializers.SellerResponseSerializer
    queryset = Seller.objects.all().order_by("-pk")
    permission_classes = [IsDavDamer]

    def get_queryset(self):
        return self.queryset.filter(davdamer=self.request.user.davdamer)

    @extend_schema(deprecated=True)
    def get(self, *args, **kwargs):
        return super().get(*args, **kwargs)


class OrderListView(generics.ListAPIView):
    serializer_class = serializers.OrderSerializer
    permission_classes = [IsDavDamer]
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = OrderFilter

    def get_queryset(self):
        davdamer = self.request.user.davdamer
        return Order.objects.filter(seller__davdamer=davdamer).order_by("-pk")

    @extend_schema(deprecated=True)
    def get(self, *args, **kwargs):
        return super().get(*args, **kwargs)


class OrderDetailView(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsDavDamer]
    pagination_class = DefaultPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = OrderFilter

    def get_queryset(self):
        return (
            Order.objects.filter(seller__davdamer__user=self.request.user)
            .select_related("user", "shipping_address", "seller")
            .order_by("-pk")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return serializers.OrderSerializer
        elif self.action == "retrieve":
            return serializers.OrderDetailSerializer
        elif self.action == "partial_update":
            return serializers.OrderUpdateSerializer

    def get_object(self):
        order_id = self.kwargs["pk"]
        davdamer = self.request.user.davdamer
        return get_object_or_404(
            Order.objects.all(), id=order_id, seller__davdamer=davdamer
        )

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)


class SellerProductsListView(generics.ListAPIView):
    permission_classes = [IsDavDamer, IsSellerOwner]
    serializer_class = serializers.ProductSerializer

    def get_queryset(self):
        seller_id = self.kwargs["seller_id"]
        return Product.objects.filter(seller_id=seller_id, parent=None)

    @extend_schema(deprecated=True)
    def get(self, *args, **kwargs):
        return super().get(*args, **kwargs)


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


class SellerView(viewsets.ModelViewSet):
    permission_classes = [IsDavDamer]
    lookup_url_kwarg = "seller_id"
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = SellerFilter

    def get_queryset(self):
        return (
            Seller.objects.get_queryset()
            .filter(davdamer__user=self.request.user)
            .select_related("city", "davdamer__user")
            .order_by("-pk")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return serializers.CreateSellerSerializer
        elif self.action in ("retrieve", "list"):
            return serializers.SellerResponseSerializer
        elif self.action in ("partial_update", "update"):
            return serializers.UpdateSellerSerializer

    @extend_schema(
        request=serializers.CreateSellerSerializer,
        responses=serializers.SellerResponseSerializer,
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        response_serializer = serializers.SellerResponseSerializer(
            instance=serializer.instance, context=self.get_serializer_context()
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def perform_update(self, serializer):
        city_name = serializer.validated_data.pop("city", None)
        if city_name:
            city, _ = City.objects.get_or_create(
                name__iexact=city_name, defaults={"name": city_name}
            )
            serializer.save(city=city)
        else:
            serializer.save()

    @staticmethod
    def create_seller_user(seller, telegram_chat_id: int):
        user, _ = User.objects.get_or_create(
            telegram_chat_id=telegram_chat_id,
            defaults={"username": "TG:" + str(telegram_chat_id)},
        )
        seller.users.add(user)

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

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)


class ProductView(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    pagination_class = DefaultPageNumberPagination
    permission_classes = [IsDavDamer]
    lookup_url_kwarg = "product_id"
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = ProductFilter

    def get_queryset(self):
        return (
            Product.objects.filter(seller__davdamer__user=self.request.user)
            .select_related("seller", "product_class")
            .prefetch_related(
                "categories",
                "stockrecords",
                "attributes",
                "images",
                "recommended_products",
                "children",
            )
        )

    def get_serializer_class(self):
        if self.action in ("retrieve", "list"):
            return serializers.ProductSerializer
        elif self.action in ("update", "partial_update"):
            return serializers.CreateProductSerializer

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)


class UploadProductImageView(generics.CreateAPIView):
    permission_classes = [IsDavDamer]
    serializer_class = serializers.ProductImageSerializer

    def perform_create(self, serializer):
        product = get_object_or_404(
            Product,
            pk=self.kwargs["product_id"],
            seller__davdamer__user=self.request.user,
        )

        max_display_order = product.images.all().aggregate(Max("display_order"))[
            "display_order__max"
        ]
        display_order = 0 if max_display_order is None else max_display_order + 1
        serializer.save(product=product, display_order=display_order)

    @extend_schema(
        summary="Добавление фотографии товара",
        description="В теле запроса в поле original передается сама фотография "
        "бинарником",
        request=None,
        responses={201: None, 404: None},
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class DeleteProductImageView(generics.DestroyAPIView):
    permission_classes = [IsDavDamer]

    def get_object(self):
        return get_object_or_404(
            ProductImage,
            pk=self.kwargs["image_id"],
            product_id=self.kwargs["product_id"],
            product__seller__davdamer__user=self.request.user,
        )

    @extend_schema(responses={204: None, 404: None})
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class ProfileView(generics.RetrieveAPIView):
    permission_classes = [IsDavDamer]
    serializer_class = serializers.DavDamerSerializer

    def get_object(self):
        return self.request.user.davdamer


class AddressOptionsView(generics.RetrieveAPIView):
    permission_classes = [IsDavDamer]
    serializer_class = serializers.AddressOptionsSerializer

    def get_object(self):
        sellers = Seller.objects.filter(davdamer__user=self.request.user)
        countries = (
            sellers.filter(country__isnull=False)
            .values_list("country", flat=True)
            .distinct()
        )
        cities = (
            sellers.filter(city__isnull=False)
            .values_list("city__name", flat=True)
            .distinct()
        )
        markets = (
            sellers.filter(market__isnull=False)
            .values_list("market", flat=True)
            .distinct()
        )
        return {
            "countries": countries,
            "cities": cities,
            "markets": markets,
        }


class CategoryListView(generics.ListAPIView):
    permission_classes = [IsDavDamer]
    serializer_class = shop_serializers.CategorySerializer
    queryset = Category.objects.browsable().order_by("name").distinct()
