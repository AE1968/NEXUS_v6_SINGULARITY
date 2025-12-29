---
description: Railway Deployment Procedure (Robust)
---

# Railway Deployment Procedure

This workflow ensures a robust deployment to Railway using `nixpacks.toml` configuration to avoid build errors.

## 1. Prerequisites
Ensure the `nixpacks.toml` file exists in the root directory with the following content (optimized for Python/Flask):

```toml
[phases.setup]
nixPkgs = ["python311", "gcc"]

[phases.install]
cmds = ["python -m pip install -r requirements.txt"]

[start]
cmd = "gunicorn app:app"
```

## 2. Deployment Steps

Run the following commands in the terminal:

1.  **Stage Changes:**
    ```bash
    git add .
    ```

2.  **Commit Changes:**
    ```bash
    git commit -m "Deployment Update: <Description>"
    ```

3.  **Push to Railway (via GitHub):**
    ```bash
    git push origin main
    ```

4.  **Verification:**
    - Monitor the build process in the Railway Dashboard.
    - Once "Active", verify the site at `https://kelionai.app`.
