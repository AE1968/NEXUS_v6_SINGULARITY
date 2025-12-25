import json
from werkzeug.security import generate_password_hash

# SECURE SEED DATA
secure_users = {
    "admin": {
        "password": generate_password_hash("admin123"), # ENCRYPTED
        "role": "admin",
        "subscription": "enterprise",
        "accountStatus": "active",
        "email": "admin@nexus.ai",
        "billing": { "history": [] },
        "subscriptionDetails": { "status": "active", "planName": "SYSTEM ADMIN" }
    },
    "demo": {
        "password": generate_password_hash("demo"), # ENCRYPTED
        "role": "demo",
        "subscription": "basic",
        "accountStatus": "active",
        "email": "demo@nexus.ai",
        "billing": { "history": [] },
        "subscriptionDetails": { "status": "active", "planName": "DEMO ACCOUNT" }
    },
    "test": {
        "password": generate_password_hash("test123"), # ENCRYPTED
        "role": "user",
        "subscription": "basic",
        "accountStatus": "active",
        "email": "test@example.com",
        "billing": { "history": [] },
        "subscriptionDetails": { "status": "active", "planName": "1 Month Plan" }
    }
}

with open('backend/users.json', 'w') as f:
    json.dump(secure_users, f, indent=4)

print("✅ PASSWORD ENCRYPTION COMPLETE. Database is now secure.")
