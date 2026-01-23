# AIASpeech Docker Deployment Checklist

Clean, containerized deployment that keeps your VPS pristine.

## Why Docker?

✅ **Keep VPS clean** - No system-wide dependencies
✅ **Easy removal** - One command removes everything
✅ **Portable** - Move to another server easily
✅ **Isolated** - Won't conflict with other apps

## Pre-Deployment

- [ ] Code ready in local directory
- [ ] SSH access to VPS (srv800338.hstgr.cloud)
- [ ] MySQL root password available
- [ ] Domain DNS configured (speech.aiacopilot.com → 168.231.71.238)

## Step 1: Install Docker on VPS

```bash
ssh root@srv800338.hstgr.cloud
```

- [ ] SSH connected

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt-get install -y docker-compose-plugin
```

- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Verified with `docker --version` and `docker compose version`

## Step 2: Upload Code

From local machine:

```bash
rsync -avz --exclude 'node_modules' --exclude 'venv' --exclude '.git' \
  AIASpeech/ root@srv800338.hstgr.cloud:/var/www/aiaspeech/
```

- [ ] Code uploaded successfully
- [ ] Verified files exist on VPS: `ls /var/www/aiaspeech`

## Step 3: Database Setup

```bash
cd /var/www/aiaspeech/deploy
chmod +x *.sh
./docker-setup-database.sh
```

When prompted:
- [ ] Entered MySQL root password
- [ ] Database `aiaspeech_db` created
- [ ] User `aiaspeech_user` created
- [ ] Schema imported
- [ ] **SAVED database password** ⚠️ CRITICAL!

Database Password: `________________________________`

## Step 4: Configure Environment

```bash
cd /var/www/aiaspeech
cp .env.docker.example .env
nano .env
```

Generate and add secrets:

```bash
# Generate keys
openssl rand -hex 32  # Use for SECRET_KEY
openssl rand -hex 32  # Use for JWT_SECRET_KEY
```

Edit .env:
- [ ] `SECRET_KEY` set (generated above)
- [ ] `JWT_SECRET_KEY` set (generated above)
- [ ] `DB_PASSWORD` set (from Step 3)
- [ ] `DB_NAME=aiaspeech_db` ✓ (already set)
- [ ] `DB_USER=aiaspeech_user` ✓ (already set)
- [ ] `DOMAIN=speech.aiacopilot.com` ✓ (already set)

## Step 5: Deploy Application

```bash
cd /var/www/aiaspeech/deploy
./docker-deploy.sh
```

- [ ] Docker images built successfully
- [ ] Containers started
- [ ] When prompted for SSL, chose YES
- [ ] SSL certificate obtained
- [ ] Containers showing as "Up" in `docker-compose ps`

## Step 6: Verify Deployment

Test endpoints:

```bash
# Health check
curl http://localhost:5000/health

# View container status
docker-compose ps

# Check logs
docker-compose logs -f aiaspeech
```

- [ ] Health check returns `{"status":"healthy"}`
- [ ] All containers showing "Up"
- [ ] No errors in logs
- [ ] Can visit https://speech.aiacopilot.com
- [ ] Login page loads

## Step 7: First Login

- [ ] Visit https://speech.aiacopilot.com
- [ ] Login with admin/admin123
- [ ] Changed admin password immediately
- [ ] Created test song
- [ ] Test song appears in list

## Step 8: Update n8n Workflow

Follow `docs/n8n_workflow_updates.md`:

- [ ] Updated n8n to query MySQL instead of Excel
- [ ] Updated n8n to call AIASpeech webhooks
- [ ] Tested with one song end-to-end:
  - [ ] Song created with status "create"
  - [ ] n8n picked up song
  - [ ] Song status changed to "submitted"
  - [ ] Azure Speech callback received
  - [ ] Song status changed to "completed"
  - [ ] Download URLs populated

## Step 9: Security & Setup

- [ ] Firewall configured:
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```

