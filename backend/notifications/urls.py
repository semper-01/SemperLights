from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ContactMessageViewSet, NewsletterSubscriberViewSet

router = DefaultRouter()
router.register('contact-messages', ContactMessageViewSet, basename='contactmessage')
router.register('newsletter-subscribers', NewsletterSubscriberViewSet, basename='newslettersubscriber')

urlpatterns = [
    path('', include(router.urls)),
]
