from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user.is_authenticated
            and (request.user.role == "admin" or request.user.is_superuser)
        )


class IsSelfOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = getattr(obj, "user", obj)
        return request.user == user or request.user.role == "admin" or request.user.is_superuser
