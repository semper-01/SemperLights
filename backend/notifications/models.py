from django.db import models
from django.utils import timezone

from core.models import TimestampedModel


class ContactMessage(models.Model):
	name = models.CharField(max_length=255)
	email = models.EmailField()
	subject = models.CharField(max_length=255)
	message = models.TextField()
	is_read = models.BooleanField(default=False)
	created_at = models.DateTimeField(default=timezone.now)

	class Meta:
		verbose_name = 'Contact Message'
		verbose_name_plural = 'Contact Messages'
		ordering = ('-created_at',)

	def __str__(self):
		return f"{self.name} - {self.subject}"


class NewsletterSubscriber(models.Model):
	email = models.EmailField(unique=True)
	is_active = models.BooleanField(default=True)
	subscribed_at = models.DateTimeField(default=timezone.now)

	class Meta:
		verbose_name = 'Newsletter Subscriber'
		verbose_name_plural = 'Newsletter Subscribers'
		ordering = ('-subscribed_at',)

	def __str__(self):
		return self.email
