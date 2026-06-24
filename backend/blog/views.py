from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsStaff
from .models import BlogCategory, BlogPost
from .serializers import BlogCategorySerializer, BlogPostSerializer
from .services import BlogService


class ReadOnlyPublicMixin:
    """Read-only access for public users and staff-only writes."""

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsStaff()]


class BlogCategoryViewSet(ReadOnlyPublicMixin, viewsets.ModelViewSet):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name',)
    ordering_fields = ('name',)
    ordering = ('name',)


class BlogPostViewSet(ReadOnlyPublicMixin, viewsets.ModelViewSet):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'excerpt', 'content')
    ordering_fields = ('created_at', 'updated_at', 'title', 'published_at')
    ordering = ('-published_at',)

    def get_queryset(self):
        queryset = super().get_queryset()
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(status=BlogPost.STATUS_PUBLISHED)
        category = self.request.query_params.get('category')
        status = self.request.query_params.get('status')
        published_at = self.request.query_params.get('published_at')
        if category is not None:
            queryset = queryset.filter(category_id=category)
        if status is not None:
            queryset = queryset.filter(status=status)
        if published_at is not None:
            queryset = queryset.filter(published_at=published_at)
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def publish(self, request, pk=None):
        post = self.get_object()
        post = BlogService.publish_post(post)
        return Response(self.get_serializer(post).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def unpublish(self, request, pk=None):
        post = self.get_object()
        post = BlogService.unpublish_post(post)
        return Response(self.get_serializer(post).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def archive(self, request, pk=None):
        post = self.get_object()
        post = BlogService.archive_post(post)
        return Response(self.get_serializer(post).data)
