# Security Checklist - Before Pushing to GitHub

## ✅ Files That Are Safe to Commit

These files contain **NO secrets** and should be committed:

- ✅ `.env.example` - Template showing what variables are needed
- ✅ `.env.docker.example` - Docker-specific template
- ✅ `.gitignore` - Tells Git to ignore secret files
- ✅ All code files (`.py`, `.js`, `.jsx`, etc.)
- ✅ Configuration templates
- ✅ Documentation

## ❌ Files That Must NEVER Be Committed

These files contain **SECRETS** and must stay local or on VPS only:

- ❌ `.env` - Contains API keys, passwords, secrets
- ❌ `.env.local` - Local development secrets
- ❌ Any file with actual passwords or API keys
- ❌ Database dumps with real data
- ❌ Private keys or certificates

## 🔒 Pre-Commit Safety Check

Before pushing to GitHub, run this checklist:

### 1. Verify .gitignore is working
```bash
cd "C:\Users\Scott\OneDrive - AIA Copilot\Documents\Code"
git status
```

Look for any `.env` files in the output. If you see them, **STOP** - they shouldn't be there!

### 2. Check what files are being added
```bash
git add SunoApp/
git status
```

Review the list carefully. Make sure NO `.env` files are listed.

### 3. Search for accidentally committed secrets
```bash
git diff --cached | grep -i "password\|secret\|api_key"
```

If this shows actual passwords or keys, **DON'T COMMIT**.

### 4. Final verification
```bash
git ls-files | grep -E "\.env$|\.env\."
```

This should return NOTHING (or only `.env.example` files). If you see `.env`, run:
```bash
git rm --cached .env
```

## 🚨 If You Accidentally Commit Secrets

If you accidentally commit and push secrets:

1. **Immediately rotate/change all exposed credentials:**
   - Change SUNO_API_KEY
   - Change DB_PASSWORD
   - Change SECRET_KEY and JWT_SECRET_KEY
   - Update webhook URLs if they contain tokens

2. **Remove from Git history** (if just pushed):
   ```bash
   git reset --soft HEAD~1  # Undo last commit
   git push --force
   ```

3. **For older commits**, use:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   git push --force
   ```

## ✅ Current Status

**Your repository is currently SAFE:**
- ✅ `.gitignore` includes `.env` and `.env.local`
- ✅ No `.env` files found in local SunoApp directory
- ✅ `.env.example` files are present (safe to commit)
- ✅ SunoApp directory is untracked (nothing committed yet)

## 📝 When Setting Up on a New Machine

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Fill in the actual values in `.env`
4. Never commit `.env`

## 🔑 Secret Management Best Practices

- **Development:** Use `.env` (gitignored)
- **Production:** Use environment variables or secret management service
- **VPS:** Store `.env` at `/var/www/sunoapp/.env` (outside Git)
- **Team sharing:** Share `.env.example`, communicate real values securely (not via Git)
