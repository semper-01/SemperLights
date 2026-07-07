# =============================================================================
# Semper Lights — Backend Dockerfile
# =============================================================================
# Production-grade Python image for the Django REST API.
# Uses Gunicorn as the WSGI server, runs collectstatic, and supports
# environment-based configuration.
# =============================================================================

FROM python:3.12-slim-bookworm AS backend

# ---------------------------------------------------------------------------
# System dependencies
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Python environment
# ---------------------------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production

WORKDIR /app

# ---------------------------------------------------------------------------
# Install Python dependencies
# ---------------------------------------------------------------------------
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install gunicorn==23.0.0 && \
    pip install -r requirements.txt --no-cache-dir && \
    rm -rf /root/.cache/pip

# ---------------------------------------------------------------------------
# Application code
# ---------------------------------------------------------------------------
COPY . .

# ---------------------------------------------------------------------------
# Create required directories for volume mounts
# ---------------------------------------------------------------------------
RUN mkdir -p /app/staticfiles /app/media

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl --fail http://localhost:8000/api/v1/health/ --silent --output /dev/null --connect-timeout 5 --max-time 10

ENTRYPOINT ["/entrypoint.sh"]
