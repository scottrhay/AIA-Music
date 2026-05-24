# AIA Music Docker Deployment Guide

Deploy AIA Music using Docker containers for a clean, isolated environment.

## Why Docker?

✅ **Clean VPS** - No system-wide dependencies
✅ **Easy removal** - `docker-compose down` removes everything
✅ **Portable** - Move to another server easily
✅ **Isolated** - Won't conflict with other apps
✅ **Easy rollback** - Just use previous image
✅ **Consistent** - Same environment everywhere

## Architecture

```
┌─────────────────────────────────────────────┐
│  Browser → https://music.aiacopilot.com     │
│                    ↓                         │
│         [Nginx Container] (port 80/443)     │
│                    ↓                         │
│         [AIA Music Container] (port 5000)     │
│                    ↓                         │
│         [Host MySQL] (existing)             │
│                    ↕                         │
│         [Host n8n] (existing)               │
└─────────────────────────────────────────────┘
```

**What's in containers:**
- AIA Music Flask backend + React frontend
- Nginx web server

**What's on the host (not containerized):**
- MySQL database (your existing installation)
- n8n (your existing installation)

This hybrid approach keeps your VPS clean while leveraging existing infrastructure.

## Prerequisites

- Docker installed on VPS
- Docker Compose installed
- MySQL running on host
- Domain configured (music.aiacopilot.com)

## Quick Start (30 minutes)

### 1. Install Docker (if not already installed)

```bash
# Update system
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

### 2. Upload Code to VPS

```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude 'venv' --exclude '.git' \
  AIA-Music/ root@srv800338.hstgr.cloud:/srv/apps/aiamusic/
```

### 3. Set Up Database

```bash
# SSH into VPS
ssh root@srv800338.hstgr.cloud

# Navigate to app directory
cd /srv/apps/aiamusic/deploy

# Make scripts executable
chmod +x *.sh

# Run database setup
./docker-setup-database.sh
```

**IMPORTANT:** Save the database password shown at the end!

### 4. Configure Environment

```bash
# Go to app root
cd /srv/apps/aiamusic

# Create .env file from template
cp .env.docker.example .env

# Edit .env file
nano .env
```

Fill in:
```bash
# Generate secret keys
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Database password from step 3
DB_PASSWORD=paste-password-from-database-setup

# Other settings are pre-configured
```

### 5. Deploy with Docker

```bash
cd /srv/apps/aiamusic/deploy
./docker-deploy.sh
```

This will:
- Build Docker images
- Start containers
- Set up networking
- Optionally configure SSL

### 6. Verify Deployment

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Check health
curl http://localhost:5000/health
```

Visit: https://music.aiacopilot.com

## Using the Makefile (Convenience Commands)

I've included a Makefile for easier management:

```bash
cd /srv/apps/aiamusic

# View all available commands
make help

# Start containers
make up

# View logs
make logs

# Restart containers
make restart

# Stop containers
make down

# Rebuild everything
make rebuild

# Open shell in app container
make shell
```

## Common Operations

### View Logs

```bash
# All logs
make logs

# Just app logs
make logs-app

# Just nginx logs
make logs-nginx

# Or using docker-compose directly
docker-compose logs -f aiamusic
```

### Restart Application

```bash
# Using Makefile
make restart

# Or docker-compose
docker-compose restart
```

### Update Application

When you have code changes:

```bash
# Upload new code
rsync -avz AIA-Music/ root@srv800338.hstgr.cloud:/srv/apps/aiamusic/

# SSH into VPS
ssh root@srv800338.hstgr.cloud
cd /srv/apps/aiamusic

# Rebuild and restart
make rebuild

# Or manually
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Access App Container Shell

```bash
make shell

# Or
docker-compose exec aiamusic sh

# Inside container, you can:
python  # Open Python shell
ls -la  # View files
cat logs/gunicorn_error.log  # View logs
```

### Stop Everything

```bash
# Stop containers (keeps data)
make down

# Stop and remove everything (including volumes)
make clean
```

## Complete Removal

To completely remove AIA Music and clean up your VPS:

```bash
cd /srv/apps/aiamusic

# Stop and remove containers
docker-compose down -v

# Remove images
docker rmi aiamusic-aiamusic aiamusic-nginx

# Remove directory
cd /var/www
rm -rf aiamusic

# Optionally remove database (if you want to start fresh)
mysql -u root -p
DROP DATABASE aiamusic_db;
DROP USER 'aiamusic_user'@'localhost';
DROP USER 'aiamusic_user'@'%';
exit;
```

**That's it!** Your VPS is now completely clean. No system-wide packages, no configuration files scattered around.

## Resource Usage

Default resource limits in docker-compose.yml:

```yaml
limits:
  cpus: '1.0'      # 1 CPU core max
  memory: 1G       # 1GB RAM max
