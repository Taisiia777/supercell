import logging

from django.db.models import Q
from django.urls import reverse
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

from api.shop import serializers
from core.exceptions import InvalidProductError, AppError
from core.models import City

logger = logging.getLogger(__name__)

CoreProductDetail = get_api_class("views.product", "ProductDetail")
Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")
Category = get_model("catalogue", "Category")


class SellersListView(generics.ListAPIView):
    serializer_class = serializers.SellerSerializer
    queryset = Seller.objects.filter(stockrecords__isnull=False)


class SellerProductCategoriesListView(generics.ListAPIView):
    serializer_class = serializers.CategorySerializer

    def get_queryset(self):
        seller_id = self.kwargs["seller_id"]
        return Category.objects.filter(
            Q(product__stockrecords__partner_id=seller_id)
        ).distinct()


class ProductCategoriesListView(generics.ListAPIView):
    serializer_class = serializers.CategorySerializer
    queryset = (
        Category.objects.browsable().filter(product__isnull=False).order_by("name")
    )


@extend_schema(
    parameters=[
        OpenApiParameter(name="category_id", type=int),
        OpenApiParameter(name="city_id", type=int),
    ]
)
class ProductListView(CoreProductList):
    serializer_class = serializers.ProductLinkSerializer
    queryset = Product.objects.browsable()

    def get_queryset(self):
        qs = super().get_queryset()

        category_id = self.request.query_params.get("category_id", "")
        if category_id and category_id.isdigit():
            qs = qs.filter(categories__id=category_id)

        city_id = self.request.query_params.get("city_id", "")
        if city_id and city_id.isdigit():
            qs = qs.filter(seller__city_id=city_id)

        return qs


@extend_schema(parameters=[OpenApiParameter(name="category_id", type=int)])
class SellerProductsListView(CoreProductList):
    serializer_class = serializers.ProductLinkSerializer
    queryset = Product.objects.browsable()

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(stockrecords__partner_id=self.kwargs["seller_id"])

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


class ProductDetailView(CoreProductDetail):
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

    def post(self, request, *args, **kwargs):
        try:
            self._parse_products_and_fill_basket()
        except AppError as err:
            return Response({"success": False, "message": str(err)}, status=400)

        self._set_default_request_data()
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


class CityListView(generics.ListAPIView):
    serializer_class = serializers.CitySerializer
    queryset = City.objects.all().order_by("name")
