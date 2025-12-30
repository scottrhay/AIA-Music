# SunoApp Installation Guide

Complete guide to deploy SunoApp on your Hostinger VPS.

## Prerequisites

- Hostinger VPS running Ubuntu 24.04 (✓ You have this)
- MySQL installed and running (✓ You have this)
- n8n installed (✓ You have this)
- Domain: suno.aiacopilot.com pointing to your VPS IP
- SSH access to your VPS

## Step-by-Step Installation

### 1. Upload Code to VPS

From your local machine, upload the SunoApp directory to your VPS:

```bash
# Using scp
scp -r SunoApp root@srv800338.hstgr.cloud:/var/www/

# OR using rsync (recommended)
rsync -avz --exclude 'node_modules' --exclude 'venv' --exclude '.git' \
  SunoApp/ root@srv800338.hstgr.cloud:/var/www/sunoapp/
```

### 2. Initial VPS Setup

SSH into your VPS:

```bash
ssh root@srv800338.hstgr.cloud
```

Run the VPS setup script:

```bash
cd /var/www/sunoapp/deploy
chmod +x *.sh
./setup_vps.sh
```

This will install:
- Python 3.11 and pip
- Nginx web server
- Certbot for SSL certificates
- Node.js 20 and npm

### 3. Database Setup

Run the database setup script:

```bash
./setup_database.sh
```

When prompted, enter your MySQL root password. The script will:
- Create database `sunoapp_db`
- Create user `sunoapp_user` with a generated password
- Import the database schema
- Display credentials (SAVE THESE!)

**Save the database password shown - you'll need it in the next step!**

### 4. Application Configuration

Run the configuration script:

```bash
./configure_app.sh
```

When prompted:
- Enter the database password from Step 3

This will:
- Create backend `.env` file with database credentials and secret keys
- Create frontend `.env` file with API URL
- Install Python dependencies
- Install npm dependencies

### 5. Deploy the Application

Run the deployment script:

```bash
./deploy.sh
```

This will:
- Build the React frontend
- Set up systemd service for Flask backend
- Configure Nginx
- Optionally set up SSL certificate

When prompted for SSL setup:
- Choose **Yes** if this is your first deployment
- Choose **No** if you want to set it up later

### 6. Configure DNS

Ensure your domain `suno.aiacopilot.com` points to your VPS IP:

1. Log in to your domain registrar (where you bought aiacopilot.com)
2. Add an A record:
   - Host: `suno`
   - Points to: `168.231.71.238` (your VPS IP)
   - TTL: 3600 (or default)

Wait 5-10 minutes for DNS propagation.

### 7. Set Up SSL Certificate (if skipped in step 5)

Once DNS is configured and pointing to your server:

```bash
sudo certbot --nginx -d suno.aiacopilot.com
```

Follow the prompts to set up the SSL certificate.

### 8. Update n8n Workflow

Follow the guide in `docs/n8n_workflow_updates.md` to update your n8n workflow to use the new MySQL database instead of Excel.

### 9. Test the Application

1. Visit https://suno.aiacopilot.com
2. Register a new account
3. Create a test song
4. Check that it appears in the song list
5. Verify n8n workflow picks it up

## Default Login

The database comes with a default admin account:

- **Username:** admin
- **Password:** admin123

**IMPORTANT:** Change this password immediately after first login!

## Post-Installation

### Create Additional Users

Users can register through the web interface, or you can create them via SQL:

```sql
-- Generate password hash first using Python
python3 -c "from flask_bcrypt import Bcrypt; bcrypt = Bcrypt(); print(bcrypt.generate_password_hash('your-password').decode('utf-8'))"

-- Then insert user
INSERT INTO users (username, email, password_hash)
VALUES ('username', 'email@example.com', 'HASH_FROM_ABOVE');
```

### Monitor Logs

View application logs:

```bash
# Flask application logs
sudo journalctl -u sunoapp -f

# Gunicorn access logs
tail -f /var/www/sunoapp/logs/gunicorn_access.log

# Gunicorn error logs
tail -f /var/www/sunoapp/logs/gunicorn_error.log

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Useful Commands

```bash
# Restart Flask application
sudo systemctl restart sunoapp

# Check Flask application status
sudo systemctl status sunoapp

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx configuration
sudo nginx -t

# Renew SSL certificate (automatic, but can be run manually)
sudo certbot renew

# Access MySQL
mysql -u sunoapp_user -p sunoapp_db
```

## Updating the Application

When you make changes to the code:

```bash
# Upload new code to VPS
rsync -avz --exclude 'node_modules' --exclude 'venv' \
  SunoApp/ root@srv800338.hstgr.cloud:/var/www/sunoapp/

# SSH into VPS
ssh root@srv800338.hstgr.cloud

# Rebuild frontend and restart services
cd /var/www/sunoapp
cd frontend && npm run build && cd ..
sudo systemctl restart sunoapp
sudo systemctl restart nginx
```

## Troubleshooting

### Application won't start

```bash
# Check Flask service status
sudo systemctl status sunoapp

# Check logs
sudo journalctl -u sunoapp -n 50
```

Common issues:
- Database connection failed: Check `.env` file credentials
- Port already in use: Check if another service is using port 5000
- Permission denied: Check file permissions

### Can't access website

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

Common issues:
- SSL certificate not found: Run certbot
- Domain not resolving: Check DNS settings
- Firewall blocking: Check VPS firewall settings

### Database connection errors

```bash
# Test MySQL connection
mysql -u sunoapp_user -p sunoapp_db

# Check if MySQL is running
sudo systemctl status mysql
```

### 502 Bad Gateway

This usually means the Flask backend isn't running:

```bash
sudo systemctl restart sunoapp
sudo systemctl status sunoapp
```

## Security Recommendations

1. **Change default admin password**
2. **Set up automatic security updates:**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

3. **Set up firewall:**
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

4. **Regular backups:**
   ```bash
   # Backup database
   mysqldump -u root -p sunoapp_db > backup_$(date +%Y%m%d).sql
   ```

5. **Keep secrets in `.env` files secure**
   - Never commit `.env` files to git
   - Use strong, random secret keys

## Getting Help

If you encounter issues:
1. Check the logs (see Monitor Logs section above)
2. Verify DNS is pointing to correct IP
3. Ensure all services are running
4. Check firewall settings
5. Review error messages carefully

## Next Steps

- Set up regular database backups
- Configure email notifications (optional)
- Customize the UI colors/branding
- Add more music styles
- Invite team members
