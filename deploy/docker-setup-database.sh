#!/bin/bash

# AIASpeech Database Setup Script (for Docker deployment)
# This sets up the database on your HOST MySQL (not in a container)

set -e

echo "=== AIASpeech Database Setup ==="
echo ""
echo "This script will create the database in your existing MySQL installation."
echo ""

# Check if MySQL is installed on host
if ! command -v mysql &> /dev/null; then
    echo "Error: MySQL is not installed on this system."
    echo "Please install MySQL first."
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
CREATE USER IF NOT EXISTS 'aiaspeech_user'@'%' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON aiaspeech_db.* TO 'aiaspeech_user'@'localhost';
GRANT ALL PRIVILEGES ON aiaspeech_db.* TO 'aiaspeech_user'@'%';
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
echo "IMPORTANT: Add this password to your .env file:"
echo "DB_PASSWORD=$DB_PASSWORD"
echo ""
echo "Next step: Edit your .env file and add the database password above."
