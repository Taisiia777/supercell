import logging

from django.db.models import Q
from django.urls import reverse
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_spectacular.utils import extend_schema, OpenApiParameter
from oscar.apps.partner.strategy import Selector
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from oscarapi.views.checkout import CheckoutView as CoreCheckoutView
from oscarapi.views.product import ProductList as CoreProductList
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.reverse import reverse_lazy
from rest_framework.views import APIView

from api.davdamer.filtersets import PRODUCT_ORDERS_COUNT
from api.shop import serializers
from core.exceptions import InvalidProductError, AppError
from core.models import City, EmailCodeRequest
from celery_app import app as celery_app

logger = logging.getLogger(__name__)

CoreProductDetail = get_api_class("views.product", "ProductDetail")
Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")
Category = get_model("catalogue", "Category")


@method_decorator(cache_page(30), name="list")
class SellersListView(generics.ListAPIView):
    serializer_class = serializers.SellerSerializer
    queryset = Seller.objects.filter(stockrecords__isnull=False).distinct()


@method_decorator(cache_page(30), name="list")
@extend_schema(deprecated=True)
class SellerProductCategoriesListView(generics.ListAPIView):
    serializer_class = serializers.CategorySerializer

    def get_queryset(self):
        seller_id = self.kwargs["seller_id"]
        return Category.objects.filter(
            Q(product__stockrecords__partner_id=seller_id)
        ).distinct()


@method_decorator(cache_page(60), name="list")
class ProductCategoriesListView(generics.ListAPIView):
    serializer_class = serializers.ShopCategorySerializer
    queryset = Category.objects.browsable().filter(product__isnull=False).distinct()

    def get_queryset(self):
        qs = super().get_queryset()
        result = set()
        for category in qs:
            if category.depth > 1:
                result.add(category.get_parent())
            else:
                result.add(category)
        result = sorted(result, key=lambda x: x.path)
        return result


@method_decorator(cache_page(60), name="list")
class PopularCategoriesListView(ProductCategoriesListView):
    def get_queryset(self):
        qs = super().get_queryset()
        return qs[:3]


@extend_schema(
    parameters=[
        OpenApiParameter(name="category_id", type=int),
        OpenApiParameter(name="search", type=str),
    ]
)
class ProductListView(CoreProductList):
    serializer_class = serializers.ProductLinkSerializer
    queryset = (
        Product.objects.browsable()
        .select_related("seller", "product_class")
        .prefetch_related("images", "stockrecords", "categories")
        .distinct()
    )

    def get_queryset(self):
        qs = super().get_queryset()

        category_id = self.request.query_params.get("category_id", "")
        if category_id and category_id.isdigit():
            qs = qs.filter(categories__id=category_id)

        search = self.request.query_params.get("search", "")
        if search:
            qs = qs.filter(title__icontains=search)

        return qs


@extend_schema(
    deprecated=True, parameters=[OpenApiParameter(name="category_id", type=int)]
)
class SellerProductsListView(CoreProductList):
    serializer_class = serializers.ProductLinkSerializer
    queryset = (
        Product.objects.browsable()
        .select_related("product_class", "seller")
        .prefetch_related("images", "stockrecords", "categories")
    )

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(seller__id=self.kwargs["seller_id"]).distinct()

        category_id = self.request.query_params.get("category_id", "")
        if category_id and category_id.isdigit():
            qs = qs.filter(categories__id=category_id)

        return qs


@extend_schema(tags=["in-development"])
class PaymentView(APIView):
    @staticmethod
    def get(request, *args, **kwargs):
        return Response(
            {
                "payment_method_code": "enot",
                "url": "<payment provider url will be here>",
            },
            status=status.HTTP_418_IM_A_TEAPOT,
        )


# @method_decorator(cache_page(15), name="retrieve")
class ProductDetailView(generics.RetrieveAPIView):
    queryset = (
        Product.objects.browsable()
        .select_related("product_class", "seller")
        .prefetch_related("images", "stockrecords", "categories")
    )
    serializer_class = serializers.ProductSerializer


