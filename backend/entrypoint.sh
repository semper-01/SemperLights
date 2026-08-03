#!/bin/bash
set -exuo pipefail

echo "========== START =========="

echo "==> Checking Python version..."
python --version

echo "==> Listing installed Python packages..."
pip freeze

echo "==> Running Django system checks..."
python manage.py check
echo "==> Django system checks passed."

echo "==> Running database migrations (instrumented)..."
timeout 120 python -u diagnose_migrate.py
echo "==> Database migrations completed."

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --clear
echo "==> Static files collected."

echo "==> Testing WSGI import..."
python -c "import config.wsgi; print('WSGI OK')"
echo "==> WSGI import successful."

echo "==> Verifying health endpoint before starting Gunicorn..."
python manage.py shell -c "
import django
from django.test import Client
from django.test.utils import setup_test_environment
setup_test_environment()
client = Client()
response = client.get('/api/v1/health/')
print(f'Health endpoint status: {response.status_code}')
print(f'Response: {response.content.decode()}')
if response.status_code != 200:
    import sys
    sys.exit(1)
"
echo "==> Health endpoint verification passed."

echo "==> Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 1 \
    --log-level debug \
    --access-logfile - \
    --error-logfile -