#!/bin/bash

# AIASpeech Deployment Script
# Run this to deploy or update the application

set -e

APP_DIR="/var/www/aiaspeech"

echo "=== AIASpeech Deployment ==="
echo ""

# Navigate to app directory
cd $APP_DIR

# Build React frontend
echo "Building React frontend..."
cd frontend
npm run build

# Create logs directory
echo "Creating logs directory..."
cd $APP_DIR
mkdir -p logs

# Set up systemd service
echo "Setting up systemd service..."
sudo cp deploy/aiaspeech.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable aiaspeech
sudo systemctl restart aiaspeech

# Set up Nginx
echo "Setting up Nginx..."
sudo cp deploy/nginx_config /etc/nginx/sites-available/aiaspeech
sudo ln -sf /etc/nginx/sites-available/aiaspeech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL (first time only)
if [ ! -f /etc/letsencrypt/live/speech.aiacopilot.com/fullchain.pem ]; then
    echo ""
    echo "Setting up SSL certificate..."
    echo "This will require you to temporarily stop nginx and verify domain ownership."
    read -p "Continue with SSL setup? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl stop nginx
        sudo certbot certonly --standalone -d speech.aiacopilot.com
        sudo systemctl start nginx
    else
        echo "Skipping SSL setup. You can run it later with:"
        echo "sudo certbot --nginx -d speech.aiacopilot.com"
    fi
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Application status:"
sudo systemctl status aiaspeech --no-pager
echo ""
echo "Your app should now be accessible at:"
echo "https://speech.aiacopilot.com"
echo ""
echo "Useful commands:"
echo "  View Flask logs:  sudo journalctl -u aiaspeech -f"
echo "  View access logs: tail -f $APP_DIR/logs/gunicorn_access.log"
echo "  View error logs:  tail -f $APP_DIR/logs/gunicorn_error.log"
echo "  Restart app:      sudo systemctl restart aiaspeech"
echo "  Restart nginx:    sudo systemctl restart nginx"
