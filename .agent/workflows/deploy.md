---
description: Deploy KELION to Railway and verify it works correctly
---

# KELION Deployment & Verification Workflow

## Step 1: Commit Changes
// turbo
```bash
git add -A && git commit -m "Update KELION"
```

## Step 2: Push to Railway
// turbo
```bash
git push origin main
```

## Step 3: Wait for Railway Build
Wait 60-90 seconds for Railway to build and deploy. You can check status at:
https://railway.app/project/YOUR_PROJECT_ID

## Step 4: Hard Refresh & Verify
Open browser to https://kelionai.app/ and:
1. Press Ctrl+Shift+R (hard refresh to clear cache)
2. Wait 5 seconds for full page load
3. Check the version number in top-left (should match latest)

## Step 5: Test Login Flow
1. Click LOGIN button
2. Enter "demo" for username
3. Enter "demo" for password
4. Click INITIALIZE
5. Verify the welcome message appears correctly

## Step 6: If Changes Not Visible
If the site still shows old content:

### Option A: Force Railway Redeploy
Go to Railway dashboard → Click "Deploy" → "Redeploy"

### Option B: Check Build Logs
```bash
# View recent commits
git log -3 --oneline

# Verify remote is correct
git remote -v
```

### Option C: Clear Cloudflare Cache (if using)
If using Cloudflare, purge cache from dashboard.

## Step 7: Verify Bot Response
After login, the bot should display:
- Welcome message with user greeting
- Proper formatting (not raw HTML/markdown)
- Interactive buttons if applicable

## Troubleshooting

### Deploy Failed
1. Check Railway logs for errors
2. Run locally to test: `python backend/server.py`
3. Fix any Python syntax errors

### Changes Not Updating
1. Verify commit was pushed: `git log origin/main -1`
2. Check Railway build status
3. Try incognito window to bypass cache

### CORS/API Errors
1. Check browser console for errors
2. Verify server is running
3. Check Railway environment variables
