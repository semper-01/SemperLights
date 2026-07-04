from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from appointments.models import Appointment, validate_not_past
from appointments.serializers import AppointmentSerializer
from appointments.services import (
    AppointmentService,
    AppointmentServiceError,
    AppointmentTerminalStateError,
    InvalidAppointmentStatus,
    ServiceInactiveError,
)
from core.test_utils import auth_client, create_appointment, create_service, create_staff, create_user, future_date


class AppointmentModelTests(TestCase):
    def test_appointment_creation_string_and_past_date_validator(self):
        service = create_service()
        appointment = create_appointment(service=service)

        self.assertEqual(str(appointment), 'Client User - Web Development')
        with self.assertRaises(ValidationError):
            validate_not_past(timezone.localdate() - timezone.timedelta(days=1))


class AppointmentServiceTests(TestCase):
    def test_create_appointment_success(self):
        service = create_service()
        appointment = AppointmentService.create_appointment(
            full_name='New Client',
            email='client@example.com',
            service=service,
            preferred_date=future_date(),
        )

        self.assertEqual(appointment.status, Appointment.StatusChoices.PENDING)
        self.assertEqual(appointment.service, service)

    def test_create_or_assign_inactive_service_raises(self):
        inactive = create_service(is_active=False)
        appointment = create_appointment()

        with self.assertRaises(ServiceInactiveError):
            AppointmentService.create_appointment(
                full_name='Blocked',
                email='blocked@example.com',
                service=inactive,
                preferred_date=future_date(),
            )
        with self.assertRaises(ServiceInactiveError):
            AppointmentService.assign_service(appointment, inactive)

    def test_update_status_success_and_invalid_transitions(self):
        appointment = create_appointment()

        AppointmentService.update_status(appointment, Appointment.StatusChoices.CONFIRMED)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, Appointment.StatusChoices.CONFIRMED)

        with self.assertRaises(AppointmentServiceError):
            AppointmentService.update_status(appointment, Appointment.StatusChoices.CONFIRMED)
        with self.assertRaises(InvalidAppointmentStatus):
            AppointmentService.update_status(appointment, 'invalid')

        appointment.status = Appointment.StatusChoices.COMPLETED
        appointment.save(update_fields=['status'])
        with self.assertRaises(AppointmentTerminalStateError):
            AppointmentService.update_status(appointment, Appointment.StatusChoices.CANCELLED)


class AppointmentSerializerTests(TestCase):
    def test_serializer_valid_input_and_read_only_status(self):
        service = create_service()
        serializer = AppointmentSerializer(
            data={
                'full_name': 'Serializer Client',
                'email': 'serializer@example.com',
                'service': service.id,
                'preferred_date': future_date().isoformat(),
                'status': Appointment.StatusChoices.CONFIRMED,
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        appointment = serializer.save()
        self.assertEqual(appointment.status, Appointment.StatusChoices.PENDING)

    def test_serializer_requires_service_and_valid_email(self):
        serializer = AppointmentSerializer(
            data={
                'full_name': 'Broken',
                'email': 'not-an-email',
                'preferred_date': future_date().isoformat(),
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        self.assertIn('service', serializer.errors)


class AppointmentAPITests(TestCase):
    def setUp(self):
        self.user = create_user(email='client@example.com', username='client')
        self.other = create_user(email='other-client@example.com', username='otherclient')
        self.staff = create_staff()
        self.service = create_service()
        self.appointment = create_appointment(service=self.service, email=self.user.email)

    def test_anonymous_can_create_but_not_list_appointments(self):
        self.assertEqual(self.client.get('/api/v1/appointments/').status_code, 403)
        response = self.client.post(
            '/api/v1/appointments/',
            {
                'full_name': 'Visitor Client',
                'email': 'visitor@example.com',
                'service': self.service.id,
                'preferred_date': future_date().isoformat(),
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)

    def test_authenticated_non_staff_user_can_create_but_not_list_appointments(self):
        client = auth_client(self.other)
        create = client.post(
            '/api/v1/appointments/',
            {
                'full_name': 'Other Client',
                'email': self.other.email,
                'service': self.service.id,
                'preferred_date': future_date().isoformat(),
            },
            format='json',
        )
        self.assertEqual(create.status_code, 201)

        listing = client.get('/api/v1/appointments/')
        self.assertEqual(listing.status_code, 403)

    def test_staff_can_update_status_and_delete(self):
        client = auth_client(self.staff)
        detail = f'/api/v1/appointments/{self.appointment.id}/'

        update_status = client.post(f'{detail}update_status/', {'status': Appointment.StatusChoices.CONFIRMED}, format='json')
        self.assertEqual(update_status.status_code, 200)
        self.assertEqual(update_status.data['status'], Appointment.StatusChoices.CONFIRMED)

        delete = client.delete(detail)
        self.assertEqual(delete.status_code, 204)

    def test_non_staff_cannot_patch_appointment(self):
        response = auth_client(self.user).patch(
            f'/api/v1/appointments/{self.appointment.id}/',
            {'notes': 'Nope'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
