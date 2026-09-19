"""
Development settings for config project.
"""

import os

import dj_database_url

from .base import *

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-hsahw5*88$rsof7vqaen6#l3s94z^8x2=%&c@1w+q#kl4rwu(5)')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']

# Database - PostgreSQL for development.
# When DATABASE_URL is set (e.g. an Azure Flexible Server such as
# postgresql://user:pass@host:5432/dbname?sslmode=require), it takes precedence and the
# sslmode in the URL is honoured by dj_database_url for secure remote/cloud connections.
# Otherwise we keep a secure local fallback driven by the individual DB_* variables.
DATABASES = {'default': dj_database_url.config(default=None)}
if not DATABASES['default']:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'semperlights'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

# CORS Configuration for development - Allow all origins for testing
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:8000',
]

CORS_ALLOW_CREDENTIALS = True

# Development security settings (not enforced in DEBUG mode)
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
