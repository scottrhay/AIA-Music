#!/bin/bash

# AIASpeech Database Setup Script
# Run this to set up MySQL database for AIASpeech

set -e

echo "=== AIASpeech Database Setup ==="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "MySQL is not installed. Please install MySQL first."
    exit 1
fi

# Prompt for MySQL root password
echo "Enter MySQL root password:"
read -s MYSQL_ROOT_PASSWORD

# Generate a random password for the application database user
DB_PASSWORD=$(openssl rand -base64 24)

echo ""
echo "Creating database and user..."

# Create database and user
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS aiaspeech_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'aiaspeech_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON aiaspeech_db.* TO 'aiaspeech_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo ""
echo "Importing database schema..."

# Import schema
mysql -u root -p"$MYSQL_ROOT_PASSWORD" aiaspeech_db < ../database/schema.sql

echo ""
echo "=== Database Setup Complete ==="
echo ""
echo "Database credentials (save these securely):"
echo "Database Name: aiaspeech_db"
echo "Database User: aiaspeech_user"
echo "Database Password: $DB_PASSWORD"
echo ""
echo "Save this password! You'll need it for the .env configuration."
