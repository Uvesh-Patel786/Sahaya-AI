# Multi-stage build for Sahayak-AI application
# This Dockerfile builds the complete application with backend, frontend, and AI service

# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Runtime - Backend and AI Service
FROM python:3.11-slim

# Install Node.js for backend runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY backend/package*.json ./backend/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Copy AI service
COPY ai-service/ ./ai-service/

# Install Python dependencies
RUN pip install --no-cache-dir -r ai-service/requirements.txt

# Copy environment files
COPY .env.example .env 2>/dev/null || true

# Expose ports
EXPOSE 3000 5000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Default command starts backend (can be overridden)
CMD ["node", "backend/dist/index.js"]