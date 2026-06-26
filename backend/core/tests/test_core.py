from django.conf import settings
from django.core.cache import cache
from django.db import IntegrityError
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from config.throttling import AuthenticationEndpointRateThrottle
from core.models import SiteSetting
from core.serializers import SiteSettingSerializer
from core.test_utils import create_project, create_service, create_user


class SiteSettingModelTests(TestCase):
    def test_site_setting_creation_string_and_singleton_constraint(self):
        setting = SiteSetting.objects.create(site_name='Semper Lights', email='info@example.com')

        self.assertEqual(str(setting), 'Semper Lights')
        with self.assertRaises(ValueError):
            SiteSetting.objects.create(site_name='Another')

    def test_singleton_database_constraint(self):
        SiteSetting.objects.create(site_name='Semper Lights')

        with self.assertRaises(IntegrityError):
            SiteSetting.objects.bulk_create([SiteSetting(site_name='Another', singleton_enforcer=True)])


class SiteSettingSerializerTests(TestCase):
    def test_serializer_validates_email_and_read_only_fields(self):
        serializer = SiteSettingSerializer(
            data={
                'site_name': 'Semper Lights',
                'email': 'info@example.com',
                'created_at': '2000-01-01T00:00:00Z',
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        setting = serializer.save()
        self.assertEqual(setting.site_name, 'Semper Lights')

    def test_serializer_rejects_invalid_url(self):
        serializer = SiteSettingSerializer(data={'site_name': 'Semper Lights', 'github': 'not-a-url'})

        self.assertFalse(serializer.is_valid())
        self.assertIn('github', serializer.errors)


class CoreAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_site_settings_public_read_only(self):
        SiteSetting.objects.create(site_name='Semper Lights')

        list_response = self.client.get('/api/v1/site-settings/')
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(list_response.data['count'], 1)

        create_response = self.client.post('/api/v1/site-settings/', {'site_name': 'Blocked'}, format='json')
        self.assertEqual(create_response.status_code, 405)

    def test_health_endpoint_returns_expected_structure(self):
        response = self.client.get('/api/v1/health/')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['data']['database'], 'connected')
        self.assertIn('application_status', response.data['data'])
        self.assertIn('django_version', response.data['data'])
        self.assertIn('application_version', response.data['data'])
        self.assertIn('timestamp', response.data['data'])

    def test_openapi_schema_swagger_and_redoc_endpoints(self):
        schema = self.client.get('/api/v1/schema/')
        swagger = self.client.get('/api/v1/docs/swagger/')
        redoc = self.client.get('/api/v1/docs/redoc/')

        self.assertEqual(schema.status_code, 200)
        self.assertEqual(swagger.status_code, 200)
        self.assertEqual(redoc.status_code, 200)


class PaginationTests(TestCase):
    def test_default_pagination_and_page_size(self):
        for index in range(12):
            create_service(title=f'Service {index}', slug=f'service-{index}')

        response = self.client.get('/api/v1/services/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 12)
        self.assertEqual(len(response.data['results']), settings.REST_FRAMEWORK['PAGE_SIZE'])

    def test_invalid_page_request_returns_404(self):
        create_project()

        response = self.client.get('/api/v1/projects/?page=999')

        self.assertEqual(response.status_code, 404)


class ThrottlingTests(TestCase):
    def setUp(self):
        cache.clear()

    def configure_throttle(self, throttle):
        throttle.num_requests = 2
        throttle.duration = 60
        return throttle

    def test_anonymous_throttle_limit(self):
        client = APIClient()
        request = client.get('/api/v1/services/').wsgi_request
        request.META['REMOTE_ADDR'] = '10.0.0.1'
        throttle = self.configure_throttle(AnonRateThrottle())

        self.assertTrue(throttle.allow_request(request, None))
        self.assertTrue(throttle.allow_request(request, None))
        self.assertFalse(throttle.allow_request(request, None))

    def test_authenticated_throttle_limit(self):
        user = create_user()
        client = APIClient()
        request = client.get('/api/v1/services/').wsgi_request
        request.META['REMOTE_ADDR'] = '10.0.0.2'
        request.user = user
        throttle = self.configure_throttle(UserRateThrottle())

        self.assertTrue(throttle.allow_request(request, None))
        self.assertTrue(throttle.allow_request(request, None))
        self.assertFalse(throttle.allow_request(request, None))

    def test_authentication_endpoint_throttle_limit(self):
        client = APIClient()
        request = client.post('/api/v1/auth/login/').wsgi_request
        request.META['REMOTE_ADDR'] = '10.0.0.3'
        throttle = self.configure_throttle(AuthenticationEndpointRateThrottle())

        self.assertTrue(throttle.allow_request(request, None))
        self.assertTrue(throttle.allow_request(request, None))
        self.assertFalse(throttle.allow_request(request, None))

    def test_authentication_throttle_ignores_non_auth_paths(self):
        request = APIClient().get('/api/v1/services/').wsgi_request

        self.assertIsNone(AuthenticationEndpointRateThrottle().get_cache_key(request, None))
