from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured


def get_production_media_url(value):
    media_url = (value or '').strip()
    parsed = urlsplit(media_url)

    if (
        parsed.scheme != 'https'
        or not parsed.netloc
        or parsed.username
        or parsed.password
        or parsed.path.rstrip('/') != '/media'
        or parsed.query
        or parsed.fragment
    ):
        raise ImproperlyConfigured(
            'MEDIA_URL must be an absolute HTTPS URL ending in /media/.'
        )

    return f'{media_url.rstrip("/")}/'
