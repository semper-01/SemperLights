from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import RequestFactory, TestCase
from rest_framework.test import APIClient

from accounts.permissions import IsOwner, IsStaff
from accounts.serializers import PasswordChangeSerializer, UserRegistrationSerializer
from accounts.services import UserAlreadyExists, UserService, UserServiceError
from core.test_utils import auth_client, create_staff, create_user


User = get_user_model()


class UserModelTests(TestCase):
    def test_user_creation_and_string_representation(self):
        user = create_user(email='person@example.com', username='person')

        self.assertEqual(str(user), 'person@example.com')
        self.assertTrue(user.check_password('StrongPass123!'))
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)

    def test_email_is_unique(self):
        create_user(email='unique@example.com', username='one')

        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='unique@example.com',
                username='two',
                password='StrongPass123!',
            )


class UserServiceTests(TestCase):
    def test_create_user_success(self):
        user = UserService.create_user(
            email='service@example.com',
            username='service',
            password='StrongPass123!',
            first_name='Service',
        )

        self.assertEqual(user.email, 'service@example.com')
        self.assertEqual(user.first_name, 'Service')

    def test_create_user_requires_email_username_and_password(self):
        with self.assertRaises(UserServiceError):
            UserService.create_user(email='', username='missing', password='StrongPass123!')
        with self.assertRaises(UserServiceError):
            UserService.create_user(email='missing@example.com', username='', password='StrongPass123!')
        with self.assertRaises(UserServiceError):
            UserService.create_user(email='missing@example.com', username='missing', password='')

    def test_create_user_rejects_duplicate_email_case_insensitive(self):
        create_user(email='duplicate@example.com', username='original')

        with self.assertRaises(UserAlreadyExists):
            UserService.create_user(
                email='DUPLICATE@example.com',
                username='copy',
                password='StrongPass123!',
            )

    def test_activate_and_deactivate_user(self):
        user = create_user(email='toggle@example.com', username='toggle')
        UserService.deactivate_user(user)
        user.refresh_from_db()
        self.assertFalse(user.is_active)

        UserService.activate_user(user)
        user.refresh_from_db()
        self.assertTrue(user.is_active)

    def test_activate_and_deactivate_invalid_states_raise(self):
        user = create_user(email='states@example.com', username='states')

        with self.assertRaises(UserServiceError):
            UserService.activate_user(user)

        UserService.deactivate_user(user)
        with self.assertRaises(UserServiceError):
            UserService.deactivate_user(user)


class AccountSerializerTests(TestCase):
    def test_registration_serializer_validates_and_creates_user(self):
        serializer = UserRegistrationSerializer(
            data={
                'email': 'new@example.com',
                'username': 'newuser',
                'password': 'StrongPass123!',
                'password_confirm': 'StrongPass123!',
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.email, 'new@example.com')

    def test_registration_serializer_rejects_password_mismatch_and_duplicates(self):
        create_user(email='taken@example.com', username='taken')
        mismatch = UserRegistrationSerializer(
            data={
                'email': 'other@example.com',
                'username': 'other',
                'password': 'StrongPass123!',
                'password_confirm': 'Different123!',
            }
        )
        duplicate = UserRegistrationSerializer(
            data={
                'email': 'taken@example.com',
                'username': 'taken2',
                'password': 'StrongPass123!',
                'password_confirm': 'StrongPass123!',
            }
        )

        self.assertFalse(mismatch.is_valid())
        self.assertIn('password', mismatch.errors)
        self.assertFalse(duplicate.is_valid())
        self.assertIn('email', duplicate.errors)

    def test_password_change_serializer_validates_old_password(self):
        user = create_user(email='change@example.com', username='change')
        request = RequestFactory().post('/')
        request.user = user
        serializer = PasswordChangeSerializer(
            data={
                'old_password': 'StrongPass123!',
                'new_password': 'BetterPass123!',
                'new_password_confirm': 'BetterPass123!',
            },
            context={'request': request},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        user.refresh_from_db()
        self.assertTrue(user.check_password('BetterPass123!'))


class AccountAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_user(email='api@example.com', username='api')

    def test_registration_login_refresh_current_user_and_logout(self):
        registration = self.client.post(
            '/api/v1/auth/register/',
            {
                'email': 'registered@example.com',
                'username': 'registered',
                'password': 'StrongPass123!',
                'password_confirm': 'StrongPass123!',
            },
            format='json',
        )
        self.assertEqual(registration.status_code, 201)

        login = self.client.post(
            '/api/v1/auth/login/',
            {'email': 'registered@example.com', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(login.status_code, 200)
        self.assertIn('access', login.data)
        self.assertIn('refresh', login.data)

        refresh = self.client.post('/api/v1/auth/refresh/', {'refresh': login.data['refresh']}, format='json')
        self.assertEqual(refresh.status_code, 200)
        self.assertIn('access', refresh.data)

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        current_user = client.get('/api/v1/auth/current-user/')
        self.assertEqual(current_user.status_code, 200)
        self.assertEqual(current_user.data['email'], 'registered@example.com')

        logout = client.post('/api/v1/auth/logout/', {}, format='json')
        self.assertEqual(logout.status_code, 200)

    def test_current_user_requires_authentication(self):
        response = self.client.get('/api/v1/auth/current-user/')

        self.assertEqual(response.status_code, 401)

    def test_profile_object_ownership_blocks_other_users(self):
        other = create_user(email='other@example.com', username='other')
        client = auth_client(other)

        response = client.get(f'/api/v1/profile/{self.user.id}/')

        self.assertEqual(response.status_code, 403)


class PermissionTests(TestCase):
    def test_is_staff_permission(self):
        request = RequestFactory().get('/')
        request.user = create_staff()

        self.assertTrue(IsStaff().has_permission(request, None))

    def test_is_owner_permission_for_non_owned_object(self):
        owner = create_user(email='owner@example.com', username='owner')
        other = create_user(email='not-owner@example.com', username='notowner')
        request = RequestFactory().get('/')
        request.user = other
        owned_object = type('OwnedObject', (), {'user': owner})()

        self.assertFalse(IsOwner().has_object_permission(request, None, owned_object))
