from django.db import models
from django.db.models import Count, Value, Subquery, OuterRef
from django_filters import rest_framework as filters, OrderingFilter
from oscar.core.loading import get_model

Order = get_model("order", "Order")
Product = get_model("catalogue", "Product")
Seller = get_model("partner", "Seller")
OrderLine = get_model("order", "Line")


class OrderFilter(filters.FilterSet):
    date = filters.DateFilter(field_name="date_placed", lookup_expr="date")

    ordering = OrderingFilter(
        fields=(
            "number",
            "date_placed",
            "status",
            ("user__first_name", "user"),
            ("total_incl_tax", "total"),
        )
    )

    class Meta:
        model = Order
        fields = ["status", "seller", "date"]


class ProductOrderingFilter(OrderingFilter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.extra["choices"] += [
            ("orders_count", "Количество заказов"),
            ("-orders_count", "Количество заказов (descending)"),
        ]

    def filter(self, qs, value):
        qs = qs.annotate(
            orders_count=Subquery(
                OrderLine.objects.filter(product=OuterRef("pk"))
                .order_by()
                .values("product")
                .annotate(cnt=Count("order", distinct=True))
                .values("cnt"),
                output_field=models.IntegerField(),
            )
        )
        return super().filter(qs, value)


class ProductFilter(filters.FilterSet):
    category = filters.CharFilter(
        field_name="categories__name", lookup_expr="icontains"
    )

    ordering = ProductOrderingFilter(
        fields=("title", "description", ("seller__name", "seller")),
    )

    class Meta:
        model = Product
        fields = ["seller", "category"]


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
