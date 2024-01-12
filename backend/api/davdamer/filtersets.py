from django_filters import rest_framework as filters
from oscar.core.loading import get_model

Order = get_model("order", "Order")


class OrderFilter(filters.FilterSet):
    class Meta:
        model = Order
        fields = ["status", "seller"]
