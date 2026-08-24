#!/bin/bash

set -xuo pipefail

echo "========== START =========="

echo "==> Checking Python version..."
python --version

echo "==> Listing installed Python packages..."
pip freeze

echo "==> Running Django system checks..."
python manage.py check
echo "==> CHECK PASSED"

echo "==> Running PostgreSQL diagnostic..."
timeout 60 python -u diagnose_postgres.py
echo "==> POSTGRES DIAGNOSTIC PASSED"

echo "==> Running migrations diagnostic..."
timeout 120 python -u diagnose_migrate.py
echo "==> MIGRATIONS PASSED"

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --clear
echo "==> COLLECTSTATIC PASSED"

echo "==> Testing WSGI import..."
python -c "import config.wsgi; print('WSGI OK')"
echo "==> WSGI PASSED"

echo "==> Testing health endpoint..."
python manage.py shell -c "
from django.test import Client
from django.test.utils import setup_test_environment
setup_test_environment()
client = Client()
response = client.get('/api/v1/health/')
print(f'Health endpoint status: {response.status_code}')
print(f'Response: {response.content.decode()}')
if response.status_code != 200:
    raise SystemExit(1)
"
echo "==> HEALTH CHECK PASSED"

echo "==> Starting Gunicorn..."

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 1 \
    --log-level debug \
    --access-logfile - \
    --error-logfile -