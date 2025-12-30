# SunoApp Deployment Checklist

Use this checklist to deploy SunoApp to your Hostinger VPS.

## Pre-Deployment

- [ ] Code is ready in local directory
- [ ] You have SSH access to VPS (srv800338.hstgr.cloud)
- [ ] MySQL root password is available
- [ ] Domain (suno.aiacopilot.com) DNS is configured or ready to configure

## Step 1: Upload Code

```bash
rsync -avz --exclude 'node_modules' --exclude 'venv' --exclude '.git' \
  SunoApp/ root@srv800338.hstgr.cloud:/var/www/sunoapp/
```

- [ ] Code uploaded successfully
- [ ] SSH into VPS: `ssh root@srv800338.hstgr.cloud`

## Step 2: VPS Setup

```bash
cd /var/www/sunoapp/deploy
chmod +x *.sh
./setup_vps.sh
```

- [ ] System packages updated
- [ ] Python 3.11 installed
- [ ] Nginx installed
- [ ] Certbot installed
- [ ] Node.js 20 installed
- [ ] App directory created at `/var/www/sunoapp`

## Step 3: Database Setup

```bash
./setup_database.sh
```

When prompted:
- [ ] Entered MySQL root password
- [ ] Database `sunoapp_db` created
- [ ] User `sunoapp_user` created
- [ ] Schema imported
- [ ] **SAVED database password shown at end** ⚠️ IMPORTANT!

Database Password: `________________________`

## Step 4: Application Configuration

```bash
./configure_app.sh
```

When prompted:
- [ ] Entered database password from Step 3
- [ ] Backend `.env` file created
- [ ] Frontend `.env` file created
- [ ] Python dependencies installed
- [ ] npm dependencies installed

## Step 5: DNS Configuration

In your domain registrar (where you manage aiacopilot.com):

- [ ] Added A record:
  - Host: `suno`
  - Type: `A`
  - Value: `168.231.71.238`
  - TTL: `3600`
- [ ] Waited 5-10 minutes for DNS propagation
- [ ] Verified DNS: `nslookup suno.aiacopilot.com` returns correct IP

## Step 6: Deploy Application

```bash
./deploy.sh
```

- [ ] React frontend built successfully
- [ ] Systemd service created and started
- [ ] Nginx configured
- [ ] When prompted for SSL, chose YES
- [ ] SSL certificate obtained from Let's Encrypt
- [ ] Application is running

## Step 7: Verify Deployment

- [ ] Visit https://suno.aiacopilot.com (should see login page)
- [ ] Check health endpoint: https://suno.aiacopilot.com/health
- [ ] Login with admin/admin123
- [ ] Change admin password immediately
- [ ] Create test song
- [ ] Verify song appears in list

## Step 8: Update n8n Workflow

Follow `docs/n8n_workflow_updates.md`:

- [ ] Added MySQL credentials to n8n
- [ ] Updated "Get Songs" node to use MySQL
- [ ] Updated "Submit to Suno" webhook to call API
- [ ] Updated "Suno Callback" webhook to call API
- [ ] Tested with one song end-to-end
- [ ] Verified song status changes: create → submitted → completed

## Step 9: Security & Configuration

- [ ] Changed default admin password
- [ ] Created additional user accounts
- [ ] Set up firewall:
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Verified all `.env` files are not in git
- [ ] Set up automatic security updates:
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

## Step 10: Add Content

- [ ] Added all music styles from Excel
- [ ] Optionally imported existing songs (or starting fresh)
- [ ] Invited team members to register

## Post-Deployment Verification

Test each major feature:

- [ ] User registration works
- [ ] User login works
- [ ] Create song works
- [ ] Edit song works
- [ ] Delete song works
- [ ] Filter songs by status works
- [ ] Filter songs by style works
- [ ] Search songs works
- [ ] Create style works
- [ ] Edit style works
- [ ] View style details works
- [ ] n8n picks up new songs
- [ ] n8n submits to Suno successfully
- [ ] Webhook updates song status
- [ ] Download URLs appear when complete

## Monitoring Setup

- [ ] Bookmarked log commands:
  ```bash
  # Application logs
  sudo journalctl -u sunoapp -f

  # Access logs
  tail -f /var/www/sunoapp/logs/gunicorn_access.log

  # Error logs
  tail -f /var/www/sunoapp/logs/gunicorn_error.log
  ```

- [ ] Set up database backup cron job (optional):
  ```bash
  # Add to crontab: crontab -e
  0 2 * * * mysqldump -u sunoapp_user -p'PASSWORD' sunoapp_db > /var/backups/sunoapp_$(date +\%Y\%m\%d).sql
  ```

## Documentation Review

Read through:

- [ ] `docs/QUICK_START.md` - Quick reference
- [ ] `docs/INSTALLATION.md` - Detailed installation guide
- [ ] `docs/API.md` - API documentation
- [ ] `docs/DEVELOPMENT.md` - Development guide
- [ ] `docs/n8n_workflow_updates.md` - n8n integration

## Troubleshooting Resources

If something goes wrong:

1. **Check service status:**
   ```bash
   sudo systemctl status sunoapp
   sudo systemctl status nginx
   sudo systemctl status mysql
   ```

2. **View recent logs:**
   ```bash
   sudo journalctl -u sunoapp -n 100
   ```

3. **Test database connection:**
   ```bash
   mysql -u sunoapp_user -p sunoapp_db
   ```

4. **Test Nginx config:**
   ```bash
   sudo nginx -t
   ```

5. **Restart services:**
   ```bash
   sudo systemctl restart sunoapp
   sudo systemctl restart nginx
   ```

## Success Criteria

✅ Deployment is successful when:

- You can access https://suno.aiacopilot.com
- You can login and create songs
- n8n workflow submits songs to Suno
- Completed songs show download URLs
- All team members can access and use the app
- No errors in application logs

## Rollback Plan

If deployment fails:

1. Keep Excel workflow running (don't modify n8n yet)
2. Debug issues using logs
3. Fix and redeploy
4. Only switch n8n workflow when app is fully working

## Notes

Space for deployment notes:

```
Deployment Date: ____________________
Deployed By: ____________________
Database Password Location: ____________________
Issues Encountered: ____________________
____________________
____________________
```

---

## Quick Command Reference

```bash
# Access VPS
ssh root@srv800338.hstgr.cloud

# Restart app
sudo systemctl restart sunoapp

# View logs
sudo journalctl -u sunoapp -f

# Access database
mysql -u sunoapp_user -p sunoapp_db

# Rebuild frontend
cd /var/www/sunoapp/frontend && npm run build

# Full restart
sudo systemctl restart sunoapp && sudo systemctl restart nginx
```

---

**Estimated Total Time:** 30-45 minutes

**Cost:** $0 (using existing VPS and domain)

**Next Steps After Deployment:** Start creating songs! 🎵
