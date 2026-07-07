"""
Production settings for config project.
"""

import os
from .base import *


def env_list(name):
    """Return a comma-separated environment variable as a clean list."""
    return [item.strip() for item in os.getenv(name, '').split(',') if item.strip()]


# Environment variable validation
def validate_required_env_vars():
    """Validate that required environment variables are set for production."""
    required_vars = [
        'SECRET_KEY',
        'ALLOWED_HOSTS',
        'CORS_ALLOWED_ORIGINS',
    ]

    # Either DATABASE_URL or the individual DB_* variables must be set
    if not os.getenv('DATABASE_URL'):
        db_required = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST']
        missing_db = [var for var in db_required if not os.getenv(var)]
        if missing_db:
            required_vars.extend(missing_db)

    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        raise ValueError(
            f"Production environment validation failed. "
            f"Missing required environment variables: {', '.join(missing_vars)}"
        )


# Validate environment on startup
validate_required_env_vars()

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = env_list('ALLOWED_HOSTS')

# Database - PostgreSQL required for production
# Support both DATABASE_URL (preferred) and individual DB_* variables
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    import re
    from urllib.parse import urlparse, parse_qs
    # Parse DATABASE_URL: postgres://user:password@host:port/dbname?sslmode=require
    parsed = urlparse(DATABASE_URL)
    if parsed.scheme in ('postgres', 'postgresql'):
        db_name = parsed.path.lstrip('/')
        # Remove query string from db name if present
        if '?' in db_name:
            db_name = db_name.split('?')[0]
        db_options = parse_qs(parsed.query) if parsed.query else {}
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': db_name,
                'USER': parsed.username,
                'PASSWORD': parsed.password,
                'HOST': parsed.hostname,
                'PORT': parsed.port or '5432',
                'OPTIONS': {},
            }
        }
        # Pass SSL mode if specified in URL
        if 'sslmode' in db_options:
            DATABASES['default']['OPTIONS']['sslmode'] = db_options['sslmode'][0]
    else:
        raise ValueError(f"Invalid DATABASE_URL format: {DATABASE_URL}")
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME'),
            'USER': os.getenv('DB_USER'),
            'PASSWORD': os.getenv('DB_PASSWORD'),
            'HOST': os.getenv('DB_HOST'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

# CORS Configuration - Read from environment
CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list('CSRF_TRUSTED_ORIGINS') or CORS_ALLOWED_ORIGINS

# Security settings for production
# Disable SSL redirect when behind Nginx (Nginx handles SSL termination)
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() == 'true'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'same-origin'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# JWT settings from environment
from datetime import timedelta
SIMPLE_JWT.update({
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', '60'))
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', '1'))
    ),
    'SIGNING_KEY': os.getenv('JWT_SIGNING_KEY') or SECRET_KEY,
})
