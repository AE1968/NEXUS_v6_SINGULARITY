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

# Configuration Loading (Cloud Native - Environment Variables)
def get_env(key, default=""):
    return os.getenv(key, default)

# CORE SECRETS
SECRET_KEY = get_env("SECRET_KEY", "kelion_super_secret_key_v142")
DB_NAME = get_env("DB_NAME", "nexus.db")

# API KEYS - Set these in Railway Variables!
OPENAI_API_KEY = get_env("OPENAI_API_KEY", "")
SERPER_API_KEY = get_env("SERPER_API_KEY", "")
ELEVENLABS_API_KEY = get_env("ELEVENLABS_API_KEY", "")
AZURE_SPEECH_KEY = get_env("AZURE_SPEECH_KEY", "")
AZURE_SPEECH_REGION = get_env("AZURE_SPEECH_REGION", "westeurope")

# EMAIL / PAYMENT (Defaults)
PAYPAL_CLIENT_ID = get_env("PAYPAL_CLIENT_ID", "default_client_id")
PAYPAL_SECRET = get_env("PAYPAL_SECRET", "default_secret")
SMTP_EMAIL = get_env("SMTP_EMAIL", "test@example.com")
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

    def is_subscription_active(self):
        if self.role == 'admin':
            return True
        if self.subscription == 'demo':
            return True # Demo accounts handle expiration differently or are temporary
        if not self.subscription_end_date:
            return False
        return datetime.datetime.utcnow() < self.subscription_end_date

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
    status = db.Column(db.String(20), default='new')  # new, read, replied
    admin_notes = db.Column(db.Text)

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
            'cine esti': 'I am KELION v142.0, a humanoid AI assistant created by the GENEZA NEXUS team.',
            'ce poti face': 'I can chat with you, answer questions, provide information, and help you explore the NEXUS v142.0 system.',
            'cum te cheama': 'My name is KELION v142.0 - or VEONA if you prefer the female avatar.',
            'versiune': 'I am KELION v142.0, the latest version of the NEXUS neural interface.',
            'ajutor': 'Of course! You can ask me anything. For example: "What can you do?", "Who are you?", or any other question!',
            'help': 'Of course! You can ask me anything. For example: "What can you do?", "Who are you?", or any other question!',
            'multumesc': 'You are welcome! I am always here for you.',
            'thanks': 'You\'re welcome! I\'m always here for you.',
            'la revedere': 'Goodbye! Have a wonderful day! 👋',
            'bye': 'Goodbye! Have a wonderful day! 👋',
            'ce ora e': f'The current time is: {datetime.datetime.now().strftime("%H:%M")}',
            'ce data e': f'Today\'s date is: {datetime.datetime.now().strftime("%d %B %Y")}',
            'vremea': 'I currently don\'t have access to real-time weather data, but I can be integrated with a weather API in the future!',
            'gluma': 'Why don\'t robots ever argue? Because they always have logic! 🤖😄',
            'joke': 'Why don\'t robots ever get angry? Because they always stay logical! 🤖😄',
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
    
    return jsonify({
        "success": True,
        "response": response_text,
        "timestamp": datetime.datetime.now().isoformat(),
        "source": "chatgpt" if OPENAI_API_KEY and OPENAI_API_KEY != "sk-YOUR_OPENAI_API_KEY_HERE" else "fallback"
    })

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

