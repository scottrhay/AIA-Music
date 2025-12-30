#!/bin/bash

# SunoApp Configuration Script
# Run this to configure the application environment

set -e

APP_DIR="/var/www/sunoapp"

echo "=== SunoApp Configuration ==="
echo ""

# Navigate to app directory
cd $APP_DIR

# Backend configuration
echo "Configuring backend..."
cd backend

# Create .env file
echo "Enter database password for sunoapp_user:"
read -s DB_PASSWORD

echo "Generating secret keys..."
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")

cat > .env <<EOF
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=production
SECRET_KEY=$SECRET_KEY

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sunoapp_db
DB_USER=sunoapp_user
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET_KEY=$JWT_SECRET
JWT_ACCESS_TOKEN_EXPIRES=86400

# CORS Configuration
CORS_ORIGINS=https://suno.aiacopilot.com

# Application Settings
API_PREFIX=/api/v1
EOF

# Install Python dependencies
echo "Installing Python dependencies..."
source ../venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Frontend configuration
echo ""
echo "Configuring frontend..."
cd ../frontend

# Create .env file for production
cat > .env <<EOF
REACT_APP_API_URL=https://suno.aiacopilot.com/api/v1
REACT_APP_NAME=SunoApp
EOF

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

echo ""
echo "=== Configuration Complete ==="
echo ""
echo "Backend .env file created at: $APP_DIR/backend/.env"
echo "Frontend .env file created at: $APP_DIR/frontend/.env"
