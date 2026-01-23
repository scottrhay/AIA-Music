#!/bin/bash

# SunoApp Remote Server Deployment Script
# Deploys SunoApp to remote server via SSH

set -e  # Exit on error

SERVER="root@srv800338.hstgr.cloud"
REMOTE_DIR="/root/sunoapp"
LOCAL_DIR="."

echo "🎵 SunoApp Remote Deployment"
echo "=============================="
echo ""

# Check if .env file exists locally
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found locally!"
    echo "   Please copy .env.example to .env and configure it"
    exit 1
fi

echo "✓ Local environment file found"

# Build frontend locally
echo ""
echo "Building frontend locally..."
cd frontend
npm install
npm run build
cd ..
echo "✓ Frontend built successfully"

# Create remote directory
echo ""
echo "Creating remote directory structure..."
ssh $SERVER "mkdir -p $REMOTE_DIR"

# Copy files to server
echo ""
echo "Copying files to server..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.git' \
    --exclude '*.tar.gz' \
    --exclude 'logs/*' \
    ./ $SERVER:$REMOTE_DIR/

echo "✓ Files copied successfully"

# Deploy on server
echo ""
echo "Deploying on server..."
ssh $SERVER "cd $REMOTE_DIR && bash -s" << 'ENDSSH'
    echo "Stopping existing containers..."
    docker-compose down 2>/dev/null || true

    echo "Building new images..."
    docker-compose build --no-cache

    echo "Starting containers..."
    docker-compose up -d

    echo "Waiting for services to start..."
    sleep 10

    echo "Container status:"
    docker-compose ps

    echo ""
    echo "Checking backend health..."
    docker exec sunoapp python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" 2>/dev/null && echo "✓ Backend is healthy" || echo "⚠️  Backend health check failed"

    echo ""
    echo "Checking nginx..."
    docker exec sunoapp-nginx wget --no-verbose --tries=1 --spider http://localhost/ 2>/dev/null && echo "✓ Nginx is healthy" || echo "⚠️  Nginx health check failed"
ENDSSH

echo ""
echo "=============================="
echo "🚀 Deployment Complete!"
echo ""
echo "Your SunoApp is now running at:"
echo "  https://suno.aiacopilot.com"
echo ""
echo "To view logs on server:"
echo "  ssh $SERVER 'cd $REMOTE_DIR && docker-compose logs -f'"
echo ""
echo "To stop on server:"
echo "  ssh $SERVER 'cd $REMOTE_DIR && docker-compose down'"
echo ""
