from rest_framework import serializers

from .models import ContactMessage, NewsletterSubscriber


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = (
            'id',
            'name',
            'email',
            'subject',
            'message',
            'is_read',
            'created_at',
        )
        read_only_fields = ('id', 'is_read', 'created_at')


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = (
            'id',
            'email',
            'is_active',
            'subscribed_at',
        )
        read_only_fields = ('id', 'subscribed_at')
