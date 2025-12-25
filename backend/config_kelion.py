# KELION Configuration File for Render Deployment
# This file contains all configuration variables needed for the backend

import os

# PayPal Configuration (Sandbox for testing)
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "YOUR_PAYPAL_CLIENT_ID")
PAYPAL_SECRET = os.getenv("PAYPAL_SECRET", "YOUR_PAYPAL_SECRET")

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "KELION_SECRET_KEY_2025_PRODUCTION")

# Database
DB_NAME = os.getenv("DB_NAME", "kelion_mainframe.db")

# SMTP Email Configuration
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "noreply@kelionai.app")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))

# CORS - Allowed Origins
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "https://kelionai.app,http://localhost:8000").split(",")

# Domain
DOMAIN = os.getenv("DOMAIN", "kelionai.app")
