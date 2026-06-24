from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsStaff
from .models import Service
from .serializers import ServiceSerializer
from .services import ServiceCatalog


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('title', 'description')
    ordering_fields = ('created_at', 'updated_at', 'title')
    ordering = ('title',)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            queryset = queryset.filter(is_active=True)
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(is_active=active.lower() in ('1', 'true', 'yes'))
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def activate(self, request, pk=None):
        service = self.get_object()
        service = ServiceCatalog.activate_service(service)
        return Response(self.get_serializer(service).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def deactivate(self, request, pk=None):
        service = self.get_object()
        service = ServiceCatalog.deactivate_service(service)
        return Response(self.get_serializer(service).data)
