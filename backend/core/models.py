from django.db import models
from django.core.validators import validate_email, URLValidator


class TimestampedModel(models.Model):
	"""Abstract base model that provides self-updating `created_at` and `updated_at` fields."""

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		abstract = True


class SiteSetting(TimestampedModel):
	"""Global site settings. Only one instance should exist."""

	site_name = models.CharField(max_length=255)
	tagline = models.CharField(max_length=255, blank=True)
	logo = models.ImageField(upload_to='site/', blank=True, null=True)
	favicon = models.ImageField(upload_to='site/', blank=True, null=True)
	email = models.EmailField(validators=[validate_email], blank=True)
	phone = models.CharField(max_length=50, blank=True)
	location = models.CharField(max_length=255, blank=True)

	linkedin = models.URLField(blank=True, validators=[URLValidator()])
	github = models.URLField(blank=True, validators=[URLValidator()])
	instagram = models.URLField(blank=True, validators=[URLValidator()])
	x = models.URLField(blank=True, validators=[URLValidator()])
	youtube = models.URLField(blank=True, validators=[URLValidator()])

	footer_text = models.TextField(blank=True)

	class Meta:
		verbose_name = 'Site Setting'
		verbose_name_plural = 'Site Settings'

	def __str__(self):
		return self.site_name

	def save(self, *args, **kwargs):
		# Ensure only one SiteSetting exists
		if not self.pk and SiteSetting.objects.exists():
			raise ValueError('Only one SiteSetting instance is allowed')
		return super().save(*args, **kwargs)
