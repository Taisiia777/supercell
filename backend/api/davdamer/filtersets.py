from django.db.models import Count, Value
from django_filters import rest_framework as filters, OrderingFilter
from oscar.core.loading import get_model

Order = get_model("order", "Order")
Product = get_model("catalogue", "Product")
Seller = get_model("partner", "Seller")


class OrderFilter(filters.FilterSet):
    class Meta:
        model = Order
        fields = ["status", "seller"]


class ProductFilter(filters.FilterSet):
    class Meta:
        model = Product
        fields = ["seller"]


class SellerOrderingFilter(OrderingFilter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.extra["choices"] += [
            ("products_amount", "Количество товаров"),
            ("-products_amount", "Количество товаров (descending)"),
            ("orders_total", "Сумма заказов"),
            ("-orders_total", "Сумма заказов (descending)"),
        ]

    def filter(self, qs, value):
        queryset = qs.annotate(products_amount=Count("products"), orders_total=Value(0))
        return super().filter(queryset, value)


class SellerFilter(filters.FilterSet):
    city = filters.CharFilter(field_name="city__name", lookup_expr="icontains")
    market = filters.CharFilter(lookup_expr="icontains")
    country = filters.CharFilter(lookup_expr="icontains")
    address = filters.CharFilter(lookup_expr="icontains")

    ordering = SellerOrderingFilter(
        fields=(
            "name",
            "registered_dt",
            "address",
            "description",
            "rating",
        ),
    )

    class Meta:
        model = Seller
        fields = ["country", "city", "market", "address"]
