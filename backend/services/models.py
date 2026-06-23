from django.db import models
from django.core.validators import MinValueValidator

from core.models import TimestampedModel


class Service(TimestampedModel):
	title = models.CharField(max_length=255)
	slug = models.SlugField(max_length=255, unique=True)
	description = models.TextField(blank=True)
	icon = models.ImageField(upload_to='services/icons/', blank=True, null=True)
	starting_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
	estimated_duration = models.CharField(max_length=100, blank=True)
	is_active = models.BooleanField(default=True)

	class Meta:
		verbose_name = 'Service'
		verbose_name_plural = 'Services'
		ordering = ('title',)

	def __str__(self):
		return self.title
