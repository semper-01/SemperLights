from datetime import timedelta
from itertools import count

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from appointments.models import Appointment
from blog.models import BlogCategory, BlogPost
from portfolio.models import Category, Project, Technology
from services.models import Service


User = get_user_model()
_sequence = count(1)


def unique_suffix():
    return next(_sequence)


def create_user(email='user@example.com', username='user', password='StrongPass123!', **extra):
    if User.objects.filter(email=email).exists() or User.objects.filter(username=username).exists():
        suffix = unique_suffix()
        email = email.replace('@', f'+{suffix}@')
        username = f'{username}{suffix}'
    return User.objects.create_user(email=email, username=username, password=password, **extra)


def create_staff(email='staff@example.com', username='staff', password='StrongPass123!', **extra):
    return create_user(email=email, username=username, password=password, is_staff=True, **extra)


def create_superuser(email='admin@example.com', username='admin', password='StrongPass123!', **extra):
    return User.objects.create_superuser(email=email, username=username, password=password, **extra)


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def create_category(name='Web Apps', slug='web-apps'):
    if Category.objects.filter(name=name).exists() or Category.objects.filter(slug=slug).exists():
        suffix = unique_suffix()
        name = f'{name} {suffix}'
        slug = f'{slug}-{suffix}'
    return Category.objects.create(name=name, slug=slug)


def create_technology(name='Django'):
    if Technology.objects.filter(name=name).exists():
        name = f'{name} {unique_suffix()}'
    return Technology.objects.create(name=name)


def create_project(category=None, title='Portfolio Site', slug='portfolio-site', **extra):
    category = category or create_category()
    if Project.objects.filter(slug=slug).exists():
        suffix = unique_suffix()
        title = f'{title} {suffix}'
        slug = f'{slug}-{suffix}'
    defaults = {
        'short_description': 'Short description',
        'full_description': 'Full description',
        'status': Project.STATUS_PUBLISHED,
    }
    defaults.update(extra)
    return Project.objects.create(title=title, slug=slug, category=category, **defaults)


def create_service(title='Web Development', slug='web-development', **extra):
    if Service.objects.filter(slug=slug).exists():
        suffix = unique_suffix()
        title = f'{title} {suffix}'
        slug = f'{slug}-{suffix}'
    defaults = {
        'description': 'Build web applications',
        'starting_price': '100.00',
        'is_active': True,
    }
    defaults.update(extra)
    return Service.objects.create(title=title, slug=slug, **defaults)


def future_date(days=3):
    return timezone.localdate() + timedelta(days=days)


def create_appointment(service=None, email='user@example.com', **extra):
    service = service or create_service()
    defaults = {
        'full_name': 'Client User',
        'email': email,
        'service': service,
        'preferred_date': future_date(),
        'project_summary': 'Need a website',
    }
    defaults.update(extra)
    return Appointment.objects.create(**defaults)


def create_blog_category(name='News', slug='news'):
    if BlogCategory.objects.filter(slug=slug).exists():
        suffix = unique_suffix()
        name = f'{name} {suffix}'
        slug = f'{slug}-{suffix}'
    return BlogCategory.objects.create(name=name, slug=slug)


def create_blog_post(category=None, author=None, title='Launch Notes', slug='launch-notes', **extra):
    category = category or create_blog_category()
    author = author or create_user(email='author@example.com', username='author')
    if BlogPost.objects.filter(slug=slug).exists():
        suffix = unique_suffix()
        title = f'{title} {suffix}'
        slug = f'{slug}-{suffix}'
    defaults = {
        'content': 'Published content',
        'status': BlogPost.STATUS_PUBLISHED,
        'author': author,
        'category': category,
        'published_at': timezone.now(),
    }
    defaults.update(extra)
    return BlogPost.objects.create(title=title, slug=slug, **defaults)
