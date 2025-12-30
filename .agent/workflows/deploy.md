---
description: Deploy KELION to Railway with automatic verification and PASS/FAIL report
---

# KELION Deployment Workflow

This workflow deploys changes to kelionai.app via Railway and provides a final PASS/FAIL report.

## Prerequisites
- All code changes must be saved
- Git repository must be configured

## Deployment Steps

// turbo-all

### Step 1: Check for uncommitted changes
```bash
git status --porcelain
```
- If output is empty: No changes to deploy → SKIP to verification
- If output has files: Continue to Step 2

### Step 2: Stage all changes
```bash
git add -A
```

### Step 3: Commit with timestamp
```bash
git commit -m "Deploy: [DESCRIPTION] - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
```
- Replace [DESCRIPTION] with brief change description

### Step 4: Push to GitHub (triggers Railway auto-deploy)
```bash
git push origin main
```
- If FAIL: Check network connection and GitHub credentials
- If SUCCESS: Continue to Step 5

### Step 5: Wait for Railway deployment (3 minutes)
```bash
Start-Sleep -Seconds 180
```

### Step 6: Verify deployment on live site
Use browser to navigate to https://kelionai.app and check:
1. Page loads successfully (HTTP 200)
2. Version number matches expected version
3. All expected text/features are present

## Final Report Format

```
╔════════════════════════════════════════════════════════════╗
║                  DEPLOYMENT REPORT                         ║
╠════════════════════════════════════════════════════════════╣
║ Date/Time:    [TIMESTAMP]                                  ║
║ Target:       kelionai.app                                 ║
║ Commit:       [COMMIT_HASH]                                ║
║ Changes:      [FILES_CHANGED] files                        ║
╠════════════════════════════════════════════════════════════╣
║ STEP 1 - Git Status:        [PASS/FAIL]                    ║
║ STEP 2 - Git Add:           [PASS/FAIL]                    ║
║ STEP 3 - Git Commit:        [PASS/FAIL]                    ║
║ STEP 4 - Git Push:          [PASS/FAIL]                    ║
║ STEP 5 - Wait Deploy:       [DONE]                         ║
║ STEP 6 - Site Verification: [PASS/FAIL]                    ║
╠════════════════════════════════════════════════════════════╣
║ FINAL STATUS:  [✅ PASS / ❌ FAIL]                          ║
║ FAILURE CAUSE: [None / Description of failure]             ║
╚════════════════════════════════════════════════════════════╝
```

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| Git push rejected | Remote has newer commits | Run `git pull --rebase` then push again |
| Site not updated | Railway cache | Wait 5 more minutes or trigger manual redeploy |
| 502 Bad Gateway | App crash on Railway | Check Railway logs for error |
| SSL Error | DNS propagation | Wait 10-15 minutes |
