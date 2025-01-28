from rest_framework import permissions
from core.models import Role

class RolePermissionMixin:
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.roles.filter(name__in=self.allowed_roles).exists()

class AdminPermission(RolePermissionMixin):
    allowed_roles = [Role.ADMIN]

class OrderManagerPermission(RolePermissionMixin):
    allowed_roles = [Role.ADMIN, Role.ORDER_MANAGER]

class ProductManagerPermission(RolePermissionMixin):
    allowed_roles = [Role.ADMIN, Role.PRODUCT_MANAGER]