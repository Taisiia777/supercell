from django.contrib.auth import authenticate, get_user_model
from django.db.models import Max
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from drf_spectacular.utils import extend_schema, OpenApiParameter
from oscar.core.loading import get_model
from rest_framework import generics, viewsets, mixins
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters import rest_framework as filters

from api.permissions import IsDavDamer, IsSellerOwner
from celery_app import app as celery_app
from shop.catalogue.enums import LoginType
from . import serializers
from .filtersets import OrderFilter, ProductFilter
from ..pagination import DefaultPageNumberPagination
from ..shop.serializers import ResponseStatusSerializer
from api.permissions import OrderManagerPermission, ProductManagerPermission, AdminPermission
from .serializers import ProductImageSerializer

User = get_user_model()
Seller = get_model("partner", "Seller")
Order = get_model("order", "Order")
OrderLine = get_model("order", "Line")
Product = get_model("catalogue", "Product")
ProductImage = get_model("catalogue", "ProductImage")
Category = get_model("catalogue", "Category")
ProductAttribute = get_model("catalogue", "ProductAttribute")
ProductClass = get_model("catalogue", "ProductClass")


class OrderDetailView(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    # permission_classes = [IsDavDamer]
    # permission_classes = [IsDavDamer, OrderManagerPermission, AdminPermission]
    permission_classes = []
    pagination_class = DefaultPageNumberPagination
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = OrderFilter

    def get_queryset(self):
        return (
            Order.objects.select_related("user", "shipping_address", "seller")
            .prefetch_related(
                "lines",
                "lines__product",
                "lines__product__images",
                "lines__product__product_class",
                "lines__product__categories",
            )
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
        return get_object_or_404(
            Order.objects.all(),
            id=order_id,
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


class DavdamerLoginView(generics.GenericAPIView):
    authentication_classes = [] # Отключаем аутентификацию для логина
    permission_classes = []
    serializer_class = serializers.LoginSerializer

    def post(self, request, *args, **kwargs):
        # Проверяем Basic Auth
        if 'HTTP_AUTHORIZATION' in request.META:
            auth = request.META['HTTP_AUTHORIZATION'].split()
            if len(auth) == 2 and auth[0].lower() == 'basic':
                import base64
                username, password = base64.b64decode(auth[1]).decode().split(':')
            else:
                return Response({"error": "Invalid authorization header"}, status=401)
        # Проверяем JSON body
        else:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            username = serializer.validated_data["username"]
            password = serializer.validated_data["password"]

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=401)

        refresh = RefreshToken.for_user(user)
        data = {
            "access_token": str(refresh.access_token),
            "user": user
        }
        return Response(serializers.SuccessLogin(data).data)

class CreateProductView(generics.CreateAPIView):
    serializer_class = serializers.CreateProductSerializer
    queryset = Product.objects.get_queryset()
    # permission_classes = [IsDavDamer, IsSellerOwner]
    permission_classes = []

class ProductView(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    pagination_class = DefaultPageNumberPagination
    # permission_classes = [IsDavDamer]
    # permission_classes = [IsDavDamer, ProductManagerPermission, AdminPermission]
    permission_classes = []
    lookup_url_kwarg = "product_id"
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = ProductFilter

    def get_queryset(self):
        return Product.objects.select_related(
            "seller", "product_class"
        ).prefetch_related(
            "categories",
            "stockrecords",
            "attributes",
            "images",
            "recommended_products",
            "children",
            "attribute_values",
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


# class UploadProductImageView(generics.CreateAPIView):
#     # permission_classes = [IsDavDamer]
#     permission_classes = []
#     serializer_class = serializers.ProductImageSerializer

#     def perform_create(self, serializer):
#         product = get_object_or_404(
#             Product,
#             pk=self.kwargs["product_id"],
#         )

#         max_display_order = product.images.all().aggregate(Max("display_order"))[
#             "display_order__max"
#         ]
#         display_order = 0 if max_display_order is None else max_display_order + 1
#         serializer.save(product=product, display_order=display_order)

#     @extend_schema(
#         summary="Добавление фотографии товара",
#         description="В теле запроса в поле original передается сама фотография "
#         "бинарником",
#         request=None,
#         responses={201: None, 404: None},
#     )
#     def post(self, request, *args, **kwargs):
#         return super().post(request, *args, **kwargs)
class UploadProductImageView(generics.CreateAPIView):
    permission_classes = []
    serializer_class = ProductImageSerializer

    def perform_create(self, serializer):
        product = get_object_or_404(
            Product,
            pk=self.kwargs["product_id"],
        )

        max_display_order = product.images.all().aggregate(Max("display_order"))[
            "display_order__max"
        ]
        display_order = 0 if max_display_order is None else max_display_order + 1

        # Создаем все изображения пакетно
        images_to_create = []
        for image in serializer.validated_data['images']:
            images_to_create.append(
                ProductImage(
                    product=product, 
                    original=image,
                    display_order=display_order
                )
            )
            display_order += 1
            
        ProductImage.objects.bulk_create(images_to_create)

    @extend_schema(
        summary="Загрузка фотографий товара",
        description="Загрузка одной или нескольких фотографий товара. В теле запроса передаются файлы в поле images[]",
        request=ProductImageSerializer,
        responses={201: None, 404: None},
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

class DeleteProductImageView(generics.DestroyAPIView):
    # permission_classes = [IsDavDamer]
    permission_classes = []
    def get_object(self):
        return get_object_or_404(
            ProductImage,
            pk=self.kwargs["image_id"],
            product_id=self.kwargs["product_id"],
        )

    @extend_schema(responses={204: None, 404: None})
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class ProfileView(generics.RetrieveAPIView):
    # permission_classes = [IsDavDamer]
    permission_classes = []
    serializer_class = serializers.DavDamerSerializer

    def get_object(self):
        return self.request.user.davdamer


@method_decorator(cache_page(60), name="get")
class AddressOptionsView(generics.RetrieveAPIView):
    # permission_classes = [IsDavDamer]
    permission_classes = []
    serializer_class = serializers.AddressOptionsSerializer

    def get_object(self):
        sellers = Seller.objects
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
    # permission_classes = [IsDavDamer]
    permission_classes = []

    serializer_class = serializers.DavDamerCategorySerializer
    queryset = Category.objects.browsable().filter(depth=1).distinct()


@method_decorator(cache_page(60), name="get")
class ProductAttributeListView(generics.ListAPIView):
    # permission_classes = [IsDavDamer]
    permission_classes = []

    serializer_class = serializers.ProductAttributeSerializer

    def get_queryset(self):
        product_class = ProductClass.objects.first()
        return ProductAttribute.objects.filter(product_class=product_class).distinct()


# class RequestCodeView(APIView):
#     # permission_classes = [IsDavDamer]
#     permission_classes = []

#     @extend_schema(request=None, responses=ResponseStatusSerializer)
#     def post(self, request, *args, **kwargs):
#         if not OrderLine.objects.filter(
#             pk=kwargs["line_id"],
#             order__id=kwargs["id"],
#             product__login_type=LoginType.EMAIL_CODE,
#         ).exists():
#             return Response({"status": False})

#         celery_app.send_task("api.davdamer.request_code", args=(kwargs["line_id"],))
#         return Response({"status": True})
class RequestCodeView(APIView):
    permission_classes = []

    @extend_schema(
        request=None, 
        responses=ResponseStatusSerializer,
        parameters=[
            OpenApiParameter(
                name="send_code", 
                type=bool, 
                description="Отправлять ли код на почту (по умолчанию - да)",
                required=False
            )
        ]
    )
    def post(self, request, *args, **kwargs):
        if not OrderLine.objects.filter(
            pk=kwargs["line_id"],
            order__id=kwargs["id"],
        ).exists():
            return Response({"status": False})

        # Получаем параметр из запроса
        send_code = request.query_params.get("send_code", "true").lower() == "true"
        
        # Передаем параметр в задачу
        celery_app.send_task(
            "api.davdamer.request_code", 
            args=[kwargs["line_id"]], 
            kwargs={"send_code": send_code}
        )
        return Response({"status": True})

class ToggleProductVisibilityView(APIView):
    permission_classes = [IsDavDamer]
    
    @extend_schema(
        request=None,
        responses=ResponseStatusSerializer
    )
    def post(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id)
            product.is_public = not product.is_public
            product.save(update_fields=['is_public'])
            return Response({'status': True})
        except Product.DoesNotExist:
            return Response({'status': False}, status=404)

