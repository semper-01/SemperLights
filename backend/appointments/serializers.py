from rest_framework import serializers

from appointments.models import Appointment
from services.models import Service


class AppointmentSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all())

    class Meta:
        model = Appointment
        fields = (
            'id',
            'full_name',
            'email',
            'phone',
            'company',
            'service',
            'preferred_date',
            'preferred_time',
            'budget_range',
            'project_summary',
            'status',
            'notes',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'status', 'created_at', 'updated_at')
