from django.db import transaction
from django.utils import timezone

from .models import ContactMessage, NewsletterSubscriber


class NotificationServiceError(Exception):
    """Base exception for notification business operations."""


class NewsletterSubscriberNotFound(NotificationServiceError):
    """Raised when a newsletter subscriber cannot be found."""


class NewsletterAlreadySubscribed(NotificationServiceError):
    """Raised when an email is already subscribed to the newsletter."""


class NewsletterAlreadyUnsubscribed(NotificationServiceError):
    """Raised when an email is already unsubscribed from the newsletter."""


class ContactMessageNotFound(NotificationServiceError):
    """Raised when a contact message cannot be found."""


class NotificationService:
    """Encapsulates business operations for notifications and subscribers."""

    @classmethod
    def subscribe_newsletter(cls, email: str) -> NewsletterSubscriber:
        """Subscribe an email to the newsletter or reactivate an existing subscriber."""
        normalized_email = email.strip().lower()
        if not normalized_email:
            raise NotificationServiceError('Email is required to subscribe to the newsletter.')

        with transaction.atomic():
            subscriber, created = NewsletterSubscriber.objects.get_or_create(
                email=normalized_email,
                defaults={
                    'is_active': True,
                    'subscribed_at': timezone.now(),
                },
            )
            if not created and subscriber.is_active:
                raise NewsletterAlreadySubscribed('This email is already subscribed.')

            if not created:
                subscriber.is_active = True
                subscriber.subscribed_at = timezone.now()
                subscriber.save(update_fields=['is_active', 'subscribed_at'])

            return subscriber

    @classmethod
    def unsubscribe_newsletter(cls, email: str) -> NewsletterSubscriber:
        """Unsubscribe a newsletter subscriber."""
        normalized_email = email.strip().lower()
        try:
            subscriber = NewsletterSubscriber.objects.get(email=normalized_email)
        except NewsletterSubscriber.DoesNotExist as exc:
            raise NewsletterSubscriberNotFound('Newsletter subscriber not found.') from exc

        if not subscriber.is_active:
            raise NewsletterAlreadyUnsubscribed('Subscriber is already unsubscribed.')

        subscriber.is_active = False
        subscriber.save(update_fields=['is_active'])
        return subscriber

    @classmethod
    def mark_contact_resolved(cls, contact_message: ContactMessage) -> ContactMessage:
        """Mark a contact message as resolved."""
        if contact_message.is_read:
            return contact_message

        contact_message.is_read = True
        contact_message.save(update_fields=['is_read'])
        return contact_message
