import os
import sys
import json
import logging
import random
import datetime
import jwt
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure professional logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('KELION')

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
SMTP_SERVER = get_env("SMTP_SERVER", "smtp.privateemail.com")
SMTP_PORT = int(get_env("SMTP_PORT", "465"))
SMTP_USE_SSL = True  # Port 465 requires SSL

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
# EMAIL SYSTEM (SMTP with SSL)
# ==============================================================================
def send_email(to_email, subject, body_html, body_text=None):
    """
    Send email using SMTP SSL (Port 465) for Namecheap Private Email.
    Returns: (success: bool, message: str)
    """
    if not SMTP_PASSWORD:
        logger.warning("SMTP_PASSWORD not configured. Email not sent.")
        return False, "SMTP password not configured"
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"KELION AI <{SMTP_EMAIL}>"
        msg['To'] = to_email
        
        # Attach plain text and HTML versions
        if body_text:
            msg.attach(MIMEText(body_text, 'plain'))
        msg.attach(MIMEText(body_html, 'html'))
        
        # Use SSL connection (port 465)
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True, "Email sent successfully"
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication Error: {e}")
        return False, "Authentication failed"
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error: {e}")
        return False, str(e)
    except Exception as e:
        logger.error(f"Email Error: {e}")
        return False, str(e)


def send_admin_notification(subject, body):
    """Send notification to admin email"""
    admin_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #1a1a2e; color: #00f3ff; padding: 20px;">
        <h2 style="color: #ff00ff;">🔔 KELION AI Admin Notification</h2>
        <div style="background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; border: 1px solid #00f3ff;">
            {body}
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">
            This is an automated message from KELION AI v143.0
        </p>
    </body>
    </html>
    """
    return send_email(SMTP_EMAIL, subject, admin_html)


def send_welcome_email(to_email, username):
    """Send welcome email to new user"""
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background: #1a1a2e; color: white; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: rgba(0,15,30,0.95); padding: 30px; border-radius: 15px; border: 1px solid #00f3ff;">
            <h1 style="color: #00f3ff; text-align: center;">Welcome to KELION AI! 🚀</h1>
            <p style="font-size: 18px;">Hello <strong>{username}</strong>,</p>
            <p>Thank you for registering with KELION AI - Your Intelligent Assistant.</p>
            <p>Your account has been created successfully. You now have access to:</p>
            <ul>
                <li>🧠 Advanced AI Conversations</li>
                <li>🌐 Real-time Web Search</li>
                <li>🎤 Voice Interaction</li>
                <li>🦻 Accessibility Features</li>
            </ul>
            <p style="text-align: center; margin-top: 30px;">
                <a href="https://kelionai.app" style="background: linear-gradient(135deg, #00f3ff, #ff00ff); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                    Access KELION AI
                </a>
            </p>
            <p style="color: #888; font-size: 12px; margin-top: 30px; text-align: center;">
                © 2025 KELION AI • Powered by OpenAI
            </p>
        </div>
    </body>
    </html>
    """
    return send_email(to_email, "Welcome to KELION AI! 🚀", html)


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
    """Track usage for unregistered users by IP"""
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(50), nullable=False, unique=True)
    
    # Daily usage tracking
    last_access = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    daily_seconds_used = db.Column(db.Integer, default=0)
    last_daily_reset = db.Column(db.Date, default=datetime.date.today)
    
    # Monthly tracking
    first_access = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    total_seconds_used = db.Column(db.Integer, default=0)
    
    # Block status
    is_blocked = db.Column(db.Boolean, default=False)
    blocked_reason = db.Column(db.String(100))

    # Constants
    DAILY_LIMIT_SECONDS = 20 * 60  # 20 minutes
    TRIAL_DAYS = 30  # 1 month trial


class TrialUser(db.Model):
    """Track trial period for new registered users"""
    __tablename__ = 'trial_users'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    username = db.Column(db.String(80), nullable=False)
    
    # Trial dates
    trial_start = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    trial_end = db.Column(db.DateTime)
    
    # Daily usage
    daily_seconds_used = db.Column(db.Integer, default=0)
    last_daily_reset = db.Column(db.Date, default=datetime.date.today)
    
    # Status
    is_trial_active = db.Column(db.Boolean, default=True)
    
    # Constants
    DAILY_LIMIT_SECONDS = 20 * 60  # 20 minutes per day
    TRIAL_DAYS = 30  # 1 month


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
    """Tracking notificări expirare"""
    __tablename__ = 'expiry_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    notification_type = db.Column(db.String(20))  # 2_days_before, expired, reactivation
    sent_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    email_sent = db.Column(db.Boolean, default=False)


