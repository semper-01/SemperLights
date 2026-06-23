from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

from core.models import TimestampedModel


def validate_not_past(value):
	if value < timezone.localdate():
		raise ValidationError('Preferred date cannot be in the past')


class Appointment(TimestampedModel):
	class BudgetChoices(models.TextChoices):
		UNDER_500 = 'UNDER_500', 'Under 500'
		_500_TO_2000 = '500_TO_2000', '500 to 2000'
		_2000_TO_5000 = '2000_TO_5000', '2000 to 5000'
		OVER_5000 = 'OVER_5000', 'Over 5000'

	class StatusChoices(models.TextChoices):
		PENDING = 'pending', 'Pending'
		CONFIRMED = 'confirmed', 'Confirmed'
		COMPLETED = 'completed', 'Completed'
		CANCELLED = 'cancelled', 'Cancelled'
		REJECTED = 'rejected', 'Rejected'

	full_name = models.CharField(max_length=255)
	email = models.EmailField()
	phone = models.CharField(max_length=50, blank=True)
	company = models.CharField(max_length=255, blank=True)
	service = models.ForeignKey('services.Service', on_delete=models.PROTECT, related_name='appointments')
	preferred_date = models.DateField(validators=[validate_not_past])
	preferred_time = models.TimeField(null=True, blank=True)
	budget_range = models.CharField(max_length=50, choices=BudgetChoices.choices, default=BudgetChoices.UNDER_500)
	project_summary = models.TextField(blank=True)
	status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING, db_index=True)
	notes = models.TextField(blank=True)

	class Meta:
		verbose_name = 'Appointment'
		verbose_name_plural = 'Appointments'
		ordering = ('-created_at',)

	def __str__(self):
		return f"{self.full_name} - {self.service.title}"
