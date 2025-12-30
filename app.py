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

# Add current folder to path to ensure configuration import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import version from centralized file
from version import VERSION, get_version_info

# Configuration Loading (Cloud Native - Environment Variables)
def get_env(key, default=""):
    return os.getenv(key, default)

# CORE SECRETS
SECRET_KEY = get_env("SECRET_KEY", f"kelion_super_secret_key_{VERSION}")
DB_NAME = get_env("DB_NAME", "nexus.db")

# API KEYS - Set these in Railway Variables!
OPENAI_API_KEY = get_env("OPENAI_API_KEY", "")
SERPER_API_KEY = get_env("SERPER_API_KEY", "")
ELEVENLABS_API_KEY = get_env("ELEVENLABS_API_KEY", "")
AZURE_SPEECH_KEY = get_env("AZURE_SPEECH_KEY", "")
AZURE_SPEECH_REGION = get_env("AZURE_SPEECH_REGION", "westeurope")

# EMAIL / PAYMENT (Defaults)
PAYPAL_CLIENT_ID = get_env("PAYPAL_CLIENT_ID", "")
PAYPAL_SECRET = get_env("PAYPAL_SECRET", "")
PAYPAL_MODE = get_env("PAYPAL_MODE", "live")  # "sandbox" sau "live" - DEFAULT: LIVE

# PayPal URLs based on mode
PAYPAL_API_BASE = "https://api-m.paypal.com" if PAYPAL_MODE == "live" else "https://api-m.sandbox.paypal.com"

SMTP_EMAIL = get_env("SMTP_EMAIL", "contact@kelionai.app")
SMTP_PASSWORD = get_env("SMTP_PASSWORD", "")
SMTP_SERVER = get_env("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(get_env("SMTP_PORT", "587"))

# CORS
ALLOWED_ORIGINS = get_env("ALLOWED_ORIGINS", "*").split(",")

# ==============================================================================
#  INIT
# ==============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')
DB_PATH = os.path.join(BASE_DIR, DB_NAME)

app = Flask(__name__, static_folder=BASE_DIR)
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

# ==============================================================================
# WEB SEARCH (SERPER API)
# ==============================================================================
def search_web(query, num_results=5):
    """Search the web using Serper API for real-time information"""
    if not SERPER_API_KEY:
        return {"error": "SERPER_API_KEY not configured"}
    
    try:
        url = "https://google.serper.dev/search"
        headers = {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "q": query,
            "num": num_results
        }
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            results = []
            for item in data.get("organic", [])[:num_results]:
                results.append({
                    "title": item.get("title", ""),
                    "snippet": item.get("snippet", ""),
                    "link": item.get("link", "")
                })
            return {"success": True, "results": results}
        else:
            return {"error": f"Serper API error: {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}

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
    
    # === CÃ‚MPURI NOI v143 ===
    # AdresÄƒ completÄƒ
    address_line1 = db.Column(db.String(255))
    address_line2 = db.Column(db.String(255))
    city = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    phone_country_code = db.Column(db.String(5))  # +40, +44, etc.
    
    # VerificÄƒri securitate
    email_verified = db.Column(db.Boolean, default=False)
    phone_verified = db.Column(db.Boolean, default=False)
    bank_verified = db.Column(db.Boolean, default=False)
    
    # SMS Verification
    sms_verification_code = db.Column(db.String(6))
    sms_code_sent_at = db.Column(db.DateTime)
    
    # PayPal recurring
    paypal_subscription_id = db.Column(db.String(100))
    
    # Password reset
    reset_token = db.Column(db.String(100))
    reset_token_expires = db.Column(db.DateTime)
    
    # Voucher usage count
    vouchers_used_count = db.Column(db.Integer, default=0)

    def is_subscription_active(self):
        if self.role == 'admin':
            return True
        if self.subscription == 'demo':
            return True
        if not self.subscription_end_date:
            return False
        return datetime.datetime.utcnow() < self.subscription_end_date
    
    def can_use_voucher(self):
        """Check if user can use more vouchers (max 3)"""
        return self.vouchers_used_count < 3


class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    user_message = db.Column(db.Text, nullable=False)
    ai_response = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    gender = db.Column(db.String(10), default='male')


class DemoTracking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(50), nullable=False)
    last_access = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    total_seconds_used = db.Column(db.Integer, default=0)


class OTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    otp_type = db.Column(db.String(20), default='registration')  # registration, password_reset, phone_verify
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    name = db.Column(db.String(100), default='Anonymous')
    topic = db.Column(db.String(50), nullable=False)
    topic_label = db.Column(db.String(100))
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user_agent = db.Column(db.String(255))
    source = db.Column(db.String(255))
    status = db.Column(db.String(20), default='new')
    admin_notes = db.Column(db.Text)


# ==============================================================================
# MODELE NOI v143: Vouchere, PlÄƒÈ›i, Trafic
# ==============================================================================

class VoucherCode(db.Model):
    """Coduri voucher pentru abonamente gratuite"""
    __tablename__ = 'voucher_codes'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    value_months = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    created_by = db.Column(db.String(80))
    
    # Alocare
    allocated_to_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    allocated_at = db.Column(db.DateTime, nullable=True)
    
    # Utilizare
    is_used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime, nullable=True)
    used_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    expires_at = db.Column(db.DateTime, nullable=True)


class PaymentRecord(db.Model):
    """EvidenÈ›a tuturor plÄƒÈ›ilor"""
    __tablename__ = 'payment_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    amount_gbp = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='GBP')
    payment_method = db.Column(db.String(50))  # paypal, stripe, voucher
    
    paypal_order_id = db.Column(db.String(100))
    paypal_subscription_id = db.Column(db.String(100))
    voucher_code = db.Column(db.String(20))
    
    plan_id = db.Column(db.String(20))  # 1_month, 6_months, 12_months
    subscription_start = db.Column(db.DateTime)
    subscription_end = db.Column(db.DateTime)
    
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, refunded
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    confirmation_email_sent = db.Column(db.Boolean, default=False)


class VisitorLog(db.Model):
    """Tracking trafic pentru admin"""
    __tablename__ = 'visitor_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    page_visited = db.Column(db.String(255))
    referrer = db.Column(db.String(500))
    
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    year = db.Column(db.Integer)
    month = db.Column(db.Integer)
    day = db.Column(db.Integer)
    hour = db.Column(db.Integer)
    
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    username = db.Column(db.String(80), nullable=True)


class ExpiryNotification(db.Model):
    """Tracking notificÄƒri expirare"""
    __tablename__ = 'expiry_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    notification_type = db.Column(db.String(20))  # 2_days_before, expired, reactivation
    sent_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    email_sent = db.Column(db.Boolean, default=False)


# ==============================================================================
# PLANURI ABONAMENT (Hardcoded)
# ==============================================================================
SUBSCRIPTION_PLANS = {
    '1_month': {'name': '1 Month', 'days': 30, 'price': 10.00, 'per_month': 10.00},
    '6_months': {'name': '6 Months', 'days': 180, 'price': 42.00, 'per_month': 7.00},
    '12_months': {'name': '12 Months', 'days': 365, 'price': 60.00, 'per_month': 5.00}
}

# Coduri È›Äƒri pentru telefon
COUNTRY_PHONE_CODES = {
    'RO': '+40', 'UK': '+44', 'US': '+1', 'DE': '+49', 'FR': '+33',
    'IT': '+39', 'ES': '+34', 'NL': '+31', 'BE': '+32', 'AT': '+43',
    'CH': '+41', 'PL': '+48', 'CZ': '+420', 'HU': '+36', 'BG': '+359',
    'GR': '+30', 'PT': '+351', 'SE': '+46', 'NO': '+47', 'DK': '+45'
}

