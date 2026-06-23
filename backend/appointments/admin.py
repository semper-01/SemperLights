from django.contrib import admin

from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
	list_display = ('full_name', 'service', 'preferred_date', 'status', 'created_at')
	list_filter = ('status', 'service')
	search_fields = ('full_name', 'email', 'company')
	ordering = ('-created_at',)
	readonly_fields = ('created_at', 'updated_at')
	autocomplete_fields = ('service',)
