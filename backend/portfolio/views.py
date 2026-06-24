from django.shortcuts import get_object_or_404
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsStaff
from .models import Category, Project, ProjectImage, Technology
from .serializers import CategorySerializer, ProjectImageSerializer, ProjectSerializer, TechnologySerializer
from .services import PortfolioService


class ReadPublicCreateStaffMixin:
    """Mixin to allow public read access and staff-only writes."""

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsStaff()]


class CategoryViewSet(ReadPublicCreateStaffMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name',)
    ordering_fields = ('name',)
    ordering = ('name',)


class TechnologyViewSet(ReadPublicCreateStaffMixin, viewsets.ModelViewSet):
    queryset = Technology.objects.all()
    serializer_class = TechnologySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name',)
    ordering_fields = ('name',)
    ordering = ('name',)


class ProjectViewSet(ReadPublicCreateStaffMixin, viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'short_description', 'full_description')
    ordering_fields = ('created_at', 'updated_at', 'title', 'display_order')
    ordering = ('-featured', 'display_order', '-created_at')

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not (user.is_authenticated and user.is_staff):
            queryset = queryset.filter(status=Project.STATUS_PUBLISHED)
        category = self.request.query_params.get('category')
        technology = self.request.query_params.get('technology')
        featured = self.request.query_params.get('featured')
        status = self.request.query_params.get('status')
        if category is not None:
            queryset = queryset.filter(category_id=category)
        if technology is not None:
            queryset = queryset.filter(technologies__id=technology)
        if featured is not None:
            queryset = queryset.filter(featured=featured.lower() in ('1', 'true', 'yes'))
        if status is not None:
            queryset = queryset.filter(status=status)
        return queryset.distinct()

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def publish(self, request, pk=None):
        project = self.get_object()
        project = PortfolioService.publish_project(project)
        return Response(self.get_serializer(project).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def unpublish(self, request, pk=None):
        project = self.get_object()
        project = PortfolioService.unpublish_project(project)
        return Response(self.get_serializer(project).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def feature(self, request, pk=None):
        project = self.get_object()
        project = PortfolioService.feature_project(project)
        return Response(self.get_serializer(project).data)


class ProjectImageNestedViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectImageSerializer
    permission_classes = [IsStaff]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ('display_order',)
    ordering = ('display_order',)

    def get_queryset(self):
        project_pk = self.kwargs.get('project_pk')
        return ProjectImage.objects.filter(project_id=project_pk)

    def perform_create(self, serializer):
        project_pk = self.kwargs.get('project_pk')
        project = get_object_or_404(Project, pk=project_pk)
        serializer.save(project=project)
