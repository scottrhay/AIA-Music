# How to Push AIASpeech to GitHub Using VS Code

## Step 1: Open VS Code

1. Open VS Code
2. Go to **File > Open Folder**
3. Navigate to: `C:\Users\Scott\OneDrive - AIA Copilot\Documents\Code\AIASpeech`
4. Click **Select Folder**

## Step 2: Check Source Control Panel

1. Click the **Source Control** icon in the left sidebar (or press `Ctrl+Shift+G`)
2. You should see all your files listed as "Untracked" (with a "U" next to them)

## Step 3: Review Files Before Staging

**IMPORTANT:** Before adding files, make sure you don't see any `.env` files in the list!

✅ **SAFE to see:**
- `.env.example`
- `.env.docker.example`

❌ **STOP if you see:**
- `.env` (without "example")
- Any files with real passwords/keys

## Step 4: Stage Your Files

**Option A: Stage All Files**
1. Click the **"+"** button next to "Changes" to stage all files
2. Or hover over "Changes" and click **Stage All Changes**

**Option B: Stage Individual Files**
1. Hover over each file in the list
2. Click the **"+"** button next to files you want to commit

## Step 5: Verify Staged Files

1. Look at the "Staged Changes" section
2. Make sure NO `.env` files are staged (only `.env.example` is okay)
3. You can click on any file to see what changes will be committed

## Step 6: Write Commit Message

1. At the top of the Source Control panel, you'll see a text box that says "Message"
2. Type a descriptive commit message, for example:
   ```
   Initial commit: AIASpeech music creation platform

   - Flask backend with Azure Speech API integration
   - React frontend with song and style management
   - Docker deployment with MySQL
   - Direct Azure Speech API calls (removed n8n dependency for creation)
   - Comprehensive error handling for API failures
   ```

## Step 7: Commit

1. Click the **✓ Commit** button (or press `Ctrl+Enter`)
2. Your files are now committed locally (but not yet on GitHub)

## Step 8: Push to GitHub

### First Time Push (Creating New Repository)

If you haven't created a GitHub repository yet:

1. Go to [github.com](https://github.com) and log in
2. Click the **"+"** icon in the top-right → **New repository**
3. Name it: `AIASpeech`
4. Choose **Private** (recommended for projects with configuration files)
5. Do NOT initialize with README (you already have one)
6. Click **Create repository**

7. Copy the repository URL (it will look like: `https://github.com/yourusername/AIASpeech.git`)

8. Back in VS Code, open the **Terminal** (View > Terminal or `` Ctrl+` ``)

9. Run these commands:
   ```bash
   git remote add origin https://github.com/yourusername/AIASpeech.git
   git branch -M main
   git push -u origin main
   ```

### Subsequent Pushes

If the repository is already set up:

1. Click the **"..."** menu in Source Control panel
2. Select **Push** (or press `Ctrl+Shift+P` and type "Git: Push")

Or use the **↑** sync button at the bottom-left of VS Code

## Step 9: Verify on GitHub

1. Go to your GitHub repository in a web browser
2. Verify your files are there
3. **Double-check:** Make sure there's NO `.env` file visible (only `.env.example`)

## 🚨 Emergency: If You Accidentally Pushed Secrets

If you see `.env` or real passwords in your GitHub repository:

1. **Immediately change all passwords and API keys:**
   - SUNO_API_KEY
   - DB_PASSWORD
   - SECRET_KEY
   - JWT_SECRET_KEY

2. **Remove the file from Git:**
   ```bash
   git rm --cached .env
   git commit -m "Remove .env file"
   git push
   ```

3. **Remove from history** (this rewrites history):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   git push --force
   ```

## 📝 VS Code Tips

### View .gitignore
- Open `.gitignore` file to see what's being ignored
- Make sure `.env` is listed

### See What Will Be Committed
- Click on any file in Source Control to see the diff
- Green = additions, Red = deletions

### Undo Staging
- Click the **"-"** button next to a staged file to unstage it

### Discard Changes
- Right-click a file → **Discard Changes** (be careful!)

## ✅ Quick Safety Checklist

Before clicking Commit:

- [ ] No `.env` files in staged changes
- [ ] `.env.example` is present (this is good!)
- [ ] `.gitignore` includes `.env`
- [ ] No real passwords visible in the diff
- [ ] Commit message is descriptive

You're ready to push safely! 🚀
