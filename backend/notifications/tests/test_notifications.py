from django.db import IntegrityError
from django.test import TestCase

from core.test_utils import auth_client, create_staff, create_user
from notifications.models import ContactMessage, NewsletterSubscriber
from notifications.serializers import ContactMessageSerializer, NewsletterSubscriberSerializer
from notifications.services import (
    NewsletterAlreadySubscribed,
    NewsletterAlreadyUnsubscribed,
    NewsletterSubscriberNotFound,
    NotificationService,
    NotificationServiceError,
)


class NotificationModelTests(TestCase):
    def test_contact_message_and_newsletter_string_representations(self):
        message = ContactMessage.objects.create(
            name='Client',
            email='client@example.com',
            subject='Hello',
            message='Message body',
        )
        subscriber = NewsletterSubscriber.objects.create(email='subscriber@example.com')

        self.assertEqual(str(message), 'Client - Hello')
        self.assertEqual(str(subscriber), 'subscriber@example.com')

    def test_newsletter_email_is_unique(self):
        NewsletterSubscriber.objects.create(email='unique@example.com')

        with self.assertRaises(IntegrityError):
            NewsletterSubscriber.objects.create(email='unique@example.com')


class NotificationServiceTests(TestCase):
    def test_subscribe_unsubscribe_and_resubscribe_newsletter(self):
        subscriber = NotificationService.subscribe_newsletter(' Person@Example.com ')
        self.assertEqual(subscriber.email, 'person@example.com')
        self.assertTrue(subscriber.is_active)

        unsubscribed = NotificationService.unsubscribe_newsletter('person@example.com')
        self.assertFalse(unsubscribed.is_active)

        resubscribed = NotificationService.subscribe_newsletter('person@example.com')
        self.assertTrue(resubscribed.is_active)

    def test_newsletter_invalid_operations_raise(self):
        with self.assertRaises(NotificationServiceError):
            NotificationService.subscribe_newsletter('')
        with self.assertRaises(NewsletterSubscriberNotFound):
            NotificationService.unsubscribe_newsletter('missing@example.com')

        NotificationService.subscribe_newsletter('repeat@example.com')
        with self.assertRaises(NewsletterAlreadySubscribed):
            NotificationService.subscribe_newsletter('repeat@example.com')

        NotificationService.unsubscribe_newsletter('repeat@example.com')
        with self.assertRaises(NewsletterAlreadyUnsubscribed):
            NotificationService.unsubscribe_newsletter('repeat@example.com')

    def test_mark_contact_resolved_is_idempotent(self):
        message = ContactMessage.objects.create(
            name='Client',
            email='client@example.com',
            subject='Issue',
            message='Please help',
        )

        NotificationService.mark_contact_resolved(message)
        message.refresh_from_db()
        self.assertTrue(message.is_read)
        self.assertTrue(NotificationService.mark_contact_resolved(message).is_read)


class NotificationSerializerTests(TestCase):
    def test_contact_message_serializer_validates_required_fields(self):
        valid = ContactMessageSerializer(
            data={
                'name': 'Client',
                'email': 'client@example.com',
                'subject': 'Hello',
                'message': 'Body',
                'is_read': True,
            }
        )
        invalid = ContactMessageSerializer(data={'email': 'not-an-email'})

        self.assertTrue(valid.is_valid(), valid.errors)
        message = valid.save()
        self.assertFalse(message.is_read)
        self.assertFalse(invalid.is_valid())
        self.assertIn('name', invalid.errors)
        self.assertIn('email', invalid.errors)

    def test_newsletter_serializer_validates_email(self):
        valid = NewsletterSubscriberSerializer(data={'email': 'subscriber@example.com'})
        invalid = NewsletterSubscriberSerializer(data={'email': 'broken'})

        self.assertTrue(valid.is_valid(), valid.errors)
        self.assertFalse(invalid.is_valid())
        self.assertIn('email', invalid.errors)


class NotificationAPITests(TestCase):
    def setUp(self):
        self.user = create_user(email='subscriber@example.com', username='subscriber')
        self.staff = create_staff()

    def test_contact_message_requires_auth_for_create_and_staff_for_list(self):
        anonymous = self.client.post('/api/v1/contact-messages/', {}, content_type='application/json')
        self.assertEqual(anonymous.status_code, 401)

        create = auth_client(self.user).post(
            '/api/v1/contact-messages/',
            {
                'name': 'Client',
                'email': 'client@example.com',
                'subject': 'Hello',
                'message': 'Body',
            },
            format='json',
        )
        self.assertEqual(create.status_code, 201)

        non_staff_list = auth_client(self.user).get('/api/v1/contact-messages/')
        self.assertEqual(non_staff_list.status_code, 403)

        staff_list = auth_client(self.staff).get('/api/v1/contact-messages/')
        self.assertEqual(staff_list.status_code, 200)

    def test_newsletter_subscribe_unsubscribe_and_ownership(self):
        client = auth_client(self.user)
        subscribe = client.post('/api/v1/newsletter-subscribers/', {'email': self.user.email}, format='json')
        self.assertEqual(subscribe.status_code, 201)

        listing = client.get('/api/v1/newsletter-subscribers/')
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.data['count'], 1)

        blocked = client.post('/api/v1/newsletter-subscribers/unsubscribe/', {'email': 'other@example.com'}, format='json')
        self.assertEqual(blocked.status_code, 403)

        unsubscribe = client.post('/api/v1/newsletter-subscribers/unsubscribe/', {}, format='json')
        self.assertEqual(unsubscribe.status_code, 200)
        self.assertFalse(unsubscribe.data['is_active'])


