from django.urls import reverse
from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api import serializers
from core.exceptions import InvalidProductError, AppError

CoreProductList = get_api_class("views.product", "ProductList")
CoreProductDetail = get_api_class("views.product", "ProductDetail")
CoreCheckoutView = get_api_class("views.checkout", "CheckoutView")
CoreOrderSerializer = get_api_class("serializers.checkout", "OrderSerializer")
Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")


class SellersListView(generics.ListAPIView):
    serializer_class = serializers.SellerSerializer
    queryset = Seller.objects.all()


class SellerProductsListView(CoreProductList):
    serializer_class = serializers.ProductListSerializer

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
