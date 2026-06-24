from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from accounts.permissions import IsStaff
from notifications.models import ContactMessage, NewsletterSubscriber
from notifications.serializers import ContactMessageSerializer, NewsletterSubscriberSerializer
from notifications.services import NotificationService


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('name', 'email', 'subject')
    ordering_fields = ('created_at',)
    ordering = ('-created_at',)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [IsStaff()]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsStaff])
    def mark_resolved(self, request, pk=None):
        contact_message = self.get_object()
        contact_message = NotificationService.mark_contact_resolved(contact_message)
        return Response(self.get_serializer(contact_message).data)


class NewsletterSubscriberViewSet(viewsets.ModelViewSet):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSubscriberSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ('email',)
    ordering_fields = ('subscribed_at', 'email')
    ordering = ('-subscribed_at',)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsStaff()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            queryset = super().get_queryset()
        elif user.is_authenticated:
            queryset = NewsletterSubscriber.objects.filter(email=user.email)
        else:
            queryset = NewsletterSubscriber.objects.none()
        subscribed = self.request.query_params.get('subscribed')
        if subscribed is not None:
            queryset = queryset.filter(is_active=subscribed.lower() in ('1', 'true', 'yes'))
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            subscriber = NotificationService.subscribe_newsletter(serializer.validated_data['email'])
        except Exception as exc:
            raise ValidationError({'detail': str(exc)})
        serializer.instance = subscriber
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unsubscribe(self, request):
        email = request.data.get('email', request.user.email)
        if email != request.user.email and not request.user.is_staff:
            raise PermissionDenied('Cannot unsubscribe an email that is not your own.')
        try:
            subscriber = NotificationService.unsubscribe_newsletter(email)
        except Exception as exc:
            raise ValidationError({'detail': str(exc)})
        return Response(self.get_serializer(subscriber).data)
