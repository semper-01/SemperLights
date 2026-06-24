from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SiteSettingViewSet, health_check

router = DefaultRouter()
router.register('site-settings', SiteSettingViewSet, basename='sitesetting')

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('', include(router.urls)),
]
