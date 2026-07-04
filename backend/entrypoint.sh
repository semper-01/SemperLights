#!/bin/bash
# =============================================================================
# Semper Lights — Backend Entrypoint
# =============================================================================
# This script runs on container start. It:
#   1. Applies database migrations
#   2. Collects static files
#   3. Starts Gunicorn
# =============================================================================

set -e

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "==> Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class sync \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info