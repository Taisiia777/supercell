from oscar.core.loading import get_model
from rest_framework import permissions


Seller = get_model("partner", "Seller")


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
