#!/bin/bash

# SunoApp Docker Deployment Script
# Builds and deploys SunoApp containers with proper configuration

set -e  # Exit on error

echo "🎵 SunoApp Docker Deployment"
echo "=============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please copy .env.example to .env and configure it"
    echo "   cp .env.example .env"
    exit 1
fi

echo "✓ Environment file found"

# Check if frontend build exists
if [ ! -d "frontend/build" ]; then
    echo "⚠️  Frontend build directory not found"
    echo "   Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
    echo "✓ Frontend built successfully"
else
    echo "✓ Frontend build exists"
fi

# Stop and remove existing containers
echo ""
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || echo "No existing containers to stop"

# Build new images
echo ""
echo "Building Docker images..."
docker-compose build --no-cache

# Start containers
echo ""
echo "Starting containers..."
docker-compose up -d

# Wait for healthcheck
echo ""
echo "Waiting for services to be healthy..."
sleep 10

# Check container status
echo ""
echo "Container Status:"
docker-compose ps

# Check backend health
echo ""
echo "Checking backend health..."
docker exec sunoapp python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" 2>/dev/null && echo "✓ Backend is healthy" || echo "⚠️  Backend health check failed"

# Check nginx
echo ""
echo "Checking nginx..."
docker exec sunoapp-nginx wget --no-verbose --tries=1 --spider http://localhost/ 2>/dev/null && echo "✓ Nginx is healthy" || echo "⚠️  Nginx health check failed"

echo ""
echo "=============================="
echo "🚀 Deployment Complete!"
echo ""
echo "Your SunoApp is now running:"
echo "  - Backend: http://localhost:5000"
echo "  - Frontend: https://suno.aiacopilot.com"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop:"
echo "  docker-compose down"
echo ""
