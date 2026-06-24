from typing import Any

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction

User = get_user_model()


class UserServiceError(Exception):
    """Base exception for UserService operations."""


class UserAlreadyExists(UserServiceError):
    """Raised when a user with the provided email already exists."""


class UserNotFound(UserServiceError):
    """Raised when a requested user was not found."""


class UserService:
    """Encapsulates business operations for user lifecycle management."""

    @classmethod
    def create_user(
        cls,
        email: str,
        password: str,
        username: str,
        first_name: str = '',
        last_name: str = '',
        **extra_fields: Any,
    ) -> User:
        """Create a new user and enforce unique email business rules."""
        if not email:
            raise UserServiceError('Email is required to create a user.')
        if not username:
            raise UserServiceError('Username is required to create a user.')
        if not password:
            raise UserServiceError('Password is required to create a user.')

        if User.objects.filter(email__iexact=email).exists():
            raise UserAlreadyExists(f'A user with email {email} already exists.')

        try:
            with transaction.atomic():
                return User.objects.create_user(
                    email=email,
                    username=username,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    **extra_fields,
                )
        except IntegrityError as exc:
            raise UserServiceError('Unable to create user due to a data integrity issue.') from exc

    @classmethod
    def activate_user(cls, user: User) -> User:
        """Activate a user account."""
        if user.is_active:
            raise UserServiceError('User account is already active.')
        user.is_active = True
        user.save(update_fields=['is_active'])
        return user

    @classmethod
    def deactivate_user(cls, user: User) -> User:
        """Deactivate a user account."""
        if not user.is_active:
            raise UserServiceError('User account is already inactive.')
        user.is_active = False
        user.save(update_fields=['is_active'])
        return user
