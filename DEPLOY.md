# 🚀 GENEZA NEXUS KELION - Deployment Guide

## Quick Deploy to Render.com (FREE)

### Step 1: Create GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "GENEZA NEXUS KELION v12 - Production Ready"

# Create repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/geneza-nexus-kelion.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render.com

1. **Go to:** https://render.com
2. **Sign up** with GitHub
3. **Click:** "New +" → "Web Service"
4. **Connect** your GitHub repository
5. **Configure:**
   - **Name:** geneza-nexus-kelion
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free

6. **Add Environment Variables:**
   - `OPENAI_API_KEY` = your_openai_key
   - `FLASK_SECRET_KEY` = random_secret_key_here
   - (Optional) `ELEVENLABS_API_KEY` = your_elevenlabs_key

7. **Click:** "Create Web Service"

### Step 3: Wait for Deployment

- Render will automatically:
  - Install dependencies
  - Build the application
  - Deploy to a public URL
  - Provide HTTPS certificate

### Your Live URL

After deployment (5-10 minutes), you'll get:
```
https://geneza-nexus-kelion.onrender.com
```

---

## Alternative: Deploy to Heroku

### Prerequisites
```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

### Deploy Steps
```bash
# Login to Heroku
heroku login

# Create app
heroku create geneza-nexus-kelion

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key_here
heroku config:set FLASK_SECRET_KEY=random_secret

# Deploy
git push heroku main

# Open app
heroku open
```

---

## Files Created for Deployment

✅ **Procfile** - Tells platform how to run the app
✅ **runtime.txt** - Specifies Python version
✅ **requirements.txt** - Updated with gunicorn
✅ **app.py** - Updated for production (dynamic port, 0.0.0.0 host)

---

## Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `FLASK_SECRET_KEY` | No | Auto-generated if not set |
| `ELEVENLABS_API_KEY` | No | For premium voice (optional) |
| `PORT` | No | Auto-set by platform |

---

## Post-Deployment Checklist

- [ ] App is accessible via public URL
- [ ] Can create account / login
- [ ] Chat with KELION works
- [ ] Voice synthesis works
- [ ] Vision system works (camera permissions)
- [ ] Marketplace loads
- [ ] Mainframe console accessible

---

## Troubleshooting

**App crashes on startup:**
- Check environment variables are set
- Verify OPENAI_API_KEY is valid
- Check logs: `heroku logs --tail` or Render dashboard

**Database errors:**
- SQLite is created automatically
- For production, consider PostgreSQL upgrade

**Static files not loading:**
- Ensure `/assets/` folder is committed to git
- Check CORS settings in app.py

---

## Free Tier Limitations

**Render.com Free:**
- App sleeps after 15 min inactivity
- 750 hours/month
- Slower cold starts

**Heroku Free (Deprecated):**
- Consider Render or Railway instead

---

## Scaling to Production

For heavy traffic, upgrade to:
- **Render:** Starter ($7/month) or Pro ($25/month)
- **Railway:** Pay-as-you-go
- **AWS/Azure:** Full control, higher cost

---

**Your GENEZA NEXUS KELION is now ready for the world! 🌍🚀**