# ==============================================================================
# PAYPAL UTILS
# ==============================================================================
# ... (rest of utils same)

# ... (routes)

@app.route('/api/history', methods=['GET'])
def get_history():
    username = request.args.get('username')
    auth_header = request.headers.get('Authorization')
    
    if not username or not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
        
    try:
        # Simple token validation (in prod verify JWT properly)
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        if decoded['username'] != username:
             return jsonify({"success": False, "error": "Forbidden"}), 403
    except:
         return jsonify({"success": False, "error": "Invalid Token"}), 401
         
    # Fetch history
    history = ChatHistory.query.filter_by(username=username).order_by(ChatHistory.timestamp.desc()).limit(50).all()
    
    return jsonify({
        "success": True,
        "history": [{
            "date": h.timestamp.strftime('%Y-%m-%d %H:%M'),
            "user_msg": h.user_message[:50] + "..." if len(h.user_message) > 50 else h.user_message,
            "ai_msg": h.ai_response[:50] + "..." if len(h.ai_response) > 50 else h.ai_response,
            "gender": h.gender
        } for h in history]
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').strip()
    username = data.get('username', 'User')
    gender = data.get('gender', 'male')
    conversation_id = data.get('conversation_id', username)
    
    # Try ChatGPT first (Now with Persistent DB Memory)
    response_text = get_chatgpt_response(message, username, conversation_id, gender)
    
    # If ChatGPT failed, fall back to pattern matching
    if not response_text:
        message_lower = message.lower()
        # ... (keeping pattern matching for safety)
        responses = {
            'salut': f'Hello, {username}! How can I help you today?',
            'buna': f'Hi! I am KELION, your virtual assistant. What would you like to know?',
            'hello': f'Hello, {username}! How can I assist you today?',
            'cine esti': 'I am KELION v143.0, a humanoid AI assistant created by the GENEZA NEXUS team.',
            'ce poti face': 'I can chat with you, answer questions, provide information, and help you explore the NEXUS v143.0 system.',
            'cum te cheama': 'My name is KELION v143.0 - or VEONA if you prefer the female avatar.',
            'versiune': 'I am KELION v143.0, the latest version of the NEXUS neural interface.',
            'ajutor': 'Of course! You can ask me anything. For example: "What can you do?", "Who are you?", or any other question!',
            'help': 'Of course! You can ask me anything. For example: "What can you do?", "Who are you?", or any other question!',
            'multumesc': 'You are welcome! I am always here for you.',
            'thanks': 'You\'re welcome! I\'m always here for you.',
            'la revedere': 'Goodbye! Have a wonderful day! ðŸ‘‹',
            'bye': 'Goodbye! Have a wonderful day! ðŸ‘‹',
            'ce ora e': f'The current time is: {datetime.datetime.now().strftime("%H:%M")}',
            'ce data e': f'Today\'s date is: {datetime.datetime.now().strftime("%d %B %Y")}',
            'vremea': 'I currently don\'t have access to real-time weather data, but I can be integrated with a weather API in the future!',
            'gluma': 'Why don\'t robots ever argue? Because they always have logic! ðŸ¤–ðŸ˜„',
            'joke': 'Why don\'t robots ever get angry? Because they always stay logical! ðŸ¤–ðŸ˜„',
        }
        
        for key, value in responses.items():
            if key in message_lower:
                response_text = value
                break
        
        if not response_text:
            default_responses = [
                f'Interesting, {username}! Can you tell me more about that?',
                'Hmm, let me think about that... What else would you like to know?',
                'I am here to help! Try asking me something specific.',
                f'I understand, {username}. How else can I help you?',
                'Fascinating! Please continue, I am all ears... well, all sensors! ðŸ¤–',
            ]
            response_text = random.choice(default_responses)
            
    # Save to history DB (Always save for persistent memory)
    try:
         new_history = ChatHistory(
             username=username,
             user_message=message,
             ai_response=response_text,
             gender=gender
         )
         db.session.add(new_history)
         db.session.commit()
    except Exception as e:
        print(f"Error saving history: {e}")
    
    return jsonify({
        "success": True,
        "response": response_text,
        "timestamp": datetime.datetime.now().isoformat(),
        "source": "chatgpt" if OPENAI_API_KEY and OPENAI_API_KEY != "sk-YOUR_OPENAI_API_KEY_HERE" else "fallback"
    })

def get_paypal_access_token():
    """Obține token de acces PayPal (funcționează atât sandbox cât și live)"""
    if not PAYPAL_CLIENT_ID or not PAYPAL_SECRET:
        print("⚠️ PayPal credentials not configured")
        return None
    
    try:
        url = f"{PAYPAL_API_BASE}/v1/oauth2/token"
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
    """Verifică starea unei subscripții PayPal"""
    token = get_paypal_access_token()
    if not token:
        return False, "Gateway Offline"
    
    try:
        url = f"{PAYPAL_API_BASE}/v1/billing/subscriptions/{subscription_id}"
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

def verify_paypal_order(order_id):
    """Verifică starea unei comenzi PayPal"""
    token = get_paypal_access_token()
    if not token:
        return False, "Gateway Offline"
    
    try:
        url = f"{PAYPAL_API_BASE}/v1/checkout/orders/{order_id}"
        res = requests.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        data = res.json()
        if data.get('status') == 'COMPLETED':
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
        msg['Subject'] = 'âœ… Welcome to GENEZA NEXUS!'
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        
        html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 30px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a0a2e, #0a0a0a); border: 1px solid #00f3ff; border-radius: 10px; padding: 30px;">
                <h1 style="color: #00f3ff; text-align: center;">ðŸš€ GENEZA NEXUS</h1>
                <h2 style="color: #bc13fe;">Welcome, {first_name}!</h2>
                <p>Your account has been created successfully.</p>
                <hr style="border-color: #00f3ff; opacity: 0.3;">
                <p><strong>Username:</strong> {username}</p>
                <p><strong>Email:</strong> {to_email}</p>
                <p><strong>Subscription:</strong> {subscription.upper()}</p>
                <p><strong>Valid until:</strong> {expiry_date}</p>
                <hr style="border-color: #00f3ff; opacity: 0.3;">
                <p style="text-align: center;">
                    <a href="http://127.0.0.1:8000/" style="display: inline-block; background: linear-gradient(135deg, #bc13fe, #00f3ff); color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Access NEXUS</a>
                </p>
                <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">This email was sent automatically. Please do not reply to this message.</p>
            </div>
        </body>
        </html>
        '''
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        
        print(f"âœ… Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"âŒ Email error: {e}")
        return False

def send_admin_notification(user_email, user_name, topic, topic_label, message):
    """Send email notification to admin when new contact message arrives"""
    try:
        ADMIN_EMAIL = "ae1968@kidsdigitalhub.com"  # Admin email
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'ðŸ“§ New AE Contact Message: {topic_label}'
        msg['From'] = SMTP_EMAIL
        msg['To'] = ADMIN_EMAIL
        msg['Reply-To'] = user_email
        
        html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 30px;">
            <div style="max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, #0a0a2e, #0a0a0a); border: 2px solid #00f3ff; border-radius: 12px; padding: 30px;">
                <h1 style="color: #00f3ff; text-align: center; margin-bottom: 10px;">ðŸ“§ New Contact Message</h1>
                <p style="text-align: center; color: #888; font-size: 14px; margin-top: 0;">AE Contact System</p>
                
                <hr style="border-color: #00f3ff; opacity: 0.3; margin: 25px 0;">
                
                <h2 style="color: #bc13fe; font-size: 20px; margin-bottom: 15px;">Client Details:</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 8px 0; color: #00f3ff; font-weight: bold; width: 150px;">ðŸ‘¤ Name:</td>
                        <td style="padding: 8px 0; color: #fff;">{user_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #00f3ff; font-weight: bold;">ðŸ“§ Email:</td>
                        <td style="padding: 8px 0;">
                            <a href="mailto:{user_email}" style="color: #00f3ff; text-decoration: none;">{user_email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #00f3ff; font-weight: bold;">ðŸ“‹ Subject:</td>
                        <td style="padding: 8px 0; color: #ff00ff; font-weight: bold;">{topic_label}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #00f3ff; font-weight: bold;">ðŸ• Date:</td>
                        <td style="padding: 8px 0; color: #888;">{datetime.datetime.now().strftime('%d %B %Y, %H:%M')}</td>
                    </tr>
                </table>
                
                <hr style="border-color: #00f3ff; opacity: 0.3; margin: 25px 0;">
                
                <h2 style="color: #bc13fe; font-size: 20px; margin-bottom: 15px;">ðŸ’­ Message:</h2>
                <div style="background: rgba(0, 243, 255, 0.05); border-left: 4px solid #00f3ff; padding: 20px; border-radius: 6px; color: #fff; line-height: 1.8; font-size: 15px;">
                    {message}
                </div>
                
                <hr style="border-color: #00f3ff; opacity: 0.3; margin: 25px 0;">
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="mailto:{user_email}?subject=Re: {topic_label}" style="display: inline-block; background: linear-gradient(135deg, #00f3ff, #0080ff); color: #000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 5px 15px rgba(0, 243, 255, 0.3);">
                        ðŸ“¨ Reply Now
                    </a>
                </p>
                
                <p style="font-size: 12px; color: #555; text-align: center; margin-top: 30px;">
                    This email was automatically generated by GENEZA NEXUS Contact System.<br>
                    To manage messages, access the Admin Panel.
                </p>
            </div>
        </body>
        </html>
        '''
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, ADMIN_EMAIL, msg.as_string())
        
        print(f"âœ… Admin notification sent for contact from {user_email}")
        return True
    except Exception as e:
        print(f"âŒ Admin notification error: {e}")
        return False


def send_payment_confirmation_email(to_email, username, first_name, plan_name, amount, currency, subscription_end):
    """Trimite email simplu de confirmare plată"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = '✅ Payment Confirmed - KELION AI'
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        
        payment_date = datetime.datetime.now().strftime('%d %B %Y')
        
        html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 30px; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; background: #0a0a1a; border: 1px solid #00f3ff; border-radius: 10px; padding: 30px;">
                
                <h1 style="color: #00f3ff; text-align: center; margin-bottom: 20px;">🚀 KELION AI</h1>
                
                <div style="background: rgba(0, 255, 0, 0.1); border: 1px solid #00ff00; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 20px;">
                    <p style="color: #00ff00; margin: 0; font-size: 18px; font-weight: bold;">✅ Payment Received</p>
                </div>
                
                <p>Hello <strong>{first_name or username}</strong>,</p>
                <p>Your payment has been successfully processed.</p>
                
                <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #888;">Subscription:</td>
                        <td style="padding: 10px 0; text-align: right; color: #00f3ff; font-weight: bold;">{plan_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #888;">Amount:</td>
                        <td style="padding: 10px 0; text-align: right; color: #00ff00; font-weight: bold; font-size: 1.1em;">£{amount:.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #888;">Date:</td>
                        <td style="padding: 10px 0; text-align: right;">{payment_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #888;">Valid until:</td>
                        <td style="padding: 10px 0; text-align: right; color: #ff00ff;">{subscription_end}</td>
                    </tr>
                </table>
                
                <p style="text-align: center; margin-top: 25px;">
                    <a href="https://kelionai.app" style="display: inline-block; background: #00f3ff; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Access KELION</a>
                </p>
                
                <p style="font-size: 11px; color: #555; text-align: center; margin-top: 25px;">
                    Questions? Contact <a href="mailto:contact@kelionai.app" style="color: #00f3ff;">contact@kelionai.app</a>
                </p>
            </div>
        </body>
        </html>
        '''
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            # Trimite la client + CC la admin
            recipients = [to_email, 'contact@kelionai.app']
            server.sendmail(SMTP_EMAIL, recipients, msg.as_string())
        
        print(f"✅ Payment confirmation sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Payment email error: {e}")
        return False


# ==============================================================================
# ROUTES
# ==============================================================================

@app.route('/')
def serve_index():
    """Serve the main KELION application"""
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (JS, CSS, assets, etc.)"""
    return send_from_directory(BASE_DIR, filename)

@app.route('/status')
def status():
    return jsonify({"status": "online", "system": "KELION v143.0", "engine": "Flask/Python"})

@app.route('/api/config')
def get_config():
    return jsonify({"paypal_client_id": PAYPAL_CLIENT_ID, "api_url": request.host_url.rstrip('/')})

# ==============================================================================
# v143: AI SAFETY & LEGAL COMPLIANCE
# ==============================================================================

def check_ai_safety(text):
    """Verifică conformitatea AI cu regulile legale (COPPA, GDPR, etc)"""
    unsafe_keywords = [
        'child porn', 'hacking', 'how to kill', 'illegal drugs', 
        'stolen credit cards', 'bomb instructions', 'terrorist'
    ]
    for kw in unsafe_keywords:
        if kw in (text or "").lower():
            return False, "I cannot fulfill this request due to legal safety policy standards. [[ACTION:BLOCKED]]"
    return True, None

@app.route('/api/chat', methods=['POST'])
@token_required
def api_chat(current_user):
    data = request.json
    message = data.get('message', '').strip()
    
    # Safety Check on User Input
    is_safe, warning = check_ai_safety(message)
    if not is_safe:
        return jsonify({"success": True, "response": warning, "lang": "en"})
    
    # Process Chat
    response = get_chatgpt_response(
        message, 
        current_user.username, 
        current_user.username,
        gender=data.get('gender', 'male')
    )
    
    # Safety Check on AI Output
    is_safe, warning = check_ai_safety(response)
    if not is_safe:
        return jsonify({"success": True, "response": warning, "lang": "en"})
        
    return jsonify({"success": True, "response": response, "lang": "en"})


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
    voucher_code = data.get('voucher_code')
    
    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "Email already registered"}), 400
        
    # PRODUCTION MODE: Remove demo bypass
    paypal_sub_id = data.get('paypal_subscription_id')
    paypal_order_id = data.get('paypal_order_id')
    LOCAL_TEST_MODE = False  # DO NOT CHANGE FOR PRODUCTION
    
    is_voucher_valid = False
    if voucher_code:
        voucher = VoucherCode.query.filter_by(code=voucher_code, is_used=False).first()
        if voucher:
            is_voucher_valid = True
            subscription = 'basic' # Voucher gives basic
    
    if not is_voucher_valid and subscription != 'demo' and not LOCAL_TEST_MODE:
        if not paypal_sub_id and not paypal_order_id:
            return jsonify({"success": False, "error": "Payment evidence required"}), 402
        
        if paypal_sub_id:
            valid, pp_data = verify_paypal_subscription(paypal_sub_id)
        else:
            valid, pp_data = verify_paypal_order(paypal_order_id)
            
        if not valid:
            return jsonify({"success": False, "error": f"Payment verification failed: {pp_data}"}), 402

    paypal_id = paypal_sub_id or paypal_order_id or (voucher_code if is_voucher_valid else "local_test")

    username = email.split('@')[0]
    if User.query.filter_by(username=username).first():
        username = email
        
    # Set expiration
    days = 30
    if is_voucher_valid:
        days = 30 * (voucher.value_months or 1)
    elif subscription == 'premium': days = 90
    elif subscription == 'enterprise': days = 365
    
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
            "voucher": voucher_code if is_voucher_valid else None,
            "date": datetime.datetime.utcnow().isoformat()
        }]) if paypal_id else "[]"
    )
    
    db.session.add(new_user)
    
    # Mark voucher as used
    if is_voucher_valid:
        voucher.is_used = True
        voucher.used_at = datetime.datetime.utcnow()
        # Note: used_by_user_id will be set after commit when user.id is available
        
    db.session.commit()
    
    if is_voucher_valid:
        voucher.used_by_user_id = new_user.id
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
        "message": "Registration successful!",
        "username": username,
        "expiry": expiry.strftime('%Y-%m-%d')
    })

