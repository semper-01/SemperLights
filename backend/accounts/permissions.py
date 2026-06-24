from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Permission class to check if the requesting user is the object owner.
    
    The object must have an 'owner' or 'user' attribute that matches
    the current authenticated user.
    """

    def has_object_permission(self, request, view, obj):
        """Check if the requesting user owns the object."""
        owner = getattr(obj, 'owner', None) or getattr(obj, 'user', None)
        return owner == request.user


class IsStaff(BasePermission):
    """Permission class to check if the user is staff."""

    def has_permission(self, request, view):
        """Check if the user is staff."""
        return request.user and request.user.is_authenticated and request.user.is_staff


class IsAdmin(BasePermission):
    """Permission class to check if the user is an admin/superuser."""

    def has_permission(self, request, view):
        """Check if the user is a superuser."""
        return request.user and request.user.is_authenticated and request.user.is_superuser


class ReadOnlyOrAuthenticated(BasePermission):
    """
    Permission class allowing read-only access for all users,
    but write access only for authenticated users.
    """

    def has_permission(self, request, view):
        """Allow GET requests for all users, other methods for authenticated users."""
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user and request.user.is_authenticated
