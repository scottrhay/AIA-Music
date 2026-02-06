# RUNBOOK: AIA Music Platform

**Service**: Music Production & AI Generation  
**URL**: https://music.aiacopilot.com (assumed)  
**Owner**: Hur (DevOps & Production)  
**Last Updated**: 2026-02-05

---

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React/Next.js - Music player & generation interface
- **Backend**: Flask (Python) - Music AI services
- **Database**: PostgreSQL 16
- **Storage**: File uploads for audio files

### VPS Deployment
- **Server**: 168.231.71.238 (port 22777)
- **Path**: `/srv/apps/aiamusic` (and `/opt/AIAMusic` - duplicate?)
- **User**: scott (use sudo for docker commands)
- **Port**: 5000 (backend), 5437 (database), 5800 (nginx)

### External Dependencies
- PostgreSQL database (port 5437)
- Nginx reverse proxy (port 5800)
- Audio file storage volume

---

## 🏥 Health Checks

### Primary Health Check
```bash
curl -I https://music.aiacopilot.com
# Expected: HTTP/2 200
```

### Backend Health
```bash
ssh vps "curl -s http://localhost:5000/health"
# Expected: {"status":"ok"}
```

### Container Health
```bash
ssh vps "cd /srv/apps/aiamusic && sudo docker compose ps"
```

### Database Connection
```bash
ssh vps "sudo docker exec aiamusic-postgres pg_isready"
# Expected: accepting connections
```

---

## 📋 Operations

### View Logs

**All services:**
```bash
ssh vps "cd /srv/apps/aiamusic && sudo docker compose logs -f"
```

**Backend only:**
```bash
ssh vps "cd /srv/apps/aiamusic && sudo docker compose logs -f backend"
```

**Nginx:**
```bash
ssh vps "cd /srv/apps/aiamusic && sudo docker compose logs -f nginx"
```

### Restart Services

**Restart all:**
```bash
ssh vps "cd /srv/apps/aiamusic && sudo docker compose restart"
```

**Restart backend only:**
```bash
ssh vps "cd /srv/apps/aiamusic && sudo docker compose restart backend"
```

**Full rebuild:**
```bash
ssh vps "cd /srv/apps/aiamusic && sudo docker compose up -d --build --force-recreate"
```

### Stop/Start Services

**Stop all:**
```bash
ssh vps "cd /srv/apps/aiamusic && sudo docker compose down"
```

**Start all:**
```bash
ssh vps "cd /srv/apps/aiamusic && sudo docker compose up -d"
```

---

## 🐛 Common Issues & Fixes

### Issue: Music Generation Fails

**Symptoms**: AI generation returns 500 error  
**Cause**: Python library missing or API key invalid

**Fix:**
```bash
# Check backend logs for Python errors
ssh vps "cd /srv/apps/aiamusic && sudo docker compose logs backend --tail=100"

# Verify environment variables
ssh vps "cd /srv/apps/aiamusic && grep -E 'API|KEY' .env"

# Restart backend
ssh vps "cd /srv/apps/aiamusic && sudo docker compose restart backend"
```

---

### Issue: Audio Files Not Playing

**Symptoms**: Upload succeeds but playback fails  
**Cause**: File storage volume mount issue or incorrect MIME type

**Fix:**
```bash
# Check upload volume
ssh vps "sudo docker volume inspect aiamusic_uploads"

# Check backend logs for file access errors
ssh vps "cd /srv/apps/aiamusic && sudo docker compose logs backend | grep -i 'file\|upload'"

# Verify file permissions
ssh vps "sudo docker exec aiamusic-backend ls -la /app/uploads/"
```

---

### Issue: Duplicate Deployment Confusion

**Symptoms**: Changes deployed to wrong location  
**Cause**: Two deployment paths exist: /opt/AIAMusic AND /srv/apps/aiamusic

**Fix:**
```bash
# Check which one is active
ssh vps "sudo docker ps | grep aiamusic"

# Standardize on /srv/apps/aiamusic (newer)
# Remove /opt/AIAMusic if unused
```

---

## 🔄 Rollback Procedure

**Step 1: Get previous version**
```bash
cd \\diamondstar\ai$\AIAMusic
git log --oneline -10
git checkout <previous-commit>
```

**Step 2: Deploy manually**
```bash
scp -r * vps:/tmp/aiamusic-rollback/

ssh vps "sudo rsync -av --exclude '.env' /tmp/aiamusic-rollback/ /srv/apps/aiamusic/"
ssh vps "cd /srv/apps/aiamusic && sudo docker compose up -d --build"
ssh vps "rm -rf /tmp/aiamusic-rollback"
```

**Step 3: Verify**
```bash
curl -I https://music.aiacopilot.com
```

---

## 🔐 Database Operations

### Access Database
```bash
ssh vps "sudo docker exec -it aiamusic-postgres psql -U <username> -d aiamusic"
```

### Database Backup
```bash
ssh vps "sudo docker exec aiamusic-postgres pg_dump -U <username> aiamusic > /tmp/aiamusic_backup_$(date +%Y%m%d).sql"

# Download
scp vps:/tmp/aiamusic_backup_*.sql C:/backups/
```

---

## 📊 Monitoring

### Performance Metrics
```bash
# Container stats
ssh vps "sudo docker stats --no-stream | grep aiamusic"

# Disk usage (audio files can be large)
ssh vps "df -h /srv/apps/aiamusic"

# Upload volume size
ssh vps "sudo docker volume inspect aiamusic_uploads | grep Mountpoint"
```

---

## 🚨 Emergency Contacts

**P1 Incidents**:
- Primary: Hur (DevOps)
- Developer: Tov
- **Impact**: Internal/demo tool

---

## 📝 Deployment History

See: `CHANGES.md` and `DEPLOYMENT_CHECKLIST.md` in repo

---

## 📚 Additional Resources

- **Local Repo**: `\\diamondstar\ai$\AIAMusic`
- **Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Docker Checklist**: `DOCKER_DEPLOYMENT_CHECKLIST.md`
- **CDN Recommendations**: `CDN_Recommendation.md`
- **Git Push Guide**: `GIT_PUSH_GUIDE.md`
- **PORT-REGISTRY.md**: Port 5000 (backend), 5437 (postgres), 5800 (nginx)

---

**Last Incident**: Unknown  
**Last Deployment**: 2026-01-28 (based on .git modification time)  
**Current Status**: Running (needs health verification)
