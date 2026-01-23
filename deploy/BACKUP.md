# AIAMusic Backup & Restore Guide

## Overview

This guide covers backing up and restoring AIAMusic data:
- **Database** - MySQL database with users, songs, playlists, styles
- **Audio files** - MP3 files stored in `/opt/AIAMusic/data/audio/`
- **Configuration** - Environment variables in `.env`

## Quick Reference

```bash
# Manual backup
cd /opt/AIAMusic/deploy
export DB_PASSWORD="your-db-password"
./backup.sh

# Restore from backup
./restore.sh /opt/backups/aiamusic/aiamusic_20240115_120000.tar.gz

# Check backup status
ls -lh /opt/backups/aiamusic/
```

---

## Backup Strategy

### What Gets Backed Up

| Component | Location | Backup File |
|-----------|----------|-------------|
| Database | MySQL `sunoapp_db` | `database.sql.gz` |
| Audio | `/opt/AIAMusic/data/audio/` | `audio.tar.gz` |
| Config | `/opt/AIAMusic/.env` | `env.backup` |

### Storage Requirements

- **Per song**: ~10-15 MB (two 5-7 MB tracks)
- **100 songs**: ~1.5 GB
- **1000 songs**: ~15 GB
- **Database**: Usually < 100 MB

---

## Setup Instructions

### 1. Copy Scripts to VPS

```bash
# From your local machine
scp deploy/backup.sh deploy/restore.sh deploy/BACKUP.md \
    root@168.231.71.238:/opt/AIAMusic/deploy/

# Make executable
ssh root@168.231.71.238 "chmod +x /opt/AIAMusic/deploy/*.sh"
```

### 2. Create Backup Directory

```bash
ssh root@168.231.71.238
mkdir -p /opt/backups/aiamusic
```

### 3. Test Manual Backup

```bash
cd /opt/AIAMusic/deploy
export DB_PASSWORD="your-database-password"
./backup.sh
```

You should see output like:
```
[2024-01-15 12:00:00] Starting AIAMusic backup...
[2024-01-15 12:00:01] Database backup complete: 2.5M
[2024-01-15 12:00:15] Audio backup complete: 156M
[2024-01-15 12:00:16] Final archive created: /opt/backups/aiamusic/aiamusic_20240115_120000.tar.gz (158M)
```

---

## Scheduled Backups (Cron)

### Daily Backup at 3 AM

```bash
# Edit crontab
crontab -e

# Add this line:
0 3 * * * DB_PASSWORD="your-db-password" /opt/AIAMusic/deploy/backup.sh >> /var/log/aiamusic-backup.log 2>&1
```

### Weekly Full Backup (Sundays at 2 AM)

For larger deployments, you might want weekly full backups:

```bash
# Weekly backup with longer retention
0 2 * * 0 DB_PASSWORD="your-db-password" RETENTION_DAYS=90 /opt/AIAMusic/deploy/backup.sh >> /var/log/aiamusic-backup.log 2>&1
```

### Verify Cron is Running

```bash
# Check cron logs
tail -f /var/log/aiamusic-backup.log

# List scheduled jobs
crontab -l
```

---

## Remote Backup (Recommended)

For disaster recovery, sync backups off the VPS.

### Option A: Rsync to Another Server

Edit `backup.sh` and uncomment:
```bash
REMOTE_BACKUP_ENABLED=true
REMOTE_HOST="user@backup-server.com"
REMOTE_PATH="/backups/aiamusic"
```

### Option B: Sync to Cloud Storage (rclone)

1. Install rclone:
```bash
curl https://rclone.org/install.sh | bash
rclone config  # Follow prompts for your cloud provider
```

2. Create a sync script `/opt/AIAMusic/deploy/sync-to-cloud.sh`:
```bash
#!/bin/bash
rclone sync /opt/backups/aiamusic remote:aiamusic-backups --progress
```

3. Add to cron (run after backup):
```bash
30 3 * * * /opt/AIAMusic/deploy/sync-to-cloud.sh >> /var/log/aiamusic-backup.log 2>&1
```

### Option C: Download to Local Machine

```bash
# From your local machine, download latest backup
scp root@168.231.71.238:/opt/backups/aiamusic/aiamusic_*.tar.gz ~/Backups/AIAMusic/
```