# ==============================================================================
# v143+ UNLIMITED MEMORY SYSTEM
# ==============================================================================

class UserMemory(db.Model):
    """Memorie permanentă pentru fiecare utilizator - învățare nelimitată"""
    __tablename__ = 'user_memories'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    
    # Tip de memorie: fact, preference, personality, context, important_date
    memory_type = db.Column(db.String(30), default='fact')
    
    # Cheia memoriei (ex: "nume_real", "culoare_favorita", "zi_nastere")
    memory_key = db.Column(db.String(100), nullable=False)
    
    # Valoarea memoriei
    memory_value = db.Column(db.Text, nullable=False)
    
    # Importanță (1-10) - pentru prioritizare în context
    importance = db.Column(db.Integer, default=5)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    last_used_at = db.Column(db.DateTime)
    
    # Câte ori a fost folosită această memorie
    usage_count = db.Column(db.Integer, default=0)


class ConversationSummary(db.Model):
    """Rezumate ale conversațiilor pentru context eficient"""
    __tablename__ = 'conversation_summaries'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, index=True)
    
    # Data conversației
    conversation_date = db.Column(db.Date, nullable=False)
    
    # Rezumat generat de AI
    summary = db.Column(db.Text)
    
    # Subiecte principale discutate
    topics = db.Column(db.Text)  # JSON array
    
    # Emoția dominantă
    dominant_emotion = db.Column(db.String(20))
    
    # Număr de mesaje în acea zi
    message_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


# Helper functions for memory system
def get_user_memories(username, limit=20):
    """Obține memoriile cele mai importante pentru un utilizator"""
    return UserMemory.query.filter_by(username=username)\
        .order_by(UserMemory.importance.desc(), UserMemory.usage_count.desc())\
        .limit(limit).all()

def add_user_memory(username, key, value, memory_type='fact', importance=5):
    """Adaugă sau actualizează o memorie"""
    existing = UserMemory.query.filter_by(username=username, memory_key=key).first()
    if existing:
        existing.memory_value = value
        existing.importance = importance
        existing.updated_at = datetime.datetime.utcnow()
    else:
        memory = UserMemory(
            username=username,
            memory_key=key,
            memory_value=value,
            memory_type=memory_type,
            importance=importance
        )
        db.session.add(memory)
    db.session.commit()

def build_memory_context(username):
    """Construiește context din memorii pentru AI"""
    memories = get_user_memories(username)
    if not memories:
        return ""
    
    context = "\n[MEMORIE PERMANENTĂ DESPRE UTILIZATOR]:\n"
    for mem in memories:
        context += f"- {mem.memory_key}: {mem.memory_value}\n"
    
    # Check for special dates (birthdays, anniversaries)
    special_date_reminder = check_special_dates(username)
    if special_date_reminder:
        context += f"\n[REMINDER ZI SPECIALĂ]: {special_date_reminder}\n"
    
    return context


def check_special_dates(username):
    """Verifică dacă azi e o zi specială pentru utilizator"""
    today = datetime.datetime.now()
    today_str = today.strftime("%d %B").lower()
    today_day_month = today.strftime("%d/%m")
    
    # Get memories about special dates
    birthday_mem = UserMemory.query.filter_by(
        username=username, 
        memory_key='birthday'
    ).first()
    
    if birthday_mem:
        bday_value = birthday_mem.memory_value.lower()
        if today_str in bday_value or today_day_month in bday_value:
            return f"🎂 Azi e ziua de naștere a lui {username}! Urează-i La mulți ani!"
    
    # Check anniversary
    anniversary_mem = UserMemory.query.filter_by(
        username=username,
        memory_key='anniversary'
    ).first()
    
    if anniversary_mem:
        ann_value = anniversary_mem.memory_value.lower()
        if today_str in ann_value or today_day_month in ann_value:
            return f"💍 Azi e aniversarea lui {username}! Felicită-l!"
    
    return None