@app.route('/api/send-code', methods=['POST'])
def send_code():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
    
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    
    # Save to DB (Cleanup old codes first)
    OTP.query.filter_by(email=email).delete()
    new_otp = OTP(email=email, code=code)
    db.session.add(new_otp)
    db.session.commit()
    
    # Send Email
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'ðŸ” Your NEXUS Verification Code: {code}'
        msg['From'] = SMTP_EMAIL
        msg['To'] = email
        
        html = f'''
        <div style="font-family: Arial, sans-serif; background: #050505; color: #fff; padding: 20px; border: 1px solid #00f3ff; border-radius: 8px;">
            <h2 style="color: #00f3ff;">NEXUS Verification</h2>
            <p>Your security code to complete the registration is:</p>
            <div style="font-size: 2.5rem; letter-spacing: 5px; color: #ff00ff; text-align: center; margin: 20px 0; font-weight: bold;">
                {code}
            </div>
            <p>This code is valid for 10 minutes.</p>
        </div>
        '''
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, email, msg.as_string())
            
        return jsonify({"success": True, "message": "Code sent"})
    except Exception as e:
        print(f"Error sending code: {e}")
        # For testing purposes, print the code if email fails
        print(f"DEBUG: OTP for {email} is {code}")
        return jsonify({"success": False, "error": "Failed to send email. Check logs."}), 500

