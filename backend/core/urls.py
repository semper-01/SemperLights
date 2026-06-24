from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SiteSettingViewSet

router = DefaultRouter()
router.register('site-settings', SiteSettingViewSet, basename='sitesetting')

urlpatterns = [
    path('', include(router.urls)),
]