def summarize_daily_conversation(username):
    """Generează un rezumat al conversațiilor de azi"""
    today = datetime.datetime.now().date()
    
    # Get today's messages
    todays_chats = ChatHistory.query.filter(
        ChatHistory.username == username,
        db.func.date(ChatHistory.timestamp) == today
    ).all()
    
    if len(todays_chats) < 3:
        return None  # Not enough messages to summarize
    
    # Check if summary already exists
    existing = ConversationSummary.query.filter_by(
        username=username,
        conversation_date=today
    ).first()
    
    if existing:
        return existing.summary
    
    # Create summary of topics discussed
    topics = []
    for chat in todays_chats:
        # Extract key topics (simple approach)
        words = chat.user_message.lower().split()
        for word in words:
            if len(word) > 5 and word not in topics:
                topics.append(word)
    
    summary_text = f"Discuție cu {len(todays_chats)} mesaje. Subiecte: {', '.join(topics[:5])}"
    
    # Save summary
    new_summary = ConversationSummary(
        username=username,
        conversation_date=today,
        summary=summary_text,
        topics=json.dumps(topics[:10]),
        message_count=len(todays_chats)
    )
    db.session.add(new_summary)
    db.session.commit()
    
    return summary_text


# ==============================================================================
# v143 USAGE CONTROL & PAYMENT REDIRECT SYSTEM
# ==============================================================================

def check_guest_access(ip_address):
    """
    Check if unregistered guest can access (by IP).
    Returns: (can_access: bool, message: str, redirect_url: str or None)
    """
    today = datetime.date.today()
    
    # Get or create tracking record
    tracker = DemoTracking.query.filter_by(ip_address=ip_address).first()
    
    if not tracker:
        # New guest - create tracking
        tracker = DemoTracking(
            ip_address=ip_address,
            first_access=datetime.datetime.utcnow(),
            last_access=datetime.datetime.utcnow(),
            daily_seconds_used=0,
            last_daily_reset=today
        )
        db.session.add(tracker)
        db.session.commit()
        return (True, "Welcome! You have 20 minutes daily for 30 days.", None)
    
    # Check if blocked
    if tracker.is_blocked:
        return (False, 
                "Your trial period has expired. Please subscribe to continue using KELION AI.",
                "/subscription")
    
    # Reset daily counter if new day
    if tracker.last_daily_reset != today:
        tracker.daily_seconds_used = 0
        tracker.last_daily_reset = today
        db.session.commit()
    
    # Check if trial period expired (30 days)
    days_since_first = (datetime.datetime.utcnow() - tracker.first_access).days
    if days_since_first > DemoTracking.TRIAL_DAYS:
        tracker.is_blocked = True
        tracker.blocked_reason = "Trial period expired"
        db.session.commit()
        return (False,
                "Your 30-day trial has expired. Subscribe now to unlock unlimited access!",
                "/subscription")
    
    # Check daily limit (20 minutes = 1200 seconds)
    if tracker.daily_seconds_used >= DemoTracking.DAILY_LIMIT_SECONDS:
        remaining_days = DemoTracking.TRIAL_DAYS - days_since_first
        return (False,
                f"Daily limit reached (20 min). Come back tomorrow! Trial: {remaining_days} days left.",
                "/subscription")
    
    # Calculate remaining time
    remaining_seconds = DemoTracking.DAILY_LIMIT_SECONDS - tracker.daily_seconds_used
    remaining_minutes = remaining_seconds // 60
    
    return (True, f"Time remaining today: {remaining_minutes} minutes", None)


def update_guest_usage(ip_address, seconds_used):
    """Update usage time for guest"""
    tracker = DemoTracking.query.filter_by(ip_address=ip_address).first()
    if tracker:
        tracker.daily_seconds_used += seconds_used
        tracker.total_seconds_used += seconds_used
        tracker.last_access = datetime.datetime.utcnow()
        db.session.commit()


