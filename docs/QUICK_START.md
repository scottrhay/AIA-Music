# AIA Music Quick Start Guide

Get AIA Music up and running in 30 minutes.

## Overview

AIA Music is a web-based music creation management platform that:
- Manages songs and music styles
- Integrates with Azure Speech API for song generation
- Replaces your Excel workflow with a modern database
- Supports team collaboration

## Quick Deployment Checklist

### 1. Prerequisites ✓

You already have:
- ✓ Hostinger VPS (Ubuntu 24.04, 2 CPU, 8GB RAM)
- ✓ MySQL installed
- ✓ n8n installed
- ✓ Domain: music.aiacopilot.com

### 2. Upload Code (5 minutes)

```bash
# From your local machine
cd "C:\Users\Scott\OneDrive - AIA Copilot\Documents\Code"
rsync -avz --exclude 'node_modules' --exclude 'venv' \
  AIA-Music/ root@srv800338.hstgr.cloud:/srv/apps/aiamusic/
```

### 3. Initial Setup (10 minutes)

```bash
# SSH into VPS
ssh root@srv800338.hstgr.cloud

# Run setup scripts
cd /srv/apps/aiamusic/deploy
chmod +x *.sh
./setup_vps.sh        # Install system dependencies
./setup_database.sh   # Create database (SAVE THE PASSWORD!)
./configure_app.sh    # Configure application
```

### 4. Deploy (5 minutes)

```bash
./deploy.sh
```

Say **Yes** when prompted for SSL setup.

### 5. Update n8n (10 minutes)

Follow: `docs/n8n_workflow_updates.md`

Key changes:
- Replace Excel reads with MySQL queries
- Replace Excel updates with API webhooks
- Test with one song

## First Login

1. Visit: https://music.aiacopilot.com
2. Sign in with the configured Microsoft account or an admin account created through the approved setup path.
3. Do not use or document shared default passwords.

## Create Your First Song

1. Click "Add New Song"
2. Fill in:
   - Title: Test Song
   - Lyrics: Your lyrics
   - Style: Choose from dropdown
   - Vocal: Male/Female
3. Click "Create Song"
4. Song status will be "Create"
5. n8n will pick it up and submit to Azure Speech
6. Status will change to "Submitted" then "Completed"

## Quick Reference

### Access Points

- **App:** https://music.aiacopilot.com
- **API:** https://music.aiacopilot.com/api/v1
- **Health:** https://music.aiacopilot.com/health

### Common Commands

```bash
# SSH into VPS
ssh root@srv800338.hstgr.cloud

# Restart app
sudo systemctl restart aiamusic

# View logs
sudo journalctl -u aiamusic -f

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status aiamusic
```

### Database Access

```bash
mysql -u aiamusic_user -p aiamusic_db
```

### File Locations

- App: `/srv/apps/aiamusic`
- Logs: `/srv/apps/aiamusic/logs`
- Config: `/srv/apps/aiamusic/backend/.env`

## What's Next?

1. **Add team members:**
   - They can register at the login page
   - Or create accounts via SQL

2. **Import your styles:**
   - Go to "Manage Styles"
   - Add your music styles from Excel

3. **Migrate existing songs (optional):**
   - Create SQL script to import from Excel
   - Or start fresh

4. **Customize:**
   - Update colors in CSS
   - Add your logo
   - Adjust workflow

## Troubleshooting

### Can't access website

```bash
# Check DNS
nslookup music.aiacopilot.com

# Check nginx
sudo systemctl status nginx
sudo nginx -t

# Check SSL
sudo certbot certificates
```

### App not responding

```bash
# Check Flask
sudo systemctl status aiamusic
sudo journalctl -u aiamusic -n 50

# Restart
sudo systemctl restart aiamusic
```

### Database errors

```bash
# Test connection
mysql -u aiamusic_user -p aiamusic_db

# Check logs
sudo tail -f /srv/apps/aiamusic/logs/gunicorn_error.log
```

## Need Help?

1. Check logs first
2. Review full documentation:
   - `docs/INSTALLATION.md` - Detailed setup
   - `docs/API.md` - API reference
   - `docs/DEVELOPMENT.md` - Development guide
   - `docs/n8n_workflow_updates.md` - n8n integration

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Users → https://music.aiacopilot.com       │
│           ↓                                  │
│        Nginx (SSL + Proxy)                  │
│           ↓                                  │
│  ┌────────────────┬─────────────────────┐  │
│  │ React Frontend │ Flask API (Gunicorn)│  │
│  │ (Static files) │   (Python/REST)     │  │
│  └────────────────┴──────────┬──────────┘  │
│                               ↓              │
│                        MySQL Database       │
│                               ↕              │
│                          n8n Workflows      │
│                               ↕              │
│                          Azure Speech API           │
└─────────────────────────────────────────────┘
```

## Success Criteria

You'll know it's working when:
- ✓ You can login at https://music.aiacopilot.com
- ✓ You can create and view songs
- ✓ n8n picks up songs with status "create"
- ✓ Songs get submitted to Azure Speech
- ✓ Completed songs show download URLs

## Estimated Costs

- **VPS:** ~$10/month (you already have this)
- **Domain:** ~$12/year (you already have this)
- **SSL:** $0 (Let's Encrypt free)
- **Total additional cost:** $0/month

You're already paying for the VPS and domain, so AIA Music costs nothing extra!

Enjoy your new song management platform! 🎵
