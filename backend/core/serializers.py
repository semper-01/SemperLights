from rest_framework import serializers

from .models import SiteSetting


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = (
            'id',
            'site_name',
            'tagline',
            'logo',
            'favicon',
            'email',
            'phone',
            'location',
            'linkedin',
            'github',
            'instagram',
            'x',
            'youtube',
            'footer_text',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
