from django.contrib.auth import authenticate, get_user_model
from django.db.models import Max
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
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
from core.models import City
from celery_app import app as celery_app
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
ProductAttribute = get_model("catalogue", "ProductAttribute")
ProductClass = get_model("catalogue", "ProductClass")


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
        elif self.action in ("partial_update", "update"):
            return serializers.OrderUpdateSerializer

    def get_object(self):
        order_id = self.kwargs["pk"]
        davdamer = self.request.user.davdamer
        return get_object_or_404(
            Order.objects.all(), id=order_id, seller__davdamer=davdamer
        )

    @method_decorator(cache_page(15))
    @method_decorator(vary_on_headers("Authorization"))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def perform_update(self, serializer):
        old_status = serializer.instance.status

        order = serializer.save()

        if old_status != order.status:
            celery_app.send_task("api.davdamer.order_status_updated", args=(order.pk,))

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)


@extend_schema(deprecated=True)
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

    @method_decorator(cache_page(15))
    @method_decorator(vary_on_headers("Authorization"))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        return (
            Seller.objects.get_queryset()
            .filter(davdamer__user=self.request.user)
            .select_related("city", "davdamer__user")
            .prefetch_related("products")
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

    def perform_update(self, serializer: serializers.UpdateSellerSerializer):
        city_name = serializer.validated_data.pop("city", None)
        new_city = None
        if city_name:
            new_city, _ = City.objects.get_or_create(
                name__iexact=city_name, defaults={"name": city_name}
            )

        telegram_chat_id = serializer.validated_data.pop("telegram_chat_id", None)
        if telegram_chat_id:
            seller = serializer.instance
            seller.users.clear()
            self.create_seller_user(seller, telegram_chat_id)

        if new_city:
            serializer.save(city=new_city)
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
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        response_serializer = serializers.SellerResponseSerializer(
            instance=instance, context=self.get_serializer_context()
        )
        return Response(response_serializer.data)

    @extend_schema(
        request=serializers.UpdateSellerSerializer,
        responses=serializers.SellerResponseSerializer,
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)


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
                "attribute_values",
            )
        )

    # @method_decorator(cache_page(15))
    @method_decorator(vary_on_headers("Authorization"))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_serializer_class(self):
        if self.action == "list":
            return serializers.DavdamerProductLinkSerializer
        elif self.action == "retrieve":
            return serializers.DavdamerProductDetailSerializer
        elif self.action in ("update", "partial_update"):
            return serializers.UpdateProductSerializer

    @extend_schema(exclude=True)
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        response_serializer = serializers.ProductSerializer(
            instance=instance, context=self.get_serializer_context()
        )
        return Response(response_serializer.data)


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


@method_decorator(cache_page(60), name="get")
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


@method_decorator(cache_page(60), name="get")
class CategoryListView(generics.ListAPIView):
    permission_classes = [IsDavDamer]
    serializer_class = serializers.DavDamerCategorySerializer
    queryset = Category.objects.browsable().filter(depth=1).distinct()


@method_decorator(cache_page(60), name="get")
class ProductAttributeListView(generics.ListAPIView):
    permission_classes = [IsDavDamer]
    serializer_class = serializers.ProductAttributeSerializer

    def get_queryset(self):
        product_class = ProductClass.objects.first()
        return ProductAttribute.objects.filter(product_class=product_class).distinct()
