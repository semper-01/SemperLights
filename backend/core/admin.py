from django.contrib import admin

from .models import SiteSetting


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('site_name', 'email', 'phone', 'location', 'created_at')
    readonly_fields = ('created_at', 'updated_at', 'singleton_enforcer')
    fieldsets = (
        (None, {
            'fields': (
                'site_name',
                'tagline',
                'logo',
                'favicon',
                'email',
                'phone',
                'location',
            ),
        }),
        ('Social links', {
            'fields': ('linkedin', 'github', 'instagram', 'x', 'youtube'),
        }),
        ('Footer', {
            'fields': ('footer_text',),
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'singleton_enforcer'),
        }),
    )

    def has_add_permission(self, request):
        if SiteSetting.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False