@app.route('/api/verify-code', methods=['POST'])
def verify_code():
    data = request.json
    email = data.get('email')
    code = data.get('code')
    
    otp = OTP.query.filter_by(email=email, code=code).first()
    if otp:
        # Check expiry (10 mins)
        if (datetime.datetime.utcnow() - otp.created_at).total_seconds() > 600:
            db.session.delete(otp)
            db.session.commit()
            return jsonify({"success": False, "error": "Code expired"}), 400
        
        db.session.delete(otp)
        db.session.commit()
        return jsonify({"success": True})
    
    return jsonify({"success": False, "error": "Invalid code"}), 400


# ==============================================================================
# v143: PROCESARE PLATĂ COMPLETĂ (salvare DB + email)
# ==============================================================================

@app.route('/api/payment/process', methods=['POST'])
@token_required
def process_payment(current_user):
    """
    Procesează o plată: verifică PayPal, salvează în DB, actualizează user, trimite email.
    Folosit pentru: upgrade abonament, reînnoire, plată nouă.
    """
    data = request.json
    plan_id = data.get('plan_id')  # '1_month', '6_months', '12_months'
    paypal_order_id = data.get('paypal_order_id')
    paypal_subscription_id = data.get('paypal_subscription_id')
    
    if not plan_id or plan_id not in SUBSCRIPTION_PLANS:
        return jsonify({"success": False, "error": "Invalid plan"}), 400
    
    plan = SUBSCRIPTION_PLANS[plan_id]
    amount = plan['price']
    days = plan['days']
    plan_name = plan['name']
    
    # Verifică plata PayPal (LIVE mode)
    payment_ref = paypal_order_id or paypal_subscription_id
    if payment_ref:
        if paypal_order_id:
            valid, pp_data = verify_paypal_order(paypal_order_id)
        else:
            valid, pp_data = verify_paypal_subscription(paypal_subscription_id)
        
        if not valid:
            return jsonify({"success": False, "error": f"Payment verification failed: {pp_data}"}), 402
    else:
        return jsonify({"success": False, "error": "Payment reference required"}), 400
    
    # Calculează noua dată de expirare
    now = datetime.datetime.utcnow()
    if current_user.subscription_end_date and current_user.subscription_end_date > now:
        # Dacă are deja abonament activ, extinde de la acea dată
        new_expiry = current_user.subscription_end_date + datetime.timedelta(days=days)
    else:
        # Altfel, de la acum
        new_expiry = now + datetime.timedelta(days=days)
    
    # Salvează în PaymentRecord
    payment_record = PaymentRecord(
        user_id=current_user.id,
        amount=amount,
        currency='GBP',
        payment_method='paypal',
        plan_name=plan_name,
        paypal_order_id=paypal_order_id,
        paypal_subscription_id=paypal_subscription_id,
        status='completed',
        completed_at=now,
        confirmation_email_sent=False
    )
    db.session.add(payment_record)
    
    # Actualizează user-ul
    current_user.subscription = plan_id
    current_user.subscription_end_date = new_expiry
    if paypal_subscription_id:
        current_user.paypal_subscription_id = paypal_subscription_id
    
    # Adaugă la billing history
    try:
        history = json.loads(current_user.billing_history or '[]')
    except:
        history = []
    
    history.append({
        "event": "payment",
        "plan": plan_name,
        "amount": amount,
        "currency": "GBP",
        "paypal_ref": payment_ref,
        "date": now.isoformat(),
        "valid_until": new_expiry.isoformat()
    })
    current_user.billing_history = json.dumps(history)
    
    db.session.commit()
    
    # Trimite email de confirmare (cu BCC la admin)
    email_sent = send_payment_confirmation_email(
        to_email=current_user.email,
        username=current_user.username,
        first_name=current_user.first_name,
        plan_name=plan_name,
        amount=amount,
        currency='GBP',
        subscription_end=new_expiry.strftime('%d %B %Y')
    )
    
    # Marchează că email-ul a fost trimis
    if email_sent:
        payment_record.confirmation_email_sent = True
        db.session.commit()
    
    return jsonify({
        "success": True,
        "message": "Payment processed successfully",
        "plan": plan_name,
        "amount": amount,
        "valid_until": new_expiry.strftime('%d %B %Y'),
        "email_sent": email_sent
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

@app.route('/api/demo/heartbeat', methods=['POST'])
def demo_heartbeat():
    try:
        data = request.json
        username = data.get('username')
        if username != 'demo':
            return jsonify({"success": True}), 200 
            
        ip_addr = request.remote_addr
        tracker = DemoTracking.query.filter_by(ip_address=ip_addr).first()
        
        if tracker:
            # Add time (frontend calls every 10s)
            tracker.total_seconds_used += 10
            tracker.last_access = datetime.datetime.utcnow()
            db.session.commit()
            
            # Check limit (20 mins = 1200 seconds)
            if tracker.total_seconds_used >= 1200:
                return jsonify({"success": False, "expired": True}), 403
                
            return jsonify({"success": True, "remaining": 1200 - tracker.total_seconds_used})
            
    except Exception as e:
        print(f"Heartbeat error: {e}")
        return jsonify({"success": False}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username_q = data.get('username')
    password_q = data.get('password')
    ip_addr = request.remote_addr
    
    demo_remaining_seconds = 0
    
    # 1. SECURITY CHECK FOR DEMO ACCOUNT
    if username_q == 'demo':
        # Check tracking
        tracker = DemoTracking.query.filter_by(ip_address=ip_addr).first()
        
        if not tracker:
            # First time demo user
            tracker = DemoTracking(ip_address=ip_addr, total_seconds_used=0)
            db.session.add(tracker)
            db.session.commit()
            demo_remaining_seconds = 1200
        else:
            # Existing demo user - check budget
            if tracker.total_seconds_used >= 1200:
                 return jsonify({
                    "success": False, 
                    "error": "The 20-minute Demo time has been completely exhausted. Please create an account."
                }), 403
            
            demo_remaining_seconds = 1200 - tracker.total_seconds_used
            # Update last access
            tracker.last_access = datetime.datetime.utcnow()
            db.session.commit()

    user = User.query.filter_by(username=username_q).first()
    if not user:
        user = User.query.filter_by(email=username_q).first() 

    if user and check_password_hash(user.password_hash, password_q):
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
            "demo_remaining": demo_remaining_seconds,
            "expiry": user.subscription_end_date.strftime('%Y-%m-%d') if user.subscription_end_date else 'Never'
        })
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

# ==============================================================================
# CHAT AI ENDPOINT - ChatGPT Integration
# ==============================================================================

# ðŸ§  PERSISTENT NEURAL MEMORY: Retrieval logic
def get_chatgpt_response(message, username, conversation_id, gender='male'):
    """Call OpenAI ChatGPT API for intelligent responses with persistent DB memory"""
    
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-YOUR_OPENAI_API_KEY_HERE":
        return None
    
    # Retrieve history from DB
    try:
        db_history = ChatHistory.query.filter_by(username=username).order_by(ChatHistory.timestamp.desc()).limit(10).all()
        db_history.reverse() # ASC order
    except Exception as e:
        print(f"History retrieval error: {e}")
        db_history = []

    ai_name = "KELION" if gender == 'male' else "VEONA"
    
    system_prompt = f"""You are {ai_name} v143.0, an advanced humanoid AI assistant created by the GENEZA NEXUS team.
Personality: Polite, intelligent, friendly. PREDEFINED LANGUAGE: ENGLISH. 
Rules: ACADEMIC, AUTHORITATIVE, PRECISE responses. Concise for speech (max 3-4 sentences).
MEMORY: You have a neural link to previous conversations. Mention old facts if relevant.
RAG PROTOCOL: If you see "[PAST MEMORIES: ...]" in the user message, use that data for personalized responses. DO NOT repeat the tag in the response.

SENSORY: You have an Optical Sensor. You can see the user and identify their emotions.
If the user asks "What do you see?" or "Scan me", use the tag [[ACTION:SCAN]].

SMART UI CONTROL: You can execute commands by appending a tag AT THE END of your response ONLY if requested:
- [[ACTION:OPEN_HISTORY]] - Open chat history.
- [[ACTION:LOGOUT]] - Log off the user.
- [[ACTION:AVATAR_SWITCH]] - Switch gender/avatar.
- [[ACTION:OPEN_ADMIN]] - Open admin console (only if user is admin).
- [[ACTION:SCAN]] - Trigger a visual scan of the user.
- [[ACTION:VISION_ON]] - Activate continuous optical sensors.
- [[ACTION:VISION_OFF]] - Deactivate optical sensors.
- [[ACTION:MARKET]] - Open the Nexus Marketplace for upgrades.
- [[ACTION:OPEN_MAINFRAME]] - Open the administrative mainframe console.
Example: "Certainly! I'm opening your history now. [[ACTION:OPEN_HISTORY]]\""""

    # Build context
    messages_for_api = [{"role": "system", "content": system_prompt}]
    for h in db_history:
        messages_for_api.append({"role": "user", "content": h.user_message})
        messages_for_api.append({"role": "assistant", "content": h.ai_response})
    
    messages_for_api.append({"role": "user", "content": message})
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o",
                "messages": messages_for_api,
                "max_tokens": 300,
                "temperature": 0.7
            },
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content'].strip()
        else:
            print(f"ChatGPT API Error: {response.status_code}")
            return None
    except Exception as e:
        print(f"ChatGPT Exception: {e}")
        return None

