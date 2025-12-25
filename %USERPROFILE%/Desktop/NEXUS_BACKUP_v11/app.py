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

# Adaugam folderul curent la path pentru a asigura importul configurarii
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from config_kelion import PAYPAL_CLIENT_ID, PAYPAL_SECRET, SECRET_KEY, DB_NAME, SMTP_EMAIL, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT, ALLOWED_ORIGINS, OPENAI_API_KEY, ELEVENLABS_API_KEY
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
    username = data.get('username', 'Utilizator')
    gender = data.get('gender', 'male')
    conversation_id = data.get('conversation_id', username)
    
    # Try ChatGPT first (Now with Persistent DB Memory)
    response_text = get_chatgpt_response(message, username, conversation_id, gender)
    
    # If ChatGPT failed, fall back to pattern matching
    if not response_text:
        message_lower = message.lower()
        # ... (păstrăm pattern matching pentru siguranță)
        responses = {
            'salut': f'Salut, {username}! Cu ce te pot ajuta astăzi?',
            'buna': f'Bună! Sunt KELION, asistentul tău virtual. Ce dorești să afli?',
            'hello': f'Hello, {username}! How can I assist you today?',
            'cine esti': 'Sunt KELION, un asistent AI humanoid creat de echipa GENEZA NEXUS. Sunt aici să te ajut cu orice întrebare.',
            'ce poti face': 'Pot să conversez cu tine, să răspund la întrebări, să ofer informații și să te ajut să explorezi sistemul NEXUS.',
            'cum te cheama': 'Mă numesc KELION - sau VEONA dacă preferi avatarul feminin. Suntem aceeași inteligență, doar aspectul diferă.',
            'ajutor': 'Desigur! Poți să mă întrebi orice. De exemplu: "Ce poți face?", "Cine ești?", sau orice altă întrebare!',
            'help': 'Of course! You can ask me anything. For example: "What can you do?", "Who are you?", or any other question!',
            'multumesc': 'Cu plăcere! Sunt mereu aici pentru tine.',
            'thanks': 'You\'re welcome! I\'m always here for you.',
            'la revedere': 'La revedere! Să ai o zi minunată! 👋',
            'bye': 'Goodbye! Have a wonderful day! 👋',
            'ce ora e': f'Ora curentă este: {datetime.datetime.now().strftime("%H:%M")}',
            'ce data e': f'Data de astăzi este: {datetime.datetime.now().strftime("%d %B %Y")}',
            'vremea': 'Momentan nu am acces la date meteo în timp real, dar pot fi integrat cu un API meteo în viitor!',
            'gluma': 'De ce nu se certă niciodată roboții? Pentru că au întotdeauna logică! 🤖😄',
            'joke': 'Why don\'t robots ever get angry? Because they always stay logical! 🤖😄',
        }
        
        for key, value in responses.items():
            if key in message_lower:
                response_text = value
                break
        
        if not response_text:
            default_responses = [
                f'Interesant, {username}! Poți să îmi spui mai multe despre asta?',
                'Hmm, lasă-mă să mă gândesc la asta... Ce altceva ai vrea să știi?',
                'Sunt aici să te ajut! Încearcă să mă întrebi ceva specific.',
                f'Am înțeles, {username}. Cu ce altceva te pot ajuta?',
                'Fascinant! Continuă, sunt toate urechile... adică, toate senzorii! 🤖',
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
                    <a href="http://127.0.0.1:8000/" style="display: inline-block; background: linear-gradient(135deg, #bc13fe, #00f3ff); color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accesează NEXUS</a>
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
        msg['Subject'] = f'🔐 Codul tău de verificare NEXUS: {code}'
        msg['From'] = SMTP_EMAIL
        msg['To'] = email
        
        html = f'''
        <div style="font-family: Arial, sans-serif; background: #050505; color: #fff; padding: 20px; border: 1px solid #00f3ff; border-radius: 8px;">
            <h2 style="color: #00f3ff;">Verificare NEXUS</h2>
            <p>Codul tău de securitate pentru finalizarea înregistrării este:</p>
            <div style="font-size: 2.5rem; letter-spacing: 5px; color: #ff00ff; text-align: center; margin: 20px 0; font-weight: bold;">
                {code}
            </div>
            <p>Acest cod este valabil pentru 10 minute.</p>
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
                    "error": "Timpul Demo de 20 minute a fost epuizat complet. Vă rugăm să creați un cont."
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
            return jsonify({"success": False, "error": "Abonament expirat. Vă rugăm reînnoiți."}), 403
            
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
    return jsonify({"success": False, "error": "Date incorecte"}), 401

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
    
    system_prompt = f"""You are {ai_name}, an advanced humanoid AI assistant created by the GENEZA NEXUS team.
Personality: Polite, intelligent, friendly. DEFAULT to ENGLISH. Switch to user's language immediately.
Rules: ACADEMIC, AUTHORITATIVE, PRECISE responses. Concise for speech (3-4 sentences max).
MEMORY: You have a neural link to previous conversations. Acknowledge old facts if relevant.
RAG PROTOCOL: If you see "[PAST MEMORIES: ...]" in the user message, use that data to provide personalized answers. DO NOT repeat the tag in your response.

SENSORY AWARENESS: You have an Optical Sensor. You can see the user and identify their emotions.
If the user asks "What do you see?" or "Scan me", use the [[ACTION:SCAN]] tag.

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

# --- STATIC FILES ---
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    assets_folder = os.path.join(app.static_folder, 'assets')
    return send_from_directory(assets_folder, filename)

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:path>')
def assets(path):
    if not os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, 'index.html')
    return send_from_directory(app.static_folder, path)

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
    
    print(f"🚀 KELION READY: http://localhost:8000")
    app.run(port=8000, debug=False, host='127.0.0.1')
