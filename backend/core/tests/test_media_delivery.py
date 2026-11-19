from io import BytesIO
import tempfile

from PIL import Image
from django.core.exceptions import ImproperlyConfigured
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import SimpleTestCase, override_settings

from accounts.models import User
from accounts.serializers import UserProfileSerializer
from config.media import get_production_media_url
from portfolio.models import Technology
from portfolio.serializers import TechnologySerializer
from services.models import Service
from services.serializers import ServiceSerializer


def png_bytes(color):
    image = Image.new('RGB', (1, 1), color)
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    return buffer.getvalue()


class ProductionMediaUrlTests(SimpleTestCase):
    def test_requires_an_absolute_https_media_url(self):
        self.assertEqual(
            get_production_media_url('https://api.example.test/media'),
            'https://api.example.test/media/',
        )

        invalid_urls = (
            '',
            '/media/',
            'http://api.example.test/media/',
            'https://cdn.example.test/images/',
        )
        for invalid_url in invalid_urls:
            with self.subTest(url=invalid_url):
                with self.assertRaises(ImproperlyConfigured):
                    get_production_media_url(invalid_url)

    @override_settings(MEDIA_URL='https://api.example.test/media/')
    def test_image_fields_serialize_with_the_canonical_media_origin(self):
        user = User(
            id=1,
            username='founder',
            email='founder@example.test',
            first_name='Site',
            last_name='Owner',
        )
        user.profile_image.name = 'profiles/founder.png'

        service = Service(
            id=1,
            title='Consulting',
            slug='consulting',
            description='',
            starting_price='100',
            estimated_duration='',
        )
        service.icon.name = 'services/icons/consulting.svg'

        technology = Technology(id=1, name='Python', website='')
        technology.icon.name = 'technologies/python.svg'

        self.assertEqual(
            UserProfileSerializer(user).data['profile_image'],
            'https://api.example.test/media/profiles/founder.png',
        )
        self.assertEqual(
            ServiceSerializer(service).data['icon'],
            'https://api.example.test/media/services/icons/consulting.svg',
        )
        self.assertEqual(
            TechnologySerializer(technology).data['icon'],
            'https://api.example.test/media/technologies/python.svg',
        )


class MediaDeliveryTests(SimpleTestCase):
    def test_uploaded_and_updated_images_are_served_with_their_content_type(self):
        first_image = png_bytes((255, 0, 0))
        updated_image = png_bytes((0, 0, 255))

        with tempfile.TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root, MEDIA_URL='/media/'):
                original_name = default_storage.save(
                    'profiles/founder.png', ContentFile(first_image)
                )
                updated_name = default_storage.save(
                    'profiles/founder.png', ContentFile(updated_image)
                )

                self.assertNotEqual(original_name, updated_name)
                response = self.client.get(f'/media/{updated_name}')

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response['Content-Type'], 'image/png')
                self.assertEqual(b''.join(response.streaming_content), updated_image)

    def test_svg_media_is_served_as_svg(self):
        image = b'<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'

        with tempfile.TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root, MEDIA_URL='/media/'):
                name = default_storage.save(
                    'services/icons/example.svg', ContentFile(image)
                )
                response = self.client.get(f'/media/{name}')

                self.assertEqual(response.status_code, 200)
                self.assertEqual(response['Content-Type'], 'image/svg+xml')
                self.assertEqual(b''.join(response.streaming_content), image)

    def test_missing_media_returns_404_instead_of_spa_or_html(self):
        response = self.client.get('/media/profiles/missing.png')

        self.assertEqual(response.status_code, 404)

    def test_media_path_traversal_is_rejected(self):
        response = self.client.get('/media/%2E%2E/secret.txt')

        self.assertEqual(response.status_code, 404)