---

## Restore Procedures

### Full Restore (Database + Audio + Config)

```bash
ssh root@168.231.71.238
cd /opt/AIAMusic/deploy
export DB_PASSWORD="your-db-password"

# Preview what will be restored
./restore.sh /opt/backups/aiamusic/aiamusic_20240115_120000.tar.gz --dry-run

# Perform restore
./restore.sh /opt/backups/aiamusic/aiamusic_20240115_120000.tar.gz
```

### Database Only

```bash
./restore.sh /opt/backups/aiamusic/aiamusic_20240115_120000.tar.gz --db-only
```

### Audio Files Only

```bash
./restore.sh /opt/backups/aiamusic/aiamusic_20240115_120000.tar.gz --audio-only
```

### Force Restore (Skip Confirmation)

```bash
./restore.sh backup.tar.gz --force
```

---

## Disaster Recovery

### Scenario: VPS is Lost

1. **Provision new VPS** with Docker and Docker Compose

2. **Restore Traefik and MySQL** (from your infrastructure backups)

3. **Clone the repo and deploy**:
```bash
git clone <your-repo> /opt/AIAMusic
cd /opt/AIAMusic
cp .env.example .env
# Edit .env with your credentials
docker compose up -d
```

4. **Restore from backup**:
```bash
# Copy backup file to new server
scp ~/Backups/AIAMusic/aiamusic_latest.tar.gz root@new-server:/opt/backups/

# Restore
cd /opt/AIAMusic/deploy
export DB_PASSWORD="your-db-password"
./restore.sh /opt/backups/aiamusic_latest.tar.gz
```

5. **Verify**:
```bash
curl https://music.aiacopilot.com/health
docker compose logs -f aiamusic
```

### Scenario: Accidental Data Deletion

1. **Stop the app** to prevent further changes:
```bash
cd /opt/AIAMusic
docker compose stop aiamusic
```

2. **Find the most recent backup**:
```bash
ls -lt /opt/backups/aiamusic/
```

3. **Restore**:
```bash
./restore.sh /opt/backups/aiamusic/aiamusic_YYYYMMDD_HHMMSS.tar.gz
```

---

## Monitoring & Alerts

### Check Backup Health

Create `/opt/AIAMusic/deploy/check-backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/aiamusic"
MAX_AGE_HOURS=36  # Alert if no backup in 36 hours

latest=$(find "$BACKUP_DIR" -name "*.tar.gz" -mmin -$((MAX_AGE_HOURS * 60)) | head -1)

if [ -z "$latest" ]; then
    echo "ALERT: No AIAMusic backup in the last ${MAX_AGE_HOURS} hours!"
    exit 1
else
    echo "OK: Latest backup: $latest"
    exit 0
fi
```

Add to cron for daily check:
```bash
0 9 * * * /opt/AIAMusic/deploy/check-backup.sh || mail -s "AIAMusic Backup Alert" you@email.com
```

---

## Retention Policy

Default: **30 days** of backups

To change, edit `backup.sh`:
```bash
RETENTION_DAYS=30  # Change this value
```

Storage estimate for 30 days:
- Small usage (100 songs): ~50 GB
- Medium usage (500 songs): ~250 GB
- Heavy usage (1000+ songs): ~500 GB+

---

## Troubleshooting

### "DB_PASSWORD not set"
```bash
export DB_PASSWORD="your-database-password"
# Or edit backup.sh directly
```

### "MySQL container not running"
```bash
docker ps | grep mysql
docker start mysql
```

### "Permission denied" on audio directory
```bash
sudo chown -R root:root /opt/AIAMusic/data
```

### Backup is too large
Consider:
1. Reduce RETENTION_DAYS
2. Compress more aggressively
3. Use incremental backups (rsync)

### Restore fails mid-way
The scripts are designed to be re-runnable. Just fix the issue and run again.

---

## Backup Contents Reference

A typical backup archive contains:
```
aiamusic_20240115_120000/
├── manifest.json       # Backup metadata
├── database.sql.gz     # MySQL dump (compressed)
├── audio.tar.gz        # Audio files archive
├── env.backup          # .env file copy
└── docker-compose.yml  # Docker config
```
