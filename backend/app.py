import os
import sys
import json
import logging
import random
import datetime
import jwt
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import google.generativeai as genai

# Adaugam folderul curent la path pentru a asigura importul configurarii
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from config_kelion import PAYPAL_CLIENT_ID, PAYPAL_SECRET, SECRET_KEY, DB_NAME, SMTP_EMAIL, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT, ALLOWED_ORIGINS, DOMAIN
except ImportError:
    print("ERROR: config_kelion.py not found in backend folder!")
    sys.exit(1)

# ==============================================================================
#  INIT
# ==============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')
DB_PATH = os.path.join(BASE_DIR, DB_NAME)

app = Flask(__name__, static_folder=ROOT_DIR)
app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, origins=ALLOWED_ORIGINS)
db = SQLAlchemy(app)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day"],
    storage_uri="memory://",
)

# AI CONFIGURATION
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "NOT_SET")
ai_model = None

if GOOGLE_API_KEY != "NOT_SET":
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        ai_model = genai.GenerativeModel('gemini-1.5-pro')
        print("✅ Gemini AI Initialized.")
    except Exception as e:
        print(f"⚠️ Gemini AI Init Failed: {e}")

# ==============================================================================
# MODELS
# ==============================================================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(80))
    last_name = db.Column(db.String(80))
    phone = db.Column(db.String(20))
    country = db.Column(db.String(50))
    role = db.Column(db.String(20), default='user')
    subscription = db.Column(db.String(20), default='basic')
    subscription_end_date = db.Column(db.DateTime)
    account_status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    billing_history = db.Column(db.Text, default='[]')

    def is_subscription_active(self):
        if self.role == 'admin':
            return True
        if self.subscription == 'demo':
            return True # Demo accounts handle expiration differently or are temporary
        if not self.subscription_end_date:
            return False
        return datetime.datetime.utcnow() < self.subscription_end_date

# ==============================================================================
# PAYPAL UTILS
# ==============================================================================

def get_paypal_access_token():
    try:
        # Switch to sandbox for testing, live for production
        # Assuming sandbox for now as per conventional development
        url = "https://api-m.sandbox.paypal.com/v1/oauth2/token"
        res = requests.post(
            url,
            auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
            data={"grant_type": "client_credentials"},
            timeout=10
        )
        return res.json().get('access_token')
    except Exception as e:
        print(f"PayPal Token Error: {e}")
        return None

def verify_paypal_subscription(subscription_id):
    token = get_paypal_access_token()
    if not token:
        return False, "Gateway Offline"
    
    try:
        url = f"https://api-m.sandbox.paypal.com/v1/billing/subscriptions/{subscription_id}"
        res = requests.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        data = res.json()
        if data.get('status') in ['ACTIVE', 'APPROVED']:
            return True, data
        return False, f"Status: {data.get('status')}"
    except Exception as e:
        return False, str(e)

# ==============================================================================
# EMAIL UTILS
# ==============================================================================

