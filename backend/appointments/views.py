from rest_framework import filters, permissions, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.permissions import IsStaff, IsStaffOrCreate
from appointments.models import Appointment
from appointments.serializers import AppointmentSerializer
from appointments.services import AppointmentService


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('full_name', 'email')
    ordering_fields = ('created_at', 'updated_at', 'preferred_date')
    ordering = ('-created_at',)
    authentication_classes = [SessionAuthentication, JWTAuthentication]
    permission_classes = [IsStaffOrCreate]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            queryset = super().get_queryset()
        else:
            queryset = Appointment.objects.none()
        status = self.request.query_params.get('status')
        preferred_date = self.request.query_params.get('preferred_date')
        service = self.request.query_params.get('service')
        if status is not None:
            queryset = queryset.filter(status=status)
        if preferred_date is not None:
            queryset = queryset.filter(preferred_date=preferred_date)
        if service is not None:
            queryset = queryset.filter(service_id=service)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            appointment = AppointmentService.create_appointment(**serializer.validated_data)
        except Exception as exc:
            raise ValidationError({'detail': str(exc)})
        serializer.instance = appointment
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def update_status(self, request, pk=None):
        appointment = self.get_object()
        status_value = request.data.get('status')
        if not status_value:
            raise ValidationError({'status': 'This field is required.'})
        try:
            appointment = AppointmentService.update_status(appointment, status_value)
        except Exception as exc:
            raise ValidationError({'detail': str(exc)})
        return Response(self.get_serializer(appointment).data)

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def assign_service(self, request, pk=None):
        appointment = self.get_object()
        service_id = request.data.get('service')
        if not service_id:
            raise ValidationError({'service': 'This field is required.'})
        try:
            from services.models import Service

            service = Service.objects.get(pk=service_id)
            appointment = AppointmentService.assign_service(appointment, service)
        except Service.DoesNotExist:
            raise ValidationError({'service': 'Service not found.'})
        except Exception as exc:
            raise ValidationError({'detail': str(exc)})
        return Response(self.get_serializer(appointment).data)
