from django.db import transaction
from django.utils import timezone

from appointments.models import Appointment
from services.models import Service


class AppointmentServiceError(Exception):
    """Base exception for appointment business operations."""


class InvalidAppointmentStatus(AppointmentServiceError):
    """Raised when an invalid appointment status is requested."""


class ServiceInactiveError(AppointmentServiceError):
    """Raised when a service is inactive for appointment assignment."""


class AppointmentTerminalStateError(AppointmentServiceError):
    """Raised when an appointment in a terminal state cannot be modified."""


class AppointmentService:
    """Encapsulates business operations for appointment lifecycle management."""

    @classmethod
    def create_appointment(
        cls,
        full_name: str,
        email: str,
        service: Service,
        preferred_date,
        preferred_time=None,
        phone: str = '',
        company: str = '',
        budget_range: str = Appointment.BudgetChoices.UNDER_500,
        project_summary: str = '',
        notes: str = '',
    ) -> Appointment:
        """Create a new appointment while validating service availability."""
        if not service.is_active:
            raise ServiceInactiveError('Cannot create appointments for an inactive service.')

        with transaction.atomic():
            appointment = Appointment.objects.create(
                full_name=full_name,
                email=email,
                phone=phone,
                company=company,
                service=service,
                preferred_date=preferred_date,
                preferred_time=preferred_time,
                budget_range=budget_range,
                project_summary=project_summary,
                notes=notes,
            )
            return appointment

    @classmethod
    def update_status(cls, appointment: Appointment, status: str) -> Appointment:
        """Update the status of an appointment, enforcing terminal-state rules."""
        valid_statuses = [choice.value for choice in Appointment.StatusChoices]
        if status not in valid_statuses:
            raise InvalidAppointmentStatus(f'Status {status} is not valid.')

        if appointment.status == status:
            raise AppointmentServiceError('Appointment already has the requested status.')

        if appointment.status in {
            Appointment.StatusChoices.COMPLETED,
            Appointment.StatusChoices.CANCELLED,
            Appointment.StatusChoices.REJECTED,
        }:
            raise AppointmentTerminalStateError('Cannot change status of a terminal appointment.')

        appointment.status = status
        appointment.save(update_fields=['status'])
        return appointment

    @classmethod
    def assign_service(cls, appointment: Appointment, service: Service) -> Appointment:
        """Assign or reassign a service to an appointment."""
        if not service.is_active:
            raise ServiceInactiveError('Cannot assign an inactive service to an appointment.')

        if appointment.status in {
            Appointment.StatusChoices.COMPLETED,
            Appointment.StatusChoices.CANCELLED,
            Appointment.StatusChoices.REJECTED,
        }:
            raise AppointmentTerminalStateError('Cannot reassign service for a terminal appointment.')

        appointment.service = service
        appointment.save(update_fields=['service'])
        return appointment
