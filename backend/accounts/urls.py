from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import (
    CustomTokenObtainPairView,
    CurrentUserView,
    LogoutView,
    PasswordChangeView,
    PasswordResetRequestView,
    UserProfileDetailView,
    UserRegistrationView,
)

app_name = 'accounts'

urlpatterns = [
    # Token endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    # User registration
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    # User profile endpoints
    path('auth/current-user/', CurrentUserView.as_view(), name='current_user'),
    path('profile/<int:id>/', UserProfileDetailView.as_view(), name='profile_detail'),
    # Password management
    path('auth/password-change/', PasswordChangeView.as_view(), name='password_change'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
]
