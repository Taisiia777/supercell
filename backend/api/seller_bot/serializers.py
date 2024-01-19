from api.davdamer.serializers import OrderDetailSerializer


class SellerOrderSerializer(OrderDetailSerializer):
    class Meta(OrderDetailSerializer.Meta):
        fields = [
            "number",
            "status",
            "total_incl_tax",
            "seller",
            "lines",
            "date_placed",
        ]
