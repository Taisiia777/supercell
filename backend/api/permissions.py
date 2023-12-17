from rest_framework import permissions


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
    def has_object_permission(self, request, view, seller) -> bool:
        return seller.davdamer == request.user.davdamer
