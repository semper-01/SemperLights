from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import validate_email

from core.models import TimestampedModel


class User(AbstractUser, TimestampedModel):
	"""Custom user model using email as the primary login identifier."""

	email = models.EmailField('email address', unique=True, validators=[validate_email])
	profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
	bio = models.TextField(blank=True)
	phone = models.CharField(max_length=50, blank=True)

	USERNAME_FIELD = 'email'
	REQUIRED_FIELDS = ['username']

	def __str__(self):
		return self.email or self.username

	class Meta:
		verbose_name = 'User'
		verbose_name_plural = 'Users'
