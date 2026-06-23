from django.contrib import admin

from .models import ContactMessage, NewsletterSubscriber


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
	list_display = ('name', 'email', 'subject', 'is_read', 'created_at')
	list_filter = ('is_read',)
	search_fields = ('name', 'email', 'subject', 'message')
	ordering = ('-created_at',)


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
	list_display = ('email', 'is_active', 'subscribed_at')
	search_fields = ('email',)
	ordering = ('-subscribed_at',)
