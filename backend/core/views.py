from rest_framework import permissions, viewsets

from .models import SiteSetting
from .serializers import SiteSettingSerializer


class SiteSettingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SiteSetting.objects.all()
    serializer_class = SiteSettingSerializer
    permission_classes = [permissions.AllowAny]
