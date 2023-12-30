from oscar.core.loading import get_model
from rest_framework import permissions


Seller = get_model("partner", "Seller")
Product = get_model("catalogue", "Product")


class IsDavDamer(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.user.is_anonymous:
            return False
        if not hasattr(request.user, "davdamer"):
            return False
        if request.user.davdamer is None:
            return False

        return True


class IsSellerOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        seller_id = view.kwargs.get("seller_id")
        if seller_id is None:
            return False

        return Seller.objects.filter(
            pk=seller_id, davdamer=request.user.davdamer
        ).exists()

    def has_object_permission(self, request, view, seller) -> bool:
        return seller.davdamer == request.user.davdamer


class IsProductOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        product_id = view.kwargs.get("product_id")
        if product_id is None:
            return False

        return Product.objects.filter(
            pk=product_id, seller__davdamer__user=request.user
        ).exists()

    def has_object_permission(self, request, view, product) -> bool:
        return Product.objects.filter(
            pk=product.pk, seller__davdamer__user=request.user
        ).exists()
