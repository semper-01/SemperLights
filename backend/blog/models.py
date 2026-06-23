from django.db import models
from django.core.validators import URLValidator
from django.utils import timezone

from core.models import TimestampedModel
from accounts.models import User


class BlogCategory(models.Model):
	name = models.CharField(max_length=150)
	slug = models.SlugField(max_length=150, unique=True, db_index=True)

	class Meta:
		verbose_name = 'Blog Category'
		verbose_name_plural = 'Blog Categories'
		ordering = ('name',)

	def __str__(self):
		return self.name


class BlogPost(TimestampedModel):
	STATUS_DRAFT = 'draft'
	STATUS_PUBLISHED = 'published'

	STATUS_CHOICES = [
		(STATUS_DRAFT, 'Draft'),
		(STATUS_PUBLISHED, 'Published'),
	]

	title = models.CharField(max_length=255)
	slug = models.SlugField(max_length=255, unique=True, db_index=True)
	excerpt = models.TextField(blank=True)
	content = models.TextField(blank=True)
	featured_image = models.ImageField(upload_to='blog/images/', blank=True, null=True)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True)
	published_at = models.DateTimeField(null=True, blank=True)

	author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
	category = models.ForeignKey(BlogCategory, on_delete=models.PROTECT, related_name='posts')

	class Meta:
		verbose_name = 'Blog Post'
		verbose_name_plural = 'Blog Posts'
		ordering = ('-published_at', 'title')
		indexes = [
			models.Index(fields=['slug']),
			models.Index(fields=['status']),
			models.Index(fields=['published_at']),
		]

	def __str__(self):
		return self.title

