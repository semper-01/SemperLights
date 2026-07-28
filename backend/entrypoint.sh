#!/bin/bash
set -x

echo "========== START =========="

echo "Python:"
python --version

echo "Pip:"
pip freeze

echo "Checking Django..."
python manage.py check

echo "Running migrations..."
python manage.py migrate --noinput --verbosity 3

echo "Collecting static..."
python manage.py collectstatic --noinput --clear

echo "Testing WSGI import..."
python -c "import config.wsgi; print('WSGI OK')"

echo "Starting Gunicorn..."

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 1 \
    --log-level debug \
    --access-logfile - \
    --error-logfile -