from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BlogCategoryViewSet, BlogPostViewSet

router = DefaultRouter()
router.register('categories', BlogCategoryViewSet, basename='blogcategory')
router.register('posts', BlogPostViewSet, basename='blogpost')

urlpatterns = [
    path('', include(router.urls)),
]
