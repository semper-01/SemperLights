#!/bin/bash
# =============================================================================
# Semper Lights — Backend Entrypoint
# =============================================================================
# This script runs on container start. It:
#   1. Applies database migrations
#   2. Collects static files
#   3. Starts Gunicorn
# =============================================================================

set -ex

# Create logs directory if it doesn't exist
mkdir -p /app/logs

echo "==> Running database migrations..."
python -u manage.py migrate --noinput --verbosity 3
echo "==> Database migrations completed."

echo "==> Collecting static files..."
python -u manage.py collectstatic --noinput --clear
echo "==> Static files collected."

echo "==> Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class sync \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
