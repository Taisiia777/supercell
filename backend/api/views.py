from oscar.core.loading import get_model
from oscarapi.utils.loading import get_api_class
from rest_framework import generics

from api import serializers

CoreProductList = get_api_class("views.product", "ProductList")
CoreProductDetail = get_api_class("views.product", "ProductDetail")
Seller = get_model("partner", "Seller")


class SellersListView(generics.ListAPIView):
    serializer_class = serializers.SellerSerializer
    queryset = Seller.objects.all()


class SellerProductsListView(CoreProductList):
    serializer_class = serializers.ProductListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(stockrecords__partner_id=self.kwargs["seller_id"])
        return qs


class ProductDetailView(CoreProductDetail):
    pass
