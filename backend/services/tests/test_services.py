from django.core.exceptions import ValidationError
from django.test import TestCase

from appointments.models import Appointment
from core.test_utils import auth_client, create_appointment, create_service, create_staff, create_user, future_date
from services.models import Service
from services.serializers import ServiceSerializer
from services.services import ActiveServiceAppointmentError, ServiceAlreadyActive, ServiceAlreadyInactive, ServiceCatalog


class ServiceModelTests(TestCase):
    def test_service_creation_string_and_price_validator(self):
        service = create_service()
        invalid = Service(title='Invalid', slug='invalid', starting_price='-1.00')

        self.assertEqual(str(service), 'Web Development')
        with self.assertRaises(ValidationError):
            invalid.full_clean()


class ServiceCatalogTests(TestCase):
    def test_activate_and_deactivate_service(self):
        service = create_service(is_active=False)

        ServiceCatalog.activate_service(service)
        service.refresh_from_db()
        self.assertTrue(service.is_active)

        ServiceCatalog.deactivate_service(service)
        service.refresh_from_db()
        self.assertFalse(service.is_active)

    def test_invalid_activation_states_raise(self):
        active = create_service()
        inactive = create_service(title='Inactive', slug='inactive', is_active=False)

        with self.assertRaises(ServiceAlreadyActive):
            ServiceCatalog.activate_service(active)
        with self.assertRaises(ServiceAlreadyInactive):
            ServiceCatalog.deactivate_service(inactive)

    def test_deactivate_with_future_active_appointment_raises(self):
        service = create_service()
        create_appointment(service=service, status=Appointment.StatusChoices.PENDING, preferred_date=future_date())

        with self.assertRaises(ActiveServiceAppointmentError):
            ServiceCatalog.deactivate_service(service)


class ServiceSerializerTests(TestCase):
    def test_service_serializer_validates_price_and_required_fields(self):
        valid = ServiceSerializer(data={'title': 'Design', 'slug': 'design', 'starting_price': '50.00'})
        invalid = ServiceSerializer(data={'title': 'Design', 'slug': 'design', 'starting_price': '-1.00'})

        self.assertTrue(valid.is_valid(), valid.errors)
        self.assertFalse(invalid.is_valid())
        self.assertIn('starting_price', invalid.errors)


class ServiceAPITests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.staff = create_staff()
        self.service = create_service()

    def test_public_can_list_active_services(self):
        response = self.client.get('/api/v1/services/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)

    def test_non_staff_cannot_create_service(self):
        response = auth_client(self.user).post(
            '/api/v1/services/',
            {'title': 'Blocked', 'slug': 'blocked', 'starting_price': '20.00'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)

    def test_staff_can_crud_and_activate_service(self):
        client = auth_client(self.staff)
        create = client.post(
            '/api/v1/services/',
            {'title': 'Audit', 'slug': 'audit', 'starting_price': '75.00', 'is_active': False},
            format='json',
        )
        self.assertEqual(create.status_code, 201)

        detail = f"/api/v1/services/{create.data['id']}/"
        activate = client.post(f'{detail}activate/', {}, format='json')
        self.assertEqual(activate.status_code, 200)
        self.assertTrue(activate.data['is_active'])

        delete = client.delete(detail)
        self.assertEqual(delete.status_code, 204)