def check_user_access(username):
    """
    Check if registered user can access.
    Returns: (can_access: bool, message: str, redirect_url: str or None)
    """
    user = User.query.filter_by(username=username).first()
    if not user:
        return (False, "User not found", "/login")
    
    today = datetime.date.today()
    
    # Check if has active paid subscription
    if user.subscription and user.subscription not in ['trial', 'free', 'demo']:
        if user.subscription_end_date and user.subscription_end_date >= datetime.datetime.utcnow():
            return (True, "Subscription active", None)
        else:
            # Subscription expired
            return (False,
                    "Your subscription has expired. Renew now to continue enjoying KELION AI!",
                    "/subscription")
    
    # Check trial status
    trial = TrialUser.query.filter_by(username=username).first()
    
    if not trial:
        # Create trial for new user
        trial_end = datetime.datetime.utcnow() + datetime.timedelta(days=TrialUser.TRIAL_DAYS)
        trial = TrialUser(
            user_id=user.id,
            username=username,
            trial_start=datetime.datetime.utcnow(),
            trial_end=trial_end,
            daily_seconds_used=0,
            last_daily_reset=today
        )
        db.session.add(trial)
        db.session.commit()
        return (True, f"Welcome! Trial active until {trial_end.strftime('%d %B %Y')}", None)
    
    # Reset daily counter if new day
    if trial.last_daily_reset != today:
        trial.daily_seconds_used = 0
        trial.last_daily_reset = today
        db.session.commit()
    
    # Check if trial expired
    if not trial.is_trial_active or datetime.datetime.utcnow() > trial.trial_end:
        trial.is_trial_active = False
        db.session.commit()
        return (False,
                "Your trial has ended. Subscribe now to unlock unlimited KELION AI!",
                "/subscription")
    
    # Check daily limit
    if trial.daily_seconds_used >= TrialUser.DAILY_LIMIT_SECONDS:
        days_left = (trial.trial_end - datetime.datetime.utcnow()).days
        return (False,
                f"Daily limit reached (20 min). Come back tomorrow! Trial: {days_left} days left.",
                "/subscription")
    
    remaining_seconds = TrialUser.DAILY_LIMIT_SECONDS - trial.daily_seconds_used
    remaining_minutes = remaining_seconds // 60
    days_left = (trial.trial_end - datetime.datetime.utcnow()).days
    
    return (True, f"Time today: {remaining_minutes} min | Trial: {days_left} days left", None)


def update_user_usage(username, seconds_used):
    """Update usage time for registered trial user"""
    trial = TrialUser.query.filter_by(username=username).first()
    if trial and trial.is_trial_active:
        trial.daily_seconds_used += seconds_used
        db.session.commit()


