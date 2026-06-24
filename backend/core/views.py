from django import VERSION as DJANGO_VERSION
from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import api_view, permission_classes

from .models import SiteSetting
from .serializers import SiteSettingSerializer
from .utils import StandardResponse


class SiteSettingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SiteSetting.objects.all()
    serializer_class = SiteSettingSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Return application and database health metadata."""
    database_status = 'connected'

    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
    except Exception:
        database_status = 'disconnected'

    django_version = '.'.join(str(part) for part in DJANGO_VERSION[:3])

    return StandardResponse.success(
        data={
            'application_status': 'ok' if database_status == 'connected' else 'degraded',
            'database': database_status,
            'django_version': django_version,
            'application_version': settings.APPLICATION_VERSION,
            'timestamp': timezone.now().isoformat(),
        },
        message='Health check completed',
    )