@extend_schema(
    request=serializers.APICheckoutSerializer,
    responses=serializers.OrderSerializer,
)
class CheckoutAPIView(CoreCheckoutView):
    permission_classes = [IsAuthenticated]
    products_serializer_class = serializers.APICheckoutSerializer
    order_serializer_class = serializers.OrderSerializer
    serializer_class = serializers.CheckoutSerializer
    serializer = None

    default_country = reverse_lazy("country-detail", kwargs={"pk": "RU"})

    def _fill_basket(self):
        for product_data in self.serializer.validated_data["products"]:
            try:
                product = Product.objects.public().get(id=product_data["product_id"])
                qnt = product_data["quantity"]
                self.request.basket.add_product(product, qnt)
            except (Product.DoesNotExist, ValueError) as err:
                raise InvalidProductError(str(err)) from err
            except Exception as err:
                logger.exception(err)
                raise AppError(str(err)) from err

    def _parse_products_and_fill_basket(self):
        serializer = self.products_serializer_class(data=self.request.data)
        if not serializer.is_valid():
            raise InvalidProductError(serializer.errors)

        self.serializer = serializer
        self.request.basket.flush()
        self._fill_basket()

        basket_url = self.request.build_absolute_uri(
            reverse("basket-detail", kwargs={"pk": self.request.basket.pk})
        )
        self.request.data["basket"] = basket_url

    def _set_default_request_data(self):
        if "shipping_address" in self.request.data:
            self.request.data["shipping_address"]["country"] = self.default_country

    def _validate_order_data(self):
        today = timezone.now().date()
        if "shipping_address" in self.request.data:
            if "date" not in self.request.data["shipping_address"]:
                return

            str_date = self.request.data["shipping_address"]["date"]
            shipping_date = parse_date(str_date)
            if shipping_date is None:
                raise AppError("Неверный формат даты")
            if shipping_date < today:
                raise AppError("Недоступная для доставки дата")

    def post(self, request, *args, **kwargs):
        try:
            self._parse_products_and_fill_basket()
            self._set_default_request_data()
            self._validate_order_data()
        except AppError as err:
            return Response({"success": False, "message": str(err)}, status=400)
        except Exception as err:
            logger.exception(f"Uncaught checkout error: {err}")
            return Response({"success": False, "message": "Server error"}, status=500)

        return super().post(request, *args, **kwargs)


@extend_schema(tags=["in-development"])
class ProductAllocationTestView(APIView):
    serializer_class = serializers.BasketProductSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "message": serializer.errors}, status=400
            )

        try:
            product_id = serializer.validated_data["product_id"]
            qnt = serializer.validated_data["quantity"]
            product = Product.objects.get(id=product_id)
        except (Product.DoesNotExist, ValueError) as err:
            return Response({"success": False, "message": str(err)}, status=400)

        strategy = Selector().strategy()
        info = strategy.fetch_for_product(product)
        result = info.availability.is_purchase_permitted(qnt)
        return Response({"success": True, "message": result})


@method_decorator(cache_page(15), name="list")
class CityListView(generics.ListAPIView):
    serializer_class = serializers.CitySerializer
    queryset = (
        City.objects.filter(sellers__stockrecords__isnull=False)
        .distinct()
        .order_by("name")
    )


class PopularProductsListView(generics.ListAPIView):
    serializer_class = serializers.ProductLinkSerializer
    queryset = (
        Product.objects.browsable()
        .annotate(
            orders_count=PRODUCT_ORDERS_COUNT,
        )
        .select_related("seller", "product_class")
        .prefetch_related("images", "stockrecords", "categories")
        .order_by("-orders_count")
        .distinct()
    )[:5]


class DistrictListView(generics.ListAPIView):
    serializer_class = serializers.DistrictSerializer

    def get_queryset(self):
        return [
            {"id": 1, "name": "ЖК «Скандинавия»"},
            {"id": 2, "name": "ЖК «Испанские кварталы»"},
            {"id": 3, "name": "ЖК «Филатов луг»"},
            {"id": 4, "name": "ЖК «Саларьево парк»"},
            {"id": 5, "name": "ЖК «Румянцево парк»"},
        ]


class RequestCodeAPIView(APIView):
    @staticmethod
    def save_code_requests(emails: list[str]):
        for email in emails:
            code_request = EmailCodeRequest.objects.create(email=email)
            celery_app.send_task("api.shop.request_code", args=[code_request.pk])

    @extend_schema(
        request=serializers.EmailCodeRequestSerializer,
        responses=serializers.ResponseStatusSerializer,
    )
    def post(self, request, *args, **kwargs):
        serializer = serializers.EmailCodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        self.save_code_requests(serializer.validated_data["emails"])

        return Response({"status": True})
