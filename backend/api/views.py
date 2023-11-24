from django.urls import reverse
from drf_spectacular.utils import extend_schema, OpenApiExample
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from oscar.apps.partner.strategy import Selector

from api import serializers
from core.exceptions import InvalidProductError, AppError

CoreProductList = get_api_class("views.product", "ProductList")
CoreProductDetail = get_api_class("views.product", "ProductDetail")
CoreCheckoutView = get_api_class("views.checkout", "CheckoutView")
CoreOrderSerializer = get_api_class("serializers.checkout", "OrderSerializer")
CoreProductLinkSerializer = get_api_class("serializers.product", "ProductLinkSerializer")
Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")


class SellersListView(generics.ListAPIView):
    serializer_class = serializers.SellerSerializer
    queryset = Seller.objects.all()


class SellerProductsListView(CoreProductList):
    serializer_class = CoreProductLinkSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(stockrecords__partner_id=self.kwargs["seller_id"])
        return qs


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
    pass


@extend_schema(
    request=serializers.APICheckoutSerializer,
    responses=serializers.OrderSerializer,
)
class CheckoutAPIView(CoreCheckoutView):
    permission_classes = [IsAuthenticated]
    products_serializer_class = serializers.APICheckoutSerializer
    order_serializer_class = serializers.OrderSerializer
    serializer = None

    def _fill_basket(self):
        for product_data in self.serializer.validated_data["products"]:
            try:
                product = Product.objects.get(id=product_data["product_id"])
                qnt = product_data["quantity"]
                self.request.basket.add_product(product, qnt)
            except (Product.DoesNotExist, ValueError) as err:
                raise InvalidProductError(str(err)) from err

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

    def post(self, request, *args, **kwargs):
        try:
            self._parse_products_and_fill_basket()
        except AppError as err:
            return Response({"success": False, "message": str(err)}, status=400)

        return super().post(request, *args, **kwargs)


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