```

Adjust these in `docker-compose.yml` if needed.

### Check Resource Usage

```bash
docker stats
```

## SSL Certificate Setup

### First Time Setup

```bash
# Stop nginx container
docker-compose stop nginx

# Get certificate (on host)
sudo certbot certonly --standalone -d music.aiacopilot.com

# Start nginx
docker-compose start nginx
```

### Auto-Renewal

Certbot on the host will auto-renew. After renewal, restart nginx:

```bash
docker-compose restart nginx
```

## Networking

### Container to Host Communication

The app container connects to host MySQL using `host.docker.internal`. This is configured in docker-compose.yml:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### Port Mapping

- **80** → Nginx (HTTP, redirects to HTTPS)
- **443** → Nginx (HTTPS)
- **5000** → AIA Music (internal, accessed via Nginx)

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs aiamusic

# Common issues:
# 1. Database connection failed
#    - Check DB_PASSWORD in .env
#    - Ensure MySQL allows connections from Docker network
#    - Test: docker-compose exec aiamusic ping host.docker.internal

# 2. Port already in use
#    - Check what's using port: sudo lsof -i :80
#    - Stop conflicting service
```

### Can't connect to MySQL from container

```bash
# Check MySQL bind address
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Should have:
bind-address = 0.0.0.0

# Restart MySQL
sudo systemctl restart mysql

# Test connection from container
docker-compose exec aiamusic sh
nc -zv host.docker.internal 3306
```

### SSL certificate not found

```bash
# Check if certificate exists on host
ls -la /etc/letsencrypt/live/music.aiacopilot.com/

# If not, get certificate
docker-compose stop nginx
sudo certbot certonly --standalone -d music.aiacopilot.com
docker-compose start nginx
```

### Container is restarting

```bash
# Check why
docker-compose ps
docker-compose logs aiamusic

# Check health
docker inspect aiamusic | grep -A 10 Health
```

## Monitoring

### Health Checks

Built-in health checks run automatically:

```bash
# View health status
docker inspect aiamusic | grep -A 10 Health

# Manual health check
curl http://localhost:5000/health
```

### Logs

Logs are stored in `/srv/apps/aiamusic/logs`:

```bash
# App logs
tail -f logs/gunicorn_access.log
tail -f logs/gunicorn_error.log

# Nginx logs
tail -f logs/nginx/access.log
tail -f logs/nginx/error.log
```

## Backups

### Backup Strategy

1. **Database:** Backup host MySQL
   ```bash
   mysqldump -u root -p aiamusic_db > backup_$(date +%Y%m%d).sql
   ```

2. **Code:** Your code is in git (hopefully!)

3. **Logs:** Optional, but can backup logs directory

### Restore

```bash
# Restore database
mysql -u root -p aiamusic_db < backup_20240101.sql

# Redeploy containers
cd /srv/apps/aiamusic
make up
```

## Performance Tuning

### Adjust Worker Count

Edit `backend/gunicorn_config.py`:

```python
# Default: auto-calculate based on CPUs
workers = multiprocessing.cpu_count() * 2 + 1

# For container, you might want fixed number:
workers = 4
```

Rebuild after changes:
```bash
make rebuild
```

### Adjust Resource Limits

Edit `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'      # Allow 2 CPU cores
      memory: 2G       # Allow 2GB RAM
```

Apply changes:
```bash
docker-compose up -d
```

## Security

Docker adds security layers:

- **Isolated filesystem:** Container can't access host files (except mounted volumes)
- **Network isolation:** Container network is isolated
- **Non-root user:** App runs as non-root user inside container
- **Resource limits:** Prevents resource exhaustion
- **Immutable:** Containers are read-only (except volumes)

## Comparison: Docker vs Direct Install

| Feature | Docker | Direct Install |
|---------|--------|----------------|
| **Setup Complexity** | Medium | Low |
| **VPS Cleanliness** | ✅ Very Clean | ❌ System-wide packages |
| **Easy Removal** | ✅ Yes (1 command) | ❌ Manual cleanup |
| **Portability** | ✅ Easy to move | ❌ Hard to move |
| **Rollback** | ✅ Easy | ❌ Manual |
| **Resource Usage** | ~100MB extra | Lower |
| **Debugging** | Medium difficulty | Easier |
| **Performance** | Slightly lower | Slightly higher |

## Next Steps

After deployment:

1. Update n8n workflow (see `docs/n8n_workflow_updates.md`)
2. Test end-to-end workflow
3. Invite team members
4. Set up monitoring/alerts (optional)
5. Configure automatic backups

## Getting Help

- Check logs: `make logs`
- Container status: `make status`
- Shell access: `make shell`
- View all commands: `make help`

---

**You now have a clean, containerized AIA Music deployment!** 🎉

To remove everything and start over: `make clean && cd /var/www && rm -rf aiamusic`