def verify_paypal_order(order_id):
    token = get_paypal_access_token()
    if not token:
        return False, "Gateway Offline"
    
    try:
        url = f"https://api-m.sandbox.paypal.com/v1/checkout/orders/{order_id}"
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
        msg['Subject'] = '✅ Welcome to GENEZA NEXUS!'
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        
        html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 30px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a0a2e, #0a0a0a); border: 1px solid #00f3ff; border-radius: 10px; padding: 30px;">
                <h1 style="color: #00f3ff; text-align: center;">🚀 GENEZA NEXUS</h1>
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
        
        print(f"✅ Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

def send_admin_notification(user_email, user_name, topic, topic_label, message):
    """Send email notification to admin when new contact message arrives"""
    try:
        ADMIN_EMAIL = "ae1968@kidsdigitalhub.com"  # Admin email
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'📧 New AE Contact Message: {topic_label}'
        msg['From'] = SMTP_EMAIL
        msg['To'] = ADMIN_EMAIL
        msg['Reply-To'] = user_email
        
        html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 30px;">
            <div style="max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, #0a0a2e, #0a0a0a); border: 2px solid #00f3ff; border-radius: 12px; padding: 30px;">
                <h1 style="color: #00f3ff; text-align: center; margin-bottom: 10px;">📧 New Contact Message</h1>
                <p style="text-align: center; color: #888; font-size: 14px; margin-top: 0;">AE Contact System</p>
                
                <hr style="border-color: #00f3ff; opacity: 0.3; margin: 25px 0;">
                
                <h2 style="color: #bc13fe; font-size: 20px; margin-bottom: 15px;">Client Details:</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 8px 0; color: #00f3ff; font-weight: bold; width: 150px;">👤 Name:</td>
                        <td style="padding: 8px 0; color: #fff;">{user_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #00f3ff; font-weight: bold;">📧 Email:</td>
                        <td style="padding: 8px 0;">
                            <a href="mailto:{user_email}" style="color: #00f3ff; text-decoration: none;">{user_email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #00f3ff; font-weight: bold;">📋 Subject:</td>
                        <td style="padding: 8px 0; color: #ff00ff; font-weight: bold;">{topic_label}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #00f3ff; font-weight: bold;">🕐 Date:</td>
                        <td style="padding: 8px 0; color: #888;">{datetime.datetime.now().strftime('%d %B %Y, %H:%M')}</td>
                    </tr>
                </table>
                
                <hr style="border-color: #00f3ff; opacity: 0.3; margin: 25px 0;">
                
                <h2 style="color: #bc13fe; font-size: 20px; margin-bottom: 15px;">💭 Message:</h2>
                <div style="background: rgba(0, 243, 255, 0.05); border-left: 4px solid #00f3ff; padding: 20px; border-radius: 6px; color: #fff; line-height: 1.8; font-size: 15px;">
                    {message}
                </div>
                
                <hr style="border-color: #00f3ff; opacity: 0.3; margin: 25px 0;">
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="mailto:{user_email}?subject=Re: {topic_label}" style="display: inline-block; background: linear-gradient(135deg, #00f3ff, #0080ff); color: #000; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 5px 15px rgba(0, 243, 255, 0.3);">
                        📨 Reply Now
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
        
        print(f"✅ Admin notification sent for contact from {user_email}")
        return True
    except Exception as e:
        print(f"❌ Admin notification error: {e}")
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
    return jsonify({"status": "online", "system": "KELION v142.2", "engine": "Flask/Python"})

@app.route('/api/contact', methods=['POST'])
def contact():
    """Handle contact form submissions - save to DB and notify admin"""
    try:
        data = request.json
        email = data.get('email')
        name = data.get('name', 'Anonymous')
        topic = data.get('topic')
        topic_label = data.get('topicLabel', topic)
        message = data.get('message')
        user_agent = data.get('userAgent', request.headers.get('User-Agent'))
        source = data.get('source', request.referrer)
        
        if not email or not topic or not message:
            return jsonify({"success": False, "error": "Email, topic and message are required"}), 400
        
        # Save to database
        new_contact = ContactMessage(
            email=email,
            name=name,
            topic=topic,
            topic_label=topic_label,
            message=message,
            user_agent=user_agent,
            source=source
        )
        db.session.add(new_contact)
        db.session.commit()
        
        # Send admin notification email
        send_admin_notification(email, name, topic, topic_label, message)
        
        return jsonify({"success": True, "message": "Contact message saved successfully"})
    except Exception as e:
        print(f"Contact error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

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
    paypal_sub_id = data.get('paypal_subscription_id')
    paypal_order_id = data.get('paypal_order_id')
    LOCAL_TEST_MODE = True  # Set to False before going online!
    
    if subscription != 'demo' and not LOCAL_TEST_MODE:
        if not paypal_sub_id and not paypal_order_id:
            return jsonify({"success": False, "error": "Payment evidence required"}), 402
        
        if paypal_sub_id:
            valid, pp_data = verify_paypal_subscription(paypal_sub_id)
        else:
            valid, pp_data = verify_paypal_order(paypal_order_id)
            
        if not valid:
            return jsonify({"success": False, "error": f"Payment verification failed: {pp_data}"}), 402

    paypal_id = paypal_sub_id or paypal_order_id or "local_test"

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
        msg['Subject'] = f'🔐 Your NEXUS Verification Code: {code}'
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
    # Demo tracking removed - full access enabled
    return jsonify({"success": True, "remaining": 99999}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username_q = data.get('username')
    password_q = data.get('password')
    
    # Full access - no demo restrictions

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

# 🧠 PERSISTENT NEURAL MEMORY: Retrieval logic
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
    
    system_prompt = f"""You are {ai_name} v142.1, an advanced humanoid AI assistant created by the GENEZA NEXUS team.
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
        print(f"📧 NEW CONTACT from {name} ({email}) - Topic: {topic_label}")
        print(f"   Message: {message[:100]}...")
        
        # Send email notification to admin
        send_admin_notification(email, name, topic, topic_label, message)
        
        return jsonify({
            "success": True,
            "message": "Contact form submitted successfully",
            "id": new_contact.id
        }), 200
        
    except Exception as e:
        print(f"❌ Contact form error: {e}")
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
        "version": "v142.0"
    })

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
        print("✓ Database check complete.")
    
    # Get port from environment variable (for deployment) or use 5000 for local
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 KELION READY: http://localhost:{port}")
    app.run(port=port, debug=False, host='0.0.0.0')