- [ ] Set up automatic MySQL backups:
  ```bash
  # Add to crontab: crontab -e
  0 2 * * * mysqldump -u root -p'PASSWORD' aiaspeech_db > /var/backups/aiaspeech_$(date +\%Y\%m\%d).sql
  ```

- [ ] Documented useful commands (bookmark these):
  ```bash
  # View logs
  cd /var/www/aiaspeech && make logs

  # Restart
  make restart

  # Stop everything
  make down

  # Complete removal
  make clean && cd /var/www && rm -rf aiaspeech
  ```

## Step 10: Team Setup

- [ ] Added music styles from Excel
- [ ] Invited team members to register
- [ ] Tested multi-user access

## Post-Deployment Tests

Verify each feature works:

- [ ] User registration
- [ ] User login
- [ ] Create song
- [ ] Edit song
- [ ] Delete song
- [ ] Filter by status
- [ ] Filter by style
- [ ] Search songs
- [ ] Create style
- [ ] Edit style
- [ ] View style details
- [ ] n8n picks up new songs
- [ ] Songs complete successfully
- [ ] Download URLs appear

## Useful Commands Reference

```bash
# Navigate to app
cd /var/www/aiaspeech

# View all commands
make help

# Start
make up

# Stop
make down

# Restart
make restart

# View logs
make logs            # All logs
make logs-app        # Just app
make logs-nginx      # Just nginx

# Shell access
make shell

# Rebuild everything
make rebuild

# Check status
make status

# Complete cleanup
make clean
```

## Docker-Specific Commands

```bash
# View running containers
docker-compose ps

# View all Docker containers
docker ps -a

# View logs
docker-compose logs -f

# Shell into app container
docker-compose exec aiaspeech sh

# Restart specific service
docker-compose restart aiaspeech

# View resource usage
docker stats

# Remove everything
docker-compose down -v
rm -rf /var/www/aiaspeech
```

## Backup Strategy

- [ ] Database backup script created
- [ ] Tested database restore
- [ ] Code in version control (git)

## Monitoring

- [ ] Bookmarked log locations:
  - App logs: `/var/www/aiaspeech/logs/gunicorn_*.log`
  - Container logs: `docker-compose logs -f`
  - Nginx logs: `/var/www/aiaspeech/logs/nginx/`

## Complete Removal (If Needed)

To completely remove AIASpeech and restore VPS to clean state:

```bash
cd /var/www/aiaspeech
make clean
cd /var/www
rm -rf aiaspeech

# Optionally remove database
mysql -u root -p
DROP DATABASE aiaspeech_db;
DROP USER 'aiaspeech_user'@'localhost';
DROP USER 'aiaspeech_user'@'%';
exit;
```

**Your VPS is now completely clean!** No leftover packages or configuration files.

## Success Criteria

✅ Deployment successful when:

- Application accessible at https://speech.aiacopilot.com
- All containers running (`docker-compose ps` shows "Up")
- Can login and manage songs
- n8n integration working
- Songs complete successfully
- Team can collaborate
- Can completely remove with one command

## Troubleshooting

**Can't connect to MySQL from container:**
```bash
# Edit MySQL config
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Set: bind-address = 0.0.0.0
sudo systemctl restart mysql
```

**Container won't start:**
```bash
docker-compose logs aiaspeech
# Check error messages
```

**SSL certificate issues:**
```bash
docker-compose stop nginx
sudo certbot certonly --standalone -d speech.aiacopilot.com
docker-compose start nginx
```

## Notes

Deployment notes:

```
Date: ____________________
Deployed by: ____________________
Database password saved: ____________________
Issues encountered: ____________________
____________________
____________________
```

---

## Estimated Time: 30-45 minutes

## Cost: $0/month (using existing VPS)

## Clean Removal: One command

**Ready to deploy?** Start with Step 1! 🚀
