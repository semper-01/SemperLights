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

# Install dependencies (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

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