from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProjectImageNestedViewSet, ProjectViewSet, TechnologyViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('technologies', TechnologyViewSet, basename='technology')
router.register('projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    path('projects/<int:project_pk>/images/', ProjectImageNestedViewSet.as_view({
        'get': 'list',
        'post': 'create',
    }), name='projectimage-list'),
    path('projects/<int:project_pk>/images/<int:pk>/', ProjectImageNestedViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    }), name='projectimage-detail'),
]
