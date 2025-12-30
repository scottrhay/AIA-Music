#!/bin/bash

# SunoApp Docker Deployment Script
# Run this to deploy or update the application using Docker

set -e

APP_DIR="/var/www/sunoapp"

echo "=== SunoApp Docker Deployment ==="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    echo "Please install Docker first: https://docs.docker.com/engine/install/ubuntu/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "Error: Docker Compose is not installed."
    echo "Installing Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
fi

# Navigate to app directory
cd $APP_DIR

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file from .env.docker.example"
    echo ""
    echo "Run: cp .env.docker.example .env"
    echo "Then edit .env with your settings"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs
mkdir -p logs/nginx

# Build and start containers
echo "Building Docker images..."
docker-compose build

echo ""
echo "Starting containers..."
docker-compose up -d

# Wait for application to be healthy
echo ""
echo "Waiting for application to start..."
sleep 5

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "=== Deployment Complete ==="
    echo ""
    echo "Container Status:"
    docker-compose ps
    echo ""
    echo "Your app should now be accessible at:"
    echo "https://suno.aiacopilot.com"
    echo ""
    echo "Useful commands:"
    echo "  View logs:           docker-compose logs -f"
    echo "  View app logs:       docker-compose logs -f sunoapp"
    echo "  View nginx logs:     docker-compose logs -f nginx"
    echo "  Restart:             docker-compose restart"
    echo "  Stop:                docker-compose down"
    echo "  Rebuild and restart: docker-compose up -d --build"
    echo "  Shell into app:      docker-compose exec sunoapp sh"
else
    echo ""
    echo "Error: Containers failed to start"
    echo "Check logs with: docker-compose logs"
    exit 1
fi

# SSL Certificate Setup (if needed)
if [ ! -f /etc/letsencrypt/live/suno.aiacopilot.com/fullchain.pem ]; then
    echo ""
    echo "=== SSL Certificate Setup ==="
    echo "SSL certificate not found. Setting up Let's Encrypt..."
    echo ""
    read -p "Do you want to set up SSL certificate now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Stop nginx container temporarily
        docker-compose stop nginx

        # Run certbot on host
        sudo certbot certonly --standalone -d suno.aiacopilot.com

        # Start nginx again
        docker-compose start nginx

        echo ""
        echo "SSL certificate installed successfully!"
    else
        echo "Skipping SSL setup. You can run it later with:"
        echo "sudo certbot certonly --standalone -d suno.aiacopilot.com"
    fi
fi

echo ""
echo "=== All Done! ==="
