# =============================================================================
# Semper Lights — Frontend Dockerfile
# =============================================================================
# Multi-stage build:
#   Stage 1 (build)  — Compile the Vite/React application
#   Stage 2 (prod)   — Serve compiled assets via Nginx
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1 — Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (layer caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — Production Nginx
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

# Remove default Nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]