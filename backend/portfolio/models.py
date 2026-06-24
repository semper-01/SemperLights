from django.db import models

from core.models import TimestampedModel


class Category(models.Model):
	name = models.CharField(max_length=150, unique=True)
	slug = models.SlugField(max_length=150, unique=True)
	description = models.TextField(blank=True)

	class Meta:
		verbose_name = 'Category'
		verbose_name_plural = 'Categories'
		ordering = ('name',)

	def __str__(self):
		return self.name


class Technology(models.Model):
	name = models.CharField(max_length=150, unique=True)
	icon = models.ImageField(upload_to='technologies/', blank=True, null=True)
	website = models.URLField(blank=True)

	class Meta:
		verbose_name = 'Technology'
		verbose_name_plural = 'Technologies'
		ordering = ('name',)

	def __str__(self):
		return self.name


class Project(TimestampedModel):
	STATUS_DRAFT = 'draft'
	STATUS_PUBLISHED = 'published'
	STATUS_ARCHIVED = 'archived'

	STATUS_CHOICES = [
		(STATUS_DRAFT, 'Draft'),
		(STATUS_PUBLISHED, 'Published'),
		(STATUS_ARCHIVED, 'Archived'),
	]

	title = models.CharField(max_length=255)
	slug = models.SlugField(max_length=255, unique=True, db_index=True)
	short_description = models.CharField(max_length=255, blank=True)
	full_description = models.TextField(blank=True)
	thumbnail = models.ImageField(upload_to='projects/thumbnails/', blank=True, null=True)
	cover_image = models.ImageField(upload_to='projects/covers/', blank=True, null=True)
	featured = models.BooleanField(default=False, db_index=True)
	display_order = models.PositiveIntegerField(default=0)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True)
	live_demo = models.URLField(blank=True)
	github_url = models.URLField(blank=True)
	started_at = models.DateField(null=True, blank=True)
	completed_at = models.DateField(null=True, blank=True)

	category = models.ForeignKey('portfolio.Category', on_delete=models.PROTECT, related_name='projects')
	technologies = models.ManyToManyField('portfolio.Technology', blank=True, related_name='projects')

	class Meta:
		verbose_name = 'Project'
		verbose_name_plural = 'Projects'
		ordering = ('-featured', 'display_order', '-created_at')
		indexes = [
			models.Index(fields=['slug']),
			models.Index(fields=['status']),
			models.Index(fields=['created_at']),
		]

	def __str__(self):
		return self.title


class ProjectImage(models.Model):
	project = models.ForeignKey('portfolio.Project', on_delete=models.CASCADE, related_name='images')
	image = models.ImageField(upload_to='projects/images/')
	caption = models.CharField(max_length=255, blank=True)
	display_order = models.PositiveIntegerField(default=0)

	class Meta:
		verbose_name = 'Project Image'
		verbose_name_plural = 'Project Images'
		ordering = ('display_order',)

	def __str__(self):
		return f"{self.project.title} - {self.caption or 'Image'}"

