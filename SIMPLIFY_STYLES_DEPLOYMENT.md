# Simplify Styles Feature - Deployment Guide

## What Changed

Simplified the Styles feature from 6 separate fields to just 2 fields, matching your Excel workflow:

**Before:**
- Style Name
- Genre
- Beat
- Mood
- Vocals
- Instrumentation
- Style Description

**After:**
- Style Name
- Style Prompt (the full Azure Speech prompt)

## Files Modified

### Backend
1. `backend/app/models.py` - Updated Style model
2. `backend/app/routes/styles.py` - Updated API endpoints

### Frontend
3. `frontend/src/components/StyleModal.js` - Simplified UI to 2 fields

### Database
4. `database/migration_simplify_styles.sql` - Database migration script

## Deployment Steps

### Step 1: Run Database Migration (on VPS)

```bash
# SSH into your VPS
ssh root@srv800338.hstgr.cloud

# Upload the migration file
# (From local PC first):
scp database/migration_simplify_styles.sql root@srv800338.hstgr.cloud:/tmp/

# On VPS, run the migration
docker exec -i mysql mysql -u root -p aiaspeech_db < /tmp/migration_simplify_styles.sql
```

This will:
- Add new `style_prompt` column
- Migrate existing data (combines all fields into one prompt)
- Remove old columns
- Update the database view

### Step 2: Upload Updated Code (from local PC)

```bash
# Upload backend changes
scp backend/app/models.py root@srv800338.hstgr.cloud:/var/www/aiaspeech/backend/app/
scp backend/app/routes/styles.py root@srv800338.hstgr.cloud:/var/www/aiaspeech/backend/app/routes/

# Upload frontend changes
scp frontend/src/components/StyleModal.js root@srv800338.hstgr.cloud:/var/www/aiaspeech/frontend/src/components/
```

### Step 3: Rebuild and Deploy (on VPS)

```bash
# Rebuild the Docker containers
cd /var/www/aiaspeech
docker compose down
docker compose build --no-cache
docker compose up -d

# Verify containers are running
docker compose ps
```

### Step 4: Rebuild Frontend (on local PC)

```bash
# In VS Code terminal
cd frontend

# Build with correct API URL
$env:REACT_APP_API_URL="https://speech.aiacopilot.com/api/v1"
npm run build

# Upload to VPS
cd ..
scp -r frontend/build root@srv800338.hstgr.cloud:/var/www/aiaspeech/frontend/
```

### Step 5: Restart Nginx (on VPS)

```bash
cd /var/www/aiaspeech
docker compose restart nginx
```

### Step 6: Test

1. Visit https://speech.aiacopilot.com
2. Log in
3. Go to "Manage Styles"
4. Click "Add New Style"
5. You should see just 2 fields:
   - Style Name
   - Style Prompt

6. Create a test style and verify it saves

## Rollback Plan

If something goes wrong, you can rollback the database:

```sql
-- Restore old structure (if needed)
ALTER TABLE styles
  ADD COLUMN genre TEXT AFTER name,
  ADD COLUMN beat TEXT AFTER genre,
  ADD COLUMN mood TEXT AFTER beat,
  ADD COLUMN vocals TEXT AFTER mood,
  ADD COLUMN instrumentation TEXT AFTER vocals,
  ADD COLUMN style_description TEXT AFTER instrumentation;

-- Remove style_prompt
ALTER TABLE styles DROP COLUMN style_prompt;
```

Then revert the code changes and rebuild.

## Notes

- Existing styles will have their data migrated automatically
- The old fields are combined into a single prompt
- The UI is much simpler now - just like your Excel workflow!
- You can paste your full Azure Speech prompt directly into the Style Prompt field