def send_confirmation_email(to_email, username, first_name, subscription, expiry_date):
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = '✅ Bun venit la GENEZA NEXUS!'
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        
        html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 30px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a0a2e, #0a0a0a); border: 1px solid #00f3ff; border-radius: 10px; padding: 30px;">
                <h1 style="color: #00f3ff; text-align: center;">🚀 GENEZA NEXUS</h1>
                <h2 style="color: #bc13fe;">Bun venit, {first_name}!</h2>
                <p>Contul tău a fost creat cu succes.</p>
                <hr style="border-color: #00f3ff; opacity: 0.3;">
                <p><strong>Username:</strong> {username}</p>
                <p><strong>Email:</strong> {to_email}</p>
                <p><strong>Abonament:</strong> {subscription.upper()}</p>
                <p><strong>Valabil până la:</strong> {expiry_date}</p>
                <hr style="border-color: #00f3ff; opacity: 0.3;">
                <p style="text-align: center;">
                    <a href="https://{DOMAIN}/" style="display: inline-block; background: linear-gradient(135deg, #bc13fe, #00f3ff); color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accesează NEXUS</a>
                </p>
                <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">Acest email a fost trimis automat. Nu răspunde la acest mesaj.</p>
            </div>
        </body>
        </html>
        '''
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        
        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

# ==============================================================================
# ROUTES
# ==============================================================================

@app.route('/status')
def status():
    return jsonify({"status": "online", "system": "KELION v10.0", "engine": "Flask/Python"})

@app.route('/api/config')
def get_config():
    return jsonify({"paypal_client_id": PAYPAL_CLIENT_ID, "api_url": request.host_url.rstrip('/')})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    first_name = data.get('first_name', '')
    last_name = data.get('last_name', '')
    phone = data.get('phone', '')
    country = data.get('country', '')
    subscription = data.get('subscription', 'basic')
    
    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "Email already registered"}), 400
        
    # Verify PayPal if not demo
    # TODO: Re-enable for production (see REMINDER_BEFORE_ONLINE.txt)
    # *** BETA MODE - FREE ACCESS CONFIGURATION ***
    # Automatic switch: Free until Jan 1st, 2026 (System Time)
    # After this date, payment is strictly required.
    BETA_DEADLINE = datetime.datetime(2026, 1, 1) # Auto-switch date
    CURRENT_TIME = datetime.datetime.utcnow()
    
    # Logic: If we are BEFORE the deadline, Beta Mode is Active (True)
    BETA_MODE = CURRENT_TIME < BETA_DEADLINE
    
    paypal_id = data.get('paypal_subscription_id')
    
    if subscription != 'demo' and not BETA_MODE:
        # --- PAYMENT REQUIRED MODE (Normal Operation) ---
        if not paypal_id:
            return jsonify({"success": False, "error": "Full System Active. Subscription payment required."}), 402
        
        valid, pp_data = verify_paypal_subscription(paypal_id)
        if not valid:
            return jsonify({"success": False, "error": f"Payment verification failed: {pp_data}"}), 402
    else:
        # --- BETA MODE (Free Access) ---
        print(f"⚠️ BETA MODE ACTIVE (Valid until {BETA_DEADLINE}): skipping payment for {email}")
        if not paypal_id:
             paypal_id = "BETA_GENESIS_USER"


    username = email.split('@')[0]
    if User.query.filter_by(username=username).first():
        username = email
        
    # Set expiration: 30 days for basic, more for others
    # In a real app, we'd base this on the actual PayPal plan duration
    days = 30
    if subscription == 'premium': days = 90
    if subscription == 'enterprise': days = 365
    
    expiry = datetime.datetime.utcnow() + datetime.timedelta(days=days)
    
    new_user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        country=country,
        subscription=subscription,
        subscription_end_date=expiry,
        role='user',
        billing_history=json.dumps([{
            "event": "registration",
            "paypal_id": paypal_id,
            "date": datetime.datetime.utcnow().isoformat()
        }]) if paypal_id else "[]"
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Send confirmation email
    send_confirmation_email(
        to_email=email,
        username=username,
        first_name=first_name,
        subscription=subscription,
        expiry_date=expiry.strftime('%d %B %Y')
    )
    
    return jsonify({
        "success": True, 
        "message": "Registration successful! Check your email.",
        "username": username,
        "expiry": expiry.strftime('%Y-%m-%d')
    })

@app.route('/api/paypal/webhook', methods=['POST'])
def paypal_webhook():
    data = request.json
    event_type = data.get('event_type')
    resource = data.get('resource', {})
    subscription_id = resource.get('id')
    
    if not subscription_id:
        return jsonify({"status": "ignored"}), 200
        
    print(f"WEBHOOK RECEIVED: {event_type} for {subscription_id}")
    
    # Simple logic: if payment fails or sub cancelled, deactivate user
    # In production, use HMAC verification or check with PayPal API
    
    if event_type == 'BILLING.SUBSCRIPTION.CANCELLED' or event_type == 'BILLING.SUBSCRIPTION.EXPIRED':
        # Find user and mark as inactive
        # Since we don't store subscription_id directly in the User model in the previous step (my bad),
        # let's search in billing_history or ideally we should have a separate column.
        # For simplicity, let's assume we search billing history.
        users = User.query.all()
        for u in users:
            if subscription_id in u.billing_history:
                u.account_status = 'inactive'
                db.session.commit()
                print(f"User {u.username} deactivated (Subscription Cancelled)")
                break
                
    elif event_type == 'PAYMENT.SALE.COMPLETED':
        # Subscription payment successful (recurring)
        # Extend expiration
        users = User.query.all()
        for u in users:
            if subscription_id in u.billing_history:
                u.subscription_end_date = u.subscription_end_date + datetime.timedelta(days=30)
                u.account_status = 'active'
                db.session.commit()
                print(f"User {u.username} subscription extended")
                break
                
    return jsonify({"status": "received"}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()
    if not user:
        user = User.query.filter_by(email=data.get('username')).first() # Allow login with email too

    if user and check_password_hash(user.password_hash, data.get('password')):
        if not user.is_subscription_active():
            return jsonify({"success": False, "error": "Subscription expired. Please renew."}), 403
            
        token = jwt.encode({
            'username': user.username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            "success": True, 
            "token": token, 
            "role": user.role, 
            "subscription": user.subscription, 
            "username": user.username,
            "expiry": user.subscription_end_date.strftime('%Y-%m-%d') if user.subscription_end_date else 'Never'
        })
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/api/nexus/chat', methods=['POST'])
def nexus_chat():
    data = request.json
    user_msg = data.get('user_msg', data.get('message', ''))
    
    if not user_msg:
        return jsonify({"reply": "..."})

    if not ai_model:
        return jsonify({
            "reply": "[SYSTEM]: Nexus logic core offline (API Key Missing). How can I assist you in technical mode?",
            "brain": "OFFLINE"
        })

    try:
        response = ai_model.generate_content(user_msg)
        return jsonify({
            "reply": response.text,
            "brain": "GEMINI"
        })
    except Exception as e:
        return jsonify({
            "reply": f"[ERROR]: Neural bridge failure. {str(e)}",
            "brain": "ERROR"
        })

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    
    if not username or not email:
        return jsonify({"success": False, "error": "Username and email are required"}), 400
        
    user = User.query.filter_by(username=username, email=email).first()
    if user:
        # Generate a temporary password
        chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#%'
        temp_password = 'Temp' + ''.join(random.choice(chars) for _ in range(8)) + '!'
        
        # Update user's password
        user.password_hash = generate_password_hash(temp_password)
        db.session.commit()
        
        # In production, send email here. For now, we return it for the user to see.
        return jsonify({
            "success": True, 
            "message": "A new password has been generated.",
            "temp_password": temp_password
        })
    
    return jsonify({"success": False, "error": "User not found or email mismatch"}), 404

# --- STATIC FILES ---
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    assets_folder = os.path.join(app.static_folder, 'assets')
    return send_from_directory(assets_folder, filename)

@app.route('/')
def index():
    return jsonify({
        "status": "ONLINE",
        "system": "KELION/NEXUS v10.0 GOLD",
        "auth": "ACTIVE",
        "ai": "READY" if ai_model else "OFFLINE"
    })

@app.route('/<path:path>')
def assets(path):
    if not os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, 'index.html')
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    with app.app_context():
        if not os.path.exists(DB_PATH):
            db.create_all()
            admin = User(
                username='admin', 
                email='admin@kelion.ai', 
                password_hash=generate_password_hash('Andrada_1968!'), 
                role='admin', 
                subscription='enterprise'
            )
            demo = User(
                username='demo', 
                email='demo@kelion.ai', 
                password_hash=generate_password_hash('demo'), 
                role='demo', 
                subscription='demo',
                subscription_end_date=datetime.datetime.utcnow() + datetime.timedelta(days=365)
            )
            db.session.add(admin)
            db.session.add(demo)
            db.session.commit()
            print("✓ Database and default accounts created.")
    
    print(f"🚀 KELION READY: http://localhost:8000")
    app.run(port=8000, debug=False, host='127.0.0.1')
