# AIAMusic Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy frontend source
COPY frontend/ ./

# Set production API URL
ENV REACT_APP_API_URL=https://music.aiacopilot.com/api/v1

# Build React app
RUN npm run build

# Stage 2: Python backend with built frontend
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/build /app/static

# Create non-root user
RUN useradd -m -u 1000 aiamusic && \
    chown -R aiamusic:aiamusic /app

# Switch to non-root user
USER aiamusic

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

# Run gunicorn
CMD ["gunicorn", "--config", "gunicorn_config.py", "--bind", "0.0.0.0:5000", "run:app"]
