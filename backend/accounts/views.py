from django.contrib.auth import get_user_model
from rest_framework import generics, status, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.permissions import IsOwner
from accounts.serializers import (
    CustomTokenObtainPairSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
)
from accounts.services import UserService, UserServiceError

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view.
    
    Returns access and refresh tokens on successful login.
    """

    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    User registration endpoint.
    
    POST /api/auth/register/ with email, username, password, password_confirm,
    first_name, and last_name to create a new user.
    """

    serializer_class = UserRegistrationSerializer
    permission_classes = []

    def perform_create(self, serializer):
        """Create user using UserService."""
        serializer.save()


class CurrentUserView(views.APIView):
    """
    Retrieve the current authenticated user's profile.
    
    GET /api/auth/current-user/ returns the profile of the authenticated user.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get(self, request, *args, **kwargs):
        """Return the current user's profile."""
        serializer = self.serializer_class(request.user)
        return Response(serializer.data)


class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    User profile detail view.
    
    GET /api/auth/profile/{id}/ to retrieve a user profile.
    PATCH /api/auth/profile/{id}/ to update the user's own profile.
    """

    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsOwner]
    lookup_field = 'id'

    def get_serializer_class(self):
        """Use different serializers for read and write operations."""
        if self.request.method in ('PUT', 'PATCH'):
            return UserProfileUpdateSerializer
        return UserProfileSerializer

    def get_object(self):
        """Ensure user can only view/edit their own profile."""
        obj = super().get_object()
        self.check_object_permissions(self.request, obj)
        return obj


class PasswordChangeView(views.APIView):
    """
    Password change endpoint.
    
    POST /api/auth/password-change/ with old_password and new_password
    to change the user's password.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Handle password change request."""
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(views.APIView):
    """
    Password reset request endpoint (foundation only).
    
    POST /api/auth/password-reset/ with email to request a password reset.
    Note: Email sending is not implemented; this endpoint validates the email
    and would trigger email sending in a real application.
    """

    permission_classes = []

    def post(self, request, *args, **kwargs):
        """Handle password reset request."""
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            return Response(
                {'detail': 'If the email exists, a password reset link will be sent.'},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(views.APIView):
    """
    Logout endpoint (foundation only).
    
    POST /api/auth/logout/ to invalidate the current token.
    Note: Token blacklist is not implemented; in production, use a token
    blacklist or rely on short token expiration.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Handle logout request."""
        return Response({'detail': 'Logout successful.'}, status=status.HTTP_200_OK)