@app.route('/api/usage', methods=['GET', 'POST'])
def get_usage_status():
    """Returns remaining trial time for the current user/guest"""
    if request.method == 'POST':
        data = request.json or {}
        username = data.get('username')
    else:
        username = request.args.get('username')
    
    ip_address = request.remote_addr or request.headers.get('X-Forwarded-For', '0.0.0.0')
    
    if username and username not in ['User', 'Guest', '']:
        user = User.query.filter_by(username=username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # If paid, unlimited
        if user.subscription and user.subscription not in ['trial', 'free', 'demo']:
            return jsonify({
                "type": "paid",
                "remaining_seconds": 86400,
                "remaining_days": 365,
                "status": "Unlimited"
            })
            
        trial = TrialUser.query.filter_by(username=username).first()
        if not trial:
            return jsonify({"type": "trial", "remaining_seconds": 1200, "remaining_days": 30})
            
        rem_sec = max(0, TrialUser.DAILY_LIMIT_SECONDS - trial.daily_seconds_used)
        rem_days = max(0, (trial.trial_end - datetime.datetime.utcnow()).days)
        return jsonify({
            "type": "trial_user",
            "remaining_seconds": rem_sec,
            "remaining_days": rem_days
        })
    else:
        tracker = DemoTracking.query.filter_by(ip_address=ip_address).first()
        if not tracker:
            return jsonify({"type": "guest", "remaining_seconds": 1200, "remaining_days": 30})
            
        rem_sec = max(0, DemoTracking.DAILY_LIMIT_SECONDS - tracker.daily_seconds_used)
        rem_days = max(0, DemoTracking.TRIAL_DAYS - (datetime.datetime.utcnow() - tracker.first_access).days)
        return jsonify({
            "type": "guest",
            "remaining_seconds": rem_sec,
            "remaining_days": rem_days
        })


@app.route('/api/memories', methods=['POST'])
def get_memories_endpoint():
    """Returns user memories for personalized greetings"""
    data = request.json
    username = data.get('username', '').strip()
    
    if not username or username in ['User', 'Guest', '']:
        return jsonify({"success": False, "memories": []})
    
    try:
        memories = get_user_memories(username, limit=5)
        memory_list = []
        for mem in memories:
            memory_list.append({
                "key": mem.memory_key,
                "value": mem.memory_value,
                "type": mem.memory_type
            })
        
        return jsonify({
            "success": True,
            "memories": memory_list
        })
    except Exception as e:
        print(f"Memory fetch error: {e}")
        return jsonify({"success": False, "memories": []})


def get_subscription_offers():
    """Get available subscription packages"""
    return {
        "packages": [
            {
                "id": "1_month",
                "name": "1 Month",
                "price": 10.00,
                "currency": "EUR",
                "features": ["Unlimited daily usage", "Priority support", "All features"],
                "popular": False
            },
            {
                "id": "6_months",
                "name": "6 Months",
                "price": 42.00,
                "currency": "EUR",
                "per_month": 7.00,
                "savings": "30%",
                "features": ["Unlimited daily usage", "Priority support", "All features", "Save 30%"],
                "popular": True
            },
            {
                "id": "12_months",
                "name": "12 Months",
                "price": 60.00,
                "currency": "EUR",
                "per_month": 5.00,
                "savings": "50%",
                "features": ["Unlimited daily usage", "Priority support", "All features", "Save 50%", "Free updates"],
                "popular": False
            }
        ],
        "message": "Choose a plan to unlock unlimited KELION AI access!"
    }


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
# v143 AI EMAIL SYSTEM - Auto-categorization & Protocol Responses
# contact@kelionai.app
# ==============================================================================

EMAIL_CATEGORIES = {
    'support': {
        'keywords': ['help', 'problem', 'issue', 'error', 'bug', 'not working', 'broken', 'ajutor', 'problema'],
        'priority': 'high',
        'auto_response': """Dear {name},

Thank you for contacting KELION AI Support.

We have received your message regarding: "{subject}"

Our technical team has been notified and will respond within 24 hours.

Ticket Reference: #{ticket_id}

Best regards,
KELION AI Support Team
contact@kelionai.app"""
    },
    'sales': {
        'keywords': ['price', 'pricing', 'buy', 'purchase', 'subscription', 'plan', 'pret', 'cumpara', 'abonament'],
        'priority': 'high',
        'auto_response': """Dear {name},

Thank you for your interest in KELION AI!

We offer the following subscription plans:
- 1 Month: 10 EUR/month
- 6 Months: 42 EUR (7 EUR/month - Save 30%)
- 12 Months: 60 EUR (5 EUR/month - Save 50%)

Visit https://kelionai.app/subscription to get started!

Best regards,
KELION AI Sales Team"""
    },
    'partnership': {
        'keywords': ['partner', 'partnership', 'collaborate', 'business', 'b2b', 'enterprise', 'parteneriat'],
        'priority': 'medium',
        'auto_response': """Dear {name},

Thank you for your partnership inquiry!

Our business development team will review your proposal and contact you within 48 hours.

Reference: #{ticket_id}

Best regards,
KELION AI Business Development"""
    },
    'feedback': {
        'keywords': ['feedback', 'suggestion', 'idea', 'feature', 'improve', 'sugestie', 'idee'],
        'priority': 'low',
        'auto_response': """Dear {name},

Thank you for your valuable feedback!

We appreciate you taking the time to help us improve KELION AI.

Best regards,
KELION AI Team"""
    },
    'general': {
        'keywords': [],
        'priority': 'normal',
        'auto_response': """Dear {name},

Thank you for contacting KELION AI.

We have received your message and will respond as soon as possible.

Reference: #{ticket_id}

Best regards,
KELION AI Team
contact@kelionai.app"""
    }
}


def categorize_email(subject, message):
    """AI-powered email categorization"""
    combined_text = f"{subject} {message}".lower()
    
    for category, config in EMAIL_CATEGORIES.items():
        if category == 'general':
            continue
        for keyword in config['keywords']:
            if keyword in combined_text:
                return category, config['priority']
    
    return 'general', 'normal'


def generate_ticket_id():
    """Generate unique ticket ID"""
    return f"KEL{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(100,999)}"


def get_auto_response(category, name, subject):
    """Get protocol auto-response for category"""
    ticket_id = generate_ticket_id()
    template = EMAIL_CATEGORIES.get(category, EMAIL_CATEGORIES['general'])['auto_response']
    
    return template.format(
        name=name or 'Valued Customer',
        subject=subject or 'Your inquiry',
        ticket_id=ticket_id
    ), ticket_id


def process_contact_email(email, name, topic, message):
    """
    Process incoming contact form email:
    1. Categorize
    2. Save to DB with category
    3. Return auto-response for sending
    """
    category, priority = categorize_email(topic, message)
    auto_response, ticket_id = get_auto_response(category, name, topic)
    
    return {
        'category': category,
        'priority': priority,
        'ticket_id': ticket_id,
        'auto_response': auto_response
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
    
    # ===== ACCESS CONTROL CHECK =====
    ip_address = request.remote_addr or request.headers.get('X-Forwarded-For', '0.0.0.0')
    
    # Check if registered user or guest
    if username and username not in ['User', 'Guest', '']:
        # Registered user - check subscription/trial
        can_access, access_message, redirect_url = check_user_access(username)
    else:
        # Guest - check by IP
        can_access, access_message, redirect_url = check_guest_access(ip_address)
    
    if not can_access:
        return jsonify({
            "success": False,
            "blocked": True,
            "message": access_message,
            "redirect": redirect_url,
            "offers": get_subscription_offers()
        }), 403
    
    # Safety Check on User Input
    is_safe_in, warning_in = check_ai_safety(message)
    if not is_safe_in:
        return jsonify({
            "success": False,
            "blocked": True,
            "message": warning_in
        }), 200

    # Try ChatGPT first (Now with Persistent DB Memory)
    response_text = get_chatgpt_response(message, username, conversation_id, gender)
    
    # Safety Check on AI Output
    if response_text:
        is_safe_out, warning_out = check_ai_safety(response_text)
        if not is_safe_out:
            response_text = warning_out
    
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
            'la revedere': 'Goodbye! Have a wonderful day! 👋',
            'bye': 'Goodbye! Have a wonderful day! 👋',
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
                'Fascinating! Please continue, I am all ears... well, all sensors! 🤖',
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
    
    # ===== UPDATE USAGE TIME (estimate 30 seconds per interaction) =====
    if username and username not in ['User', 'Guest', '']:
        update_user_usage(username, 30)
    else:
        update_guest_usage(ip_address, 30)
    
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

def send_auto_response_email(to_email, name, auto_response_text, ticket_id):
    """Send automated protocol response to contact form submitter"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("⚠️ SMTP not configured - auto-response not sent")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"KELION AI - Your Request #{ticket_id}"
        msg['From'] = f"KELION AI <{SMTP_EMAIL}>"
        msg['To'] = to_email
        
        text_part = MIMEText(auto_response_text, 'plain', 'utf-8')
        msg.attach(text_part)
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        
        print(f"✅ Auto-response sent to {to_email} (#{ticket_id})")
        return True
    except Exception as e:
        print(f"❌ Auto-response error: {e}")
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
# v143: AI SAFETY - check_ai_safety defined at end of file with AI_SAFETY_KEYWORDS
# ==============================================================================


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '')
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = data.get('phone', '').strip()
    country = data.get('country', '').strip()
    address = data.get('address', '').strip()
    city = data.get('city', '').strip()
    postal_code = data.get('postal_code', '').strip()
    subscription = data.get('subscription', 'basic')
    voucher_code = data.get('voucher_code')
    
    # Validate ALL mandatory fields
    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400
    if not first_name or not last_name:
        return jsonify({"success": False, "error": "First name and last name are required"}), 400
    if not phone:
        return jsonify({"success": False, "error": "Phone number is required"}), 400
    if not country:
        return jsonify({"success": False, "error": "Country is required"}), 400
    if not address or not city or not postal_code:
        return jsonify({"success": False, "error": "Full address (street, city, postal code) is required"}), 400
        
        
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
# v143: PASSWORD RESET & VOUCHER REDEEM
# ==============================================================================

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email', '').strip()
    
    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"success": False, "error": "Email not found"}), 404
        
    # Generate 6-digit code
    code = f"{random.randint(100000, 999999)}"
    
    # Save to OTP DB
    OTP.query.filter_by(email=email, otp_type='password_reset').delete()
    new_otp = OTP(email=email, code=code, otp_type='password_reset')
    db.session.add(new_otp)
    db.session.commit()
    
    # Send Reset Email
    try:
        subject = f"🔐 KELION AI - Password Reset Code: {code}"
        html = f"""
        <div style="font-family: Arial; background: #050505; color: #fff; padding: 20px; border: 1px solid #ff00ff; border-radius: 8px;">
            <h2 style="color: #ff00ff;">Password Reset</h2>
            <p>You requested a password reset for your KELION AI account.</p>
            <p>Your security code is:</p>
            <div style="font-size: 2.5rem; color: #00f3ff; text-align: center; margin: 20px 0; font-weight: bold; letter-spacing: 5px;">
                {code}
            </div>
            <p>This code will expire in 10 minutes.</p>
        </div>
        """
        send_email(email, subject, html)
        return jsonify({"success": True, "message": "Reset code sent to your email"})
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return jsonify({"success": False, "error": "Failed to send email"}), 500


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email', '').strip()
    code = data.get('code', '').strip()
    new_password = data.get('new_password', '')
    
    if not email or not code or not new_password:
        return jsonify({"success": False, "error": "All fields are required"}), 400
        
    otp = OTP.query.filter_by(email=email, code=code, otp_type='password_reset').first()
    if not otp:
        return jsonify({"success": False, "error": "Invalid or expired code"}), 400
        
    # Check expiry
    if (datetime.datetime.utcnow() - otp.created_at).total_seconds() > 600:
        db.session.delete(otp)
        db.session.commit()
        return jsonify({"success": False, "error": "Code expired"}), 400
        
    user = User.query.filter_by(email=email).first()
    if user:
        user.password_hash = generate_password_hash(new_password)
        db.session.delete(otp)
        db.session.commit()
        return jsonify({"success": True, "message": "Password updated successfully"})
        
    return jsonify({"success": False, "error": "User not found"}), 404


@app.route('/api/voucher/redeem', methods=['POST'])
@token_required
def redeem_voucher(current_user):
    data = request.json
    code = data.get('code', '').strip().toUpperCase()
    
    if not code:
        return jsonify({"success": False, "error": "Voucher code required"}), 400
        
    if not current_user.can_use_voucher():
        return jsonify({"success": False, "error": "Voucher limit reached (max 3 per account)"}), 403
        
    voucher = VoucherCode.query.filter_by(code=code, is_used=False).first()
    if not voucher:
        return jsonify({"success": False, "error": "Invalid or already used voucher"}), 404
        
    # Add time to subscription
    months = voucher.value_months or 1
    now = datetime.datetime.utcnow()
    if current_user.subscription_end_date and current_user.subscription_end_date > now:
        current_user.subscription_end_date += datetime.timedelta(days=30 * months)
    else:
        current_user.subscription_end_date = now + datetime.timedelta(days=30 * months)
        
    current_user.vouchers_used_count += 1
    voucher.is_used = True
    voucher.used_at = now
    voucher.used_by_user_id = current_user.id
    
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": f"Voucher applied! Added {months} month(s) to your subscription.",
        "new_expiry": current_user.subscription_end_date.strftime('%Y-%m-%d')
    })


@app.route('/api/track', methods=['POST'])
def track_visitor():
    """Track visitor statistics (IP, Page, User Agent)"""
    data = request.json or {}
    ip_addr = request.remote_addr or request.headers.get('X-Forwarded-For', '0.0.0.0')
    
    try:
        now = datetime.datetime.utcnow()
        log = VisitorLog(
            ip_address=ip_addr,
            user_agent=request.user_agent.string,
            page_visited=data.get('page', 'index'),
            referrer=request.referrer,
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
    except Exception as e:
        logger.error(f"Tracking error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


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
