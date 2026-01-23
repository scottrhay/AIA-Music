#!/bin/bash

# AIASpeech VPS Setup Script
# Run this on your Hostinger VPS (Ubuntu 24.04)

set -e

echo "=== AIASpeech VPS Setup ==="
echo "This script will set up your VPS for AIASpeech"
echo ""

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python 3.11 and pip
echo "Installing Python..."
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Install certbot for SSL
echo "Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Create application directory
echo "Creating application directory..."
sudo mkdir -p /var/www/aiaspeech
sudo chown -R $USER:$USER /var/www/aiaspeech

# Create Python virtual environment
echo "Creating Python virtual environment..."
cd /var/www/aiaspeech
python3.11 -m venv venv

# Install Node.js and npm (for React build)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo ""
echo "=== VPS Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Upload your AIASpeech code to /var/www/aiaspeech"
echo "2. Set up the database using setup_database.sh"
echo "3. Configure the application using configure_app.sh"
echo "4. Deploy using deploy.sh"
