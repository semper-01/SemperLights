from django.db import transaction
from django.utils import timezone

from .models import Service


class ServiceCatalogError(Exception):
    """Base exception for service catalog operations."""


class ServiceAlreadyActive(ServiceCatalogError):
    """Raised when an active service is activated again."""


class ServiceAlreadyInactive(ServiceCatalogError):
    """Raised when an inactive service is deactivated again."""


class ActiveServiceAppointmentError(ServiceCatalogError):
    """Raised when a service with active appointments cannot be deactivated."""


class ServiceCatalog:
    """Encapsulates business operations for service availability."""

    @classmethod
    def activate_service(cls, service: Service) -> Service:
        """Activate a service and make it available for booking."""
        if service.is_active:
            raise ServiceAlreadyActive('Service is already active.')

        service.is_active = True
        service.save(update_fields=['is_active'])
        return service

    @classmethod
    def deactivate_service(cls, service: Service) -> Service:
        """Deactivate a service after verifying there are no active future appointments."""
        if not service.is_active:
            raise ServiceAlreadyInactive('Service is already inactive.')

        from appointments.models import Appointment

        active_statuses = [
            Appointment.StatusChoices.PENDING,
            Appointment.StatusChoices.CONFIRMED,
        ]
        if service.appointments.filter(status__in=active_statuses, preferred_date__gte=timezone.localdate()).exists():
            raise ActiveServiceAppointmentError(
                'Cannot deactivate a service with active or pending future appointments.'
            )

        service.is_active = False
        service.save(update_fields=['is_active'])
        return service
