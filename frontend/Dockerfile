# =============================================================================
# Semper Lights — Frontend Dockerfile
# =============================================================================
# Multi-stage build:
#   Stage 1 (build)  — Compile the Vite/React application
#   Stage 2 (prod)   — Serve compiled assets via Nginx with gzip
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1 — Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# --- Configurable API base URL (injected at build time) ---------------------
# Vite embeds VITE_* variables into the bundle at BUILD TIME, so the
# production API URL must be supplied here via:
#     docker build --build-arg VITE_API_BASE_URL=https://<backend-host>/api/v1
# This keeps the value environment-configurable instead of hard-coding a
# deployment-specific URL in React/TypeScript source. When omitted, the
# sealed local default (frontend/.env) is used, e.g. http://localhost:8000/api/v1.
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME=Semper Lights

# Install dependencies (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Ensure npm-installed CLI shims are executable (some container volumes strip exec bits)
RUN chmod +x node_modules/.bin/* 2>/dev/null || true

# Copy source and build
COPY . .

# Ensure the requested build-time value wins over the shipped local .env:
# in `vite build` (mode=production) the `.env.production` file takes
# precedence over the base `.env` file. `tsc`/`vite` are invoked via `node`
# directly (rather than npm's node_modules/.bin shims) so the build is robust
# on container build workspaces that do not preserve script exec bits.
RUN if [ -n "$VITE_API_BASE_URL" ]; then \
      printf 'VITE_API_BASE_URL=%s\nVITE_APP_NAME=%s\n' "$VITE_API_BASE_URL" "$VITE_APP_NAME" > .env.production; \
    fi \
    && node node_modules/typescript/bin/tsc -b \
    && node node_modules/vite/bin/vite.js build

# ---------------------------------------------------------------------------
# Stage 2 — Production Nginx
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache --update wget

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Remove default static assets
RUN rm -rf /usr/share/nginx/html/*.md /usr/share/nginx/html/*.txt 2>/dev/null; exit 0

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]