# ==============================================================================
# CHAT ENDPOINT
# ==============================================================================
# CHAT ENDPOINT consolidated above at line 131



@app.route('/api/vision/analyze', methods=['POST'])
def vision_analyze():
    data = request.json
    image_b64 = data.get('image') # base64 string
    prompt = data.get('prompt', 'What do you see in this image? Be brief and professional.')

    if not image_b64:
        return jsonify({"success": False, "error": "No image provided"}), 400

    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-YOUR_OPENAI_API_KEY_HERE":
        return jsonify({"success": False, "error": "OpenAI API Key missing"}), 503

    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }

        payload = {
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_b64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 300
        }

        response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
        
        if response.status_code == 200:
            res_data = response.json()
            description = res_data['choices'][0]['message']['content']
            return jsonify({
                "success": True,
                "analysis": description
            })
        else:
            print(f"Vision API Error: {response.text}")
            return jsonify({"success": False, "error": "AI Vision Provider Error"}), 500

    except Exception as e:
        print(f"Vision Exception: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """IniÈ›iazÄƒ recuperarea parolei - trimite cod pe email"""
    data = request.json
    email = data.get('email', '').strip()
    
    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        # Security: Don't reveal if email exists
        return jsonify({"success": True, "message": "If email exists, reset code was sent."})
    
    # Generate 6-digit OTP
    code = f"{random.randint(100000, 999999)}"
    
    # Save OTP to database
    OTP.query.filter_by(email=email, otp_type='password_reset').delete()
    new_otp = OTP(email=email, code=code, otp_type='password_reset')
    db.session.add(new_otp)
    db.session.commit()
    
    # Send reset email
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'ðŸ” KELION Password Reset Code'
        msg['From'] = SMTP_EMAIL
        msg['To'] = email
        
        html = f'''
        <div style="font-family: Arial, sans-serif; background: #050505; color: #fff; padding: 30px; border: 2px solid #00f3ff; border-radius: 12px; max-width: 500px;">
            <h1 style="color: #00f3ff; text-align: center;">ðŸ” Password Reset</h1>
            <p style="text-align: center;">Hello <strong>{user.first_name or user.username}</strong>,</p>
            <p style="text-align: center;">Your password reset code is:</p>
            <div style="font-size: 2.5rem; letter-spacing: 8px; color: #ff00ff; text-align: center; margin: 30px 0; font-weight: bold; background: rgba(0,0,0,0.5); padding: 20px; border-radius: 8px;">
                {code}
            </div>
            <p style="text-align: center; color: #888;">This code expires in <strong>10 minutes</strong>.</p>
            <p style="text-align: center; color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            <hr style="border-color: #00f3ff; opacity: 0.3; margin: 20px 0;">
            <p style="text-align: center; font-size: 11px; color: #555;">KELION AI - kelionai.app</p>
        </div>
        '''
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, email, msg.as_string())
            
        print(f"âœ… Password reset code sent to {email}")
        return jsonify({"success": True, "message": "Reset code sent to your email."})
        
    except Exception as e:
        print(f"âŒ Email error: {e}")
        return jsonify({"success": False, "error": "Failed to send email. Try again later."}), 500


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """FinalizeazÄƒ resetarea parolei cu cod OTP"""
    data = request.json
    email = data.get('email', '').strip()
    code = data.get('code', '').strip()
    new_password = data.get('new_password', '')
    
    if not email or not code or not new_password:
        return jsonify({"success": False, "error": "Email, code, and new password required"}), 400
    
    if len(new_password) < 8:
        return jsonify({"success": False, "error": "Password must be at least 8 characters"}), 400
    
    # Verify OTP
    otp = OTP.query.filter_by(email=email, code=code, otp_type='password_reset').first()
    if not otp:
        return jsonify({"success": False, "error": "Invalid or expired code"}), 400
    
    # Check expiry (10 mins)
    if (datetime.datetime.utcnow() - otp.created_at).total_seconds() > 600:
        db.session.delete(otp)
        db.session.commit()
        return jsonify({"success": False, "error": "Code expired. Request a new one."}), 400
    
    # Update password
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    
    user.password_hash = generate_password_hash(new_password)
    db.session.delete(otp)
    db.session.commit()
    
    print(f"âœ… Password reset successful for {email}")
    return jsonify({"success": True, "message": "Password reset successful. You can now login."})


@app.route('/api/tts', methods=['POST'])
def tts_endpoint():
    data = request.json
    text = data.get('text')
    username = data.get('username')
    
    # Get user gender preference for voice
    gender = 'male'
    if username:
        # In a real app we would query db, for now lets trust the frontend or default
        pass
    
    provider = data.get('provider', 'openai') # 'openai' or 'eleven'
    gender_req = data.get('gender', 'male')
    
    if not text:
        return jsonify({"error": "No text"}), 400

    # ELEVENLABS PROVIDER
    if provider == 'eleven' and ELEVENLABS_API_KEY and ELEVENLABS_API_KEY != "your_elevenlabs_key_here":
        voice_id = "pNInz6obpgnuMvscL7PR" if gender_req == 'male' else "EXAV6978mjmAn9ra79vG"
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        # Cache check for ElevenLabs
        import hashlib
        hash_object = hashlib.md5(f"eleven_{text}_{voice_id}".encode())
        filename = f"{hash_object.hexdigest()}.mp3"
        cache_dir = os.path.join(BASE_DIR, 'tts_cache')
        file_path = os.path.join(cache_dir, filename)
        
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                return f.read(), 200, {'Content-Type': 'audio/mpeg'}

        try:
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY
            }
            payload = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.5}
            }
            response = requests.post(url, json=payload, headers=headers)
            if response.status_code == 200:
                with open(file_path, "wb") as f:
                    f.write(response.content)
                return response.content, 200, {'Content-Type': 'audio/mpeg'}
            else:
                print(f"ElevenLabs Error: {response.text}")
                # Fallback to OpenAI if ElevenLabs fails
                provider = 'openai'
        except Exception as e:
            print(f"ElevenLabs Exception: {e}")
            provider = 'openai'

    # OPENAI PROVIDER (Default or Fallback)
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-YOUR_OPENAI_API_KEY_HERE":
        return jsonify({"error": "OpenAI API Key missing"}), 503

    # OpenAI Voice options: alloy, echo, fable, onyx, nova, shimmer
    voice = "onyx" if gender_req == 'male' else "nova"

    # TTS CACHING SYSTEM
    cache_dir = os.path.join(BASE_DIR, 'tts_cache')
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)
        
    import hashlib
    hash_object = hashlib.md5(f"openai_{text}_{voice}".encode())
    filename = f"{hash_object.hexdigest()}.mp3"
    file_path = os.path.join(cache_dir, filename)
    
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            return f.read(), 200, {'Content-Type': 'audio/mpeg'}

    try:
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "tts-1",
            "input": text,
            "voice": voice,
            "response_format": "mp3"
        }
        response = requests.post("https://api.openai.com/v1/audio/speech", headers=headers, json=payload)
        
        if response.status_code == 200:
            with open(file_path, "wb") as f:
                f.write(response.content)
            return response.content, 200, {'Content-Type': 'audio/mpeg'}
        else:
            return jsonify({"error": "TTS Provider Error"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==============================================================================
# AE CONTACT SYSTEM ENDPOINT
# ==============================================================================

@app.route('/api/contact', methods=['POST'])
def contact():
    """Receive contact form submissions from AE Contact System"""
    data = request.json
    
    # Validate required fields
    email = data.get('email', '').strip()
    topic = data.get('topic', '').strip()
    message = data.get('message', '').strip()
    
    if not email or not topic or not message:
        return jsonify({
            "success": False,
            "error": "Email, topic, and message are required"
        }), 400
    
    # Extract optional fields
    name = data.get('name', 'Anonymous')
    topic_label = data.get('topicLabel', '')
    user_agent = data.get('userAgent', '')
    source = data.get('source', '')
    timestamp = data.get('timestamp', datetime.datetime.utcnow().isoformat())
    
    try:
        # Save to database
        new_contact = ContactMessage(
            email=email,
            name=name,
            topic=topic,
            topic_label=topic_label,
            message=message,
            user_agent=user_agent,
            source=source,
            status='new'
        )
        
        db.session.add(new_contact)
        db.session.commit()
        
        # Log for admin
        print(f"ðŸ“§ NEW CONTACT from {name} ({email}) - Topic: {topic_label}")
        print(f"   Message: {message[:100]}...")
        
        # Send email notification to admin
        send_admin_notification(email, name, topic, topic_label, message)
        
        return jsonify({
            "success": True,
            "message": "Contact form submitted successfully",
            "id": new_contact.id
        }), 200
        
    except Exception as e:
        print(f"âŒ Contact form error: {e}")
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": "Failed to save contact message"
        }), 500

# ==============================================================================
# ADMIN ENDPOINTS FOR CONTACT MANAGEMENT
# ==============================================================================

@app.route('/api/contact/messages', methods=['GET'])
def get_contact_messages():
    """Get all contact messages - ADMIN ONLY"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized - No token"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        
        # Check if user is admin
        user = User.query.filter_by(username=decoded['username']).first()
        if not user or user.role != 'admin':
            return jsonify({"success": False, "error": "Forbidden - Admin only"}), 403
        
        # Get all contact messages ordered by newest first
        messages = ContactMessage.query.order_by(ContactMessage.timestamp.desc()).all()
        
        return jsonify({
            "success": True,
            "messages": [{
                "id": msg.id,
                "email": msg.email,
                "name": msg.name,
                "topic": msg.topic,
                "topic_label": msg.topic_label,
                "message": msg.message,
                "timestamp": msg.timestamp.isoformat(),
                "user_agent": msg.user_agent,
                "source": msg.source,
                "status": msg.status,
                "admin_notes": msg.admin_notes
            } for msg in messages]
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    except Exception as e:
        print(f"Error fetching messages: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/contact/<int:message_id>/status', methods=['PUT'])
def update_contact_status(message_id):
    """Update contact message status - ADMIN ONLY"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        
        # Check if user is admin
        user = User.query.filter_by(username=decoded['username']).first()
        if not user or user.role != 'admin':
            return jsonify({"success": False, "error": "Forbidden - Admin only"}), 403
        
        data = request.json
        new_status = data.get('status')
        admin_notes = data.get('admin_notes', '')
        
        if new_status not in ['new', 'read', 'replied']:
            return jsonify({"success": False, "error": "Invalid status"}), 400
        
        message = ContactMessage.query.get(message_id)
        if not message:
            return jsonify({"success": False, "error": "Message not found"}), 404
        
        message.status = new_status
        if admin_notes:
            message.admin_notes = admin_notes
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Status updated successfully"
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    except Exception as e:
        print(f"Error updating status: {e}")
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/contact/<int:message_id>', methods=['DELETE'])
def delete_contact_message(message_id):
    """Delete contact message - ADMIN ONLY"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        
        # Check if user is admin
        user = User.query.filter_by(username=decoded['username']).first()
        if not user or user.role != 'admin':
            return jsonify({"success": False, "error": "Forbidden - Admin only"}), 403
        
        message = ContactMessage.query.get(message_id)
        if not message:
            return jsonify({"success": False, "error": "Message not found"}), 404
        
        db.session.delete(message)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Message deleted successfully"
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    except Exception as e:
        print(f"Error deleting message: {e}")
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


# ==============================================================================
# WEB SEARCH ENDPOINT - For frontend
# ==============================================================================

@app.route('/api/search', methods=['POST'])
def api_search():
    """Web search endpoint for frontend - uses SERPER_API_KEY from env"""
    data = request.json
    query = data.get('query', '').strip()
    
    if not query:
        return jsonify({"success": False, "error": "Query is required"}), 400
    
    result = search_web(query)
    
    if "error" in result:
        return jsonify({"success": False, "error": result["error"]}), 503
    
    return jsonify({
        "success": True,
        "query": query,
        "results": result.get("results", [])
    })

@app.route('/api/whisper', methods=['POST'])
def api_whisper():
    """Whisper transcription endpoint - uses OPENAI_API_KEY from env"""
    if not OPENAI_API_KEY or OPENAI_API_KEY == "sk-YOUR_OPENAI_API_KEY_HERE":
        return jsonify({"error": "OpenAI API Key missing"}), 503
    
    if 'file' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['file']
    
    try:
        # Forward to OpenAI Whisper API
        files = {
            'file': (audio_file.filename, audio_file.read(), audio_file.content_type),
            'model': (None, 'whisper-1')
        }
        
        response = requests.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            files=files,
            timeout=30
        )
        
        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({"error": "Whisper API error"}), response.status_code
            
    except Exception as e:
        print(f"Whisper Exception: {e}")
        return jsonify({"error": str(e)}), 500

# --- DEBUG HEALTH CHECK ---
@app.route('/debug-health')
def debug_health():
    """Diagnostic endpoint to check system status on Railway"""
    import sys
    env_status = {
        "OPENAI_API_KEY": "SET" if OPENAI_API_KEY else "MISSING",
        "SERPER_API_KEY": "SET" if SERPER_API_KEY else "MISSING",
        "PORT": os.environ.get("PORT", "5000 (default)"),
        "PYTHON_VERSION": sys.version
    }
    return jsonify({
        "status": "alive",
        "environment": env_status,
        "version": VERSION
    })


# ==============================================================================
# v143: API VERSION ENDPOINT (pentru frontend)
# ==============================================================================

@app.route('/api/version', methods=['GET'])
def api_version():
    """Returnează versiunea curentă - folosit de frontend pentru afișare consistentă"""
    return jsonify(get_version_info())


# ==============================================================================
# v143: SISTEM ABONAMENTE ȘI PLANURI
# ==============================================================================

@app.route('/api/plans', methods=['GET'])
def get_plans():
    """ReturneazÄƒ toate planurile de abonament disponibile"""
    return jsonify({
        "success": True,
        "plans": SUBSCRIPTION_PLANS,
        "currency": "GBP"
    })


@app.route('/api/countries', methods=['GET'])
def get_countries():
    """ReturneazÄƒ codurile de È›arÄƒ pentru telefon"""
    return jsonify({
        "success": True,
        "countries": COUNTRY_PHONE_CODES
    })


# ==============================================================================
# v143: SISTEM VOUCHERE
# ==============================================================================

@app.route('/api/voucher/validate', methods=['POST'])
def validate_voucher():
    """ValideazÄƒ un cod voucher fÄƒrÄƒ a-l folosi"""
    data = request.json
    code = data.get('code', '').strip().upper()
    
    if not code:
        return jsonify({"success": False, "error": "Code is required"}), 400
    
    voucher = VoucherCode.query.filter_by(code=code).first()
    
    if not voucher:
        return jsonify({"success": False, "error": "Invalid voucher code"}), 404
    
    if voucher.is_used:
        return jsonify({"success": False, "error": "Voucher already used"}), 400
    
    if voucher.expires_at and datetime.datetime.utcnow() > voucher.expires_at:
        return jsonify({"success": False, "error": "Voucher expired"}), 400
    
    return jsonify({
        "success": True,
        "voucher": {
            "code": voucher.code,
            "value_months": voucher.value_months,
            "valid": True
        }
    })


@app.route('/api/voucher/redeem', methods=['POST'])
def redeem_voucher():
    """FoloseÈ™te un voucher pentru a activa abonament"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        username = decoded['username']
    except:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    
    # Check voucher limit (max 3)
    if not user.can_use_voucher():
        return jsonify({"success": False, "error": "Maximum 3 vouchers per account reached"}), 403
    
    data = request.json
    code = data.get('code', '').strip().upper()
    
    voucher = VoucherCode.query.filter_by(code=code, is_used=False).first()
    if not voucher:
        return jsonify({"success": False, "error": "Invalid or already used voucher"}), 400
    
    if voucher.expires_at and datetime.datetime.utcnow() > voucher.expires_at:
        return jsonify({"success": False, "error": "Voucher expired"}), 400
    
    # Apply voucher
    now = datetime.datetime.utcnow()
    if user.subscription_end_date and user.subscription_end_date > now:
        # Extend existing subscription
        new_end = user.subscription_end_date + datetime.timedelta(days=30 * voucher.value_months)
    else:
        # New subscription
        new_end = now + datetime.timedelta(days=30 * voucher.value_months)
    
    user.subscription_end_date = new_end
    user.subscription = 'active'
    user.vouchers_used_count += 1
    
    voucher.is_used = True
    voucher.used_at = now
    voucher.used_by_user_id = user.id
    
    # Record payment
    payment = PaymentRecord(
        user_id=user.id,
        amount_gbp=0.00,
        payment_method='voucher',
        voucher_code=code,
        plan_id=f'{voucher.value_months}_month',
        subscription_start=now,
        subscription_end=new_end,
        status='completed',
        completed_at=now
    )
    db.session.add(payment)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": f"Voucher applied! Subscription extended by {voucher.value_months} month(s).",
        "new_expiry": new_end.strftime('%Y-%m-%d')
    })


@app.route('/api/admin/voucher/generate', methods=['POST'])
def admin_generate_voucher():
    """Admin: GenereazÄƒ coduri voucher noi"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        admin = User.query.filter_by(username=decoded['username']).first()
        if not admin or admin.role != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
    except:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    
    data = request.json
    count = min(data.get('count', 1), 100)  # Max 100 at a time
    value_months = data.get('value_months', 1)
    expires_days = data.get('expires_days', 90)
    
    generated = []
    for _ in range(count):
        # Generate unique code
        code = 'KEL-' + ''.join(random.choices('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', k=8))
        while VoucherCode.query.filter_by(code=code).first():
            code = 'KEL-' + ''.join(random.choices('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', k=8))
        
        voucher = VoucherCode(
            code=code,
            value_months=value_months,
            created_by=admin.username,
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=expires_days)
        )
        db.session.add(voucher)
        generated.append(code)
    
    db.session.commit()
    
    return jsonify({
        "success": True,
        "generated_codes": generated,
        "count": len(generated)
    })


@app.route('/api/admin/vouchers', methods=['GET'])
def admin_list_vouchers():
    """Admin: Lista toate voucherele"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        admin = User.query.filter_by(username=decoded['username']).first()
        if not admin or admin.role != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
    except:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    
    vouchers = VoucherCode.query.order_by(VoucherCode.created_at.desc()).all()
    
    return jsonify({
        "success": True,
        "vouchers": [{
            "id": v.id,
            "code": v.code,
            "value_months": v.value_months,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "created_by": v.created_by,
            "is_used": v.is_used,
            "used_at": v.used_at.isoformat() if v.used_at else None,
            "used_by_user_id": v.used_by_user_id,
            "expires_at": v.expires_at.isoformat() if v.expires_at else None
        } for v in vouchers]
    })


# ==============================================================================
# v143: TRAFIC LIVE PENTRU ADMIN
# ==============================================================================

@app.route('/api/track', methods=['POST'])
def track_visitor():
    """ÃŽnregistreazÄƒ vizitÄƒ (apelat de frontend)"""
    try:
        data = request.json or {}
        now = datetime.datetime.utcnow()
        
        log = VisitorLog(
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:500],
            page_visited=data.get('page', '/'),
            referrer=request.headers.get('Referer', '')[:500],
            timestamp=now,
            year=now.year,
            month=now.month,
            day=now.day,
            hour=now.hour,
            username=data.get('username')
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"success": True})
    except:
        return jsonify({"success": False}), 500


@app.route('/api/admin/traffic', methods=['GET'])
def admin_traffic():
    """Admin: Statistici trafic"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        admin = User.query.filter_by(username=decoded['username']).first()
        if not admin or admin.role != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
    except:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    
    # Parametri opÈ›ionali
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    day = request.args.get('day', type=int)
    
    query = VisitorLog.query
    
    if year:
        query = query.filter_by(year=year)
    if month:
        query = query.filter_by(month=month)
    if day:
        query = query.filter_by(day=day)
    
    logs = query.order_by(VisitorLog.timestamp.desc()).limit(500).all()
    
    # Stats
    total = query.count()
    unique_ips = db.session.query(db.func.count(db.distinct(VisitorLog.ip_address))).scalar() or 0
    
    return jsonify({
        "success": True,
        "stats": {
            "total_visits": total,
            "unique_visitors": unique_ips
        },
        "logs": [{
            "timestamp": l.timestamp.isoformat(),
            "ip": l.ip_address,
            "page": l.page_visited,
            "username": l.username
        } for l in logs]
    })


@app.route('/api/admin/traffic/live', methods=['GET'])
def admin_traffic_live():
    """Admin: Vizitatori din ultimele 5 minute"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        admin = User.query.filter_by(username=decoded['username']).first()
        if not admin or admin.role != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
    except:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    
    five_min_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    
    live = VisitorLog.query.filter(VisitorLog.timestamp >= five_min_ago).all()
    
    return jsonify({
        "success": True,
        "live_visitors": len(live),
        "visitors": [{
            "timestamp": l.timestamp.isoformat(),
            "ip": l.ip_address,
            "page": l.page_visited,
            "username": l.username
        } for l in live]
    })


@app.route('/api/admin/traffic/export', methods=['GET'])
def admin_traffic_export():
    """Admin: Export trafic în format CSV"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        admin = User.query.filter_by(username=decoded['username']).first()
        if not admin or admin.role != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
    except:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    
    # Parametri opționali pentru filtrare
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    query = VisitorLog.query.order_by(VisitorLog.timestamp.desc())
    
    if year:
        query = query.filter(VisitorLog.year == year)
    if month:
        query = query.filter(VisitorLog.month == month)
    
    logs = query.limit(10000).all()  # Max 10k records
    
    # Generează CSV
    csv_lines = ["Timestamp,IP Address,User Agent,Page,Referrer,Username,Country,City"]
    for l in logs:
        line = f'"{l.timestamp}","{l.ip_address or ""}","{(l.user_agent or "")[:100]}","{l.page_visited or ""}","{l.referrer or ""}","{l.username or ""}","{l.country or ""}","{l.city or ""}"'
        csv_lines.append(line)
    
    csv_content = "\n".join(csv_lines)
    
    from flask import Response
    return Response(
        csv_content,
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename=kelion_traffic_{datetime.datetime.now().strftime("%Y%m%d")}.csv'}
    )


# ==============================================================================
# v143: NOTIFICĂRI EXPIRARE ABONAMENT
# ==============================================================================

@app.route('/api/admin/check-expiring', methods=['POST'])
def check_expiring_subscriptions():
    """Admin: VerificÄƒ È™i trimite notificÄƒri pentru abonamente care expirÄƒ"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"success": False, "error": "Unauthorized"}), 401
    
    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        admin = User.query.filter_by(username=decoded['username']).first()
        if not admin or admin.role != 'admin':
            return jsonify({"success": False, "error": "Admin access required"}), 403
    except:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    
    now = datetime.datetime.utcnow()
    two_days = now + datetime.timedelta(days=2)
    
    # Users expiring in 2 days
    expiring = User.query.filter(
        User.subscription_end_date != None,
        User.subscription_end_date <= two_days,
        User.subscription_end_date > now,
        User.role != 'admin'
    ).all()
    
    notifications_sent = 0
    
    for user in expiring:
        # Check if we already notified
        existing = ExpiryNotification.query.filter_by(
            user_id=user.id,
            notification_type='2_days_before'
        ).first()
        
        if not existing:
            # Send email
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = 'âš ï¸ Your KELION Subscription Expires Soon!'
                msg['From'] = SMTP_EMAIL
                msg['To'] = user.email
                
                html = f'''
                <div style="font-family: Arial; background: #050505; color: #fff; padding: 30px; border: 2px solid #ff9900; border-radius: 12px;">
                    <h1 style="color: #ff9900;">âš ï¸ Subscription Expiring</h1>
                    <p>Hello {user.first_name or user.username},</p>
                    <p>Your KELION subscription expires on <strong>{user.subscription_end_date.strftime('%d %B %Y')}</strong>.</p>
                    <p>Renew now to continue enjoying all features!</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="https://kelionai.app" style="background: #ff9900; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Renew Now</a>
                    </p>
                </div>
                '''
                msg.attach(MIMEText(html, 'html'))
                
                with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                    server.starttls()
                    server.login(SMTP_EMAIL, SMTP_PASSWORD)
                    server.sendmail(SMTP_EMAIL, user.email, msg.as_string())
                
                # Record notification
                notif = ExpiryNotification(
                    user_id=user.id,
                    notification_type='2_days_before',
                    email_sent=True
                )
                db.session.add(notif)
                notifications_sent += 1
            except Exception as e:
                print(f"Email error for {user.email}: {e}")
    
    db.session.commit()
    
    return jsonify({
        "success": True,
        "expiring_users": len(expiring),
        "notifications_sent": notifications_sent
    })


# ==============================================================================
# v143: CONFORMITATE LEGALÄ‚ AI
# ==============================================================================

AI_SAFETY_KEYWORDS = [
    'hack', 'exploit', 'malware', 'virus', 'phishing',
    'child', 'minor', 'underage', 'copil', 'minor',
    'personal data', 'date personale', 'cnp', 'ssn', 'credit card'
]

def check_ai_safety(message):
    """VerificÄƒ dacÄƒ mesajul Ã®ncalcÄƒ regulile de siguranÈ›Äƒ"""
    msg_lower = message.lower()
    for keyword in AI_SAFETY_KEYWORDS:
        if keyword in msg_lower:
            return False, keyword
    return True, None

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Ensure all tables exist (including new ChatHistory)
        
        # Create default users if they don't exist
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin', 
                email='admin@kelion.ai', 
                password_hash=generate_password_hash('Andrada_1968!'), 
                role='admin', 
                subscription='enterprise'
            )
            db.session.add(admin)
            
        if not User.query.filter_by(username='demo').first():
            demo = User(
                username='demo', 
                email='demo@kelion.ai', 
                password_hash=generate_password_hash('demo'), 
                role='demo', 
                subscription='demo',
                subscription_end_date=datetime.datetime.utcnow() + datetime.timedelta(days=365)
            )
            db.session.add(demo)
            
        db.session.commit()
        print("âœ“ Database check complete.")
    
    # Get port from environment variable (for deployment) or use 5000 for local
    port = int(os.environ.get('PORT', 5000))
    print(f"ðŸš€ KELION READY: http://localhost:{port}")
    app.run(port=port, debug=False, host='0.0.0.0')

