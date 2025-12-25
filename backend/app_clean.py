import os
import json
import logging
import re
import random
import smtplib
import datetime
import jwt
from functools import wraps
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

import requests
from config_kelion import PAYPAL_CLIENT_ID, PAYPAL_SECRET, SECRET_KEY, DB_NAME, SMTP_EMAIL, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT, ALLOWED_ORIGINS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# ==============================================================================
#  FLASK & DB INIT
# ==============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), 'frontend')
DB_PATH = os.path.join(BASE_DIR, DB_NAME)

app = Flask(__name__, static_folder=FRONTEND_DIR)
app.config['SECRET_KEY'] = SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

CORS(app, origins=ALLOWED_ORIGINS)
db = SQLAlchemy(app)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('KELION_CORE')

# ==============================================================================
# DATABASE MODELS
# ==============================================================================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')
    subscription = db.Column(db.String(20), default='basic')
    account_status = db.Column(db.String(20), default='pending_payment')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    billing_history = db.Column(db.Text, default='[]')

# ==============================================================================
# SECURITY DECORATORS
# ==============================================================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'success': False, 'error': 'Token is missing. Authorization required.'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(username=data['username']).first()
            if not current_user:
                 raise Exception("User not found")
        except Exception as e:
            return jsonify({'success': False, 'error': 'Token is invalid or expired.'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'success': False, 'error': 'ACCESS DENIED. Admin privileges required.'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# ==============================================================================
# EMAIL & OTP UTILS
# ==============================================================================
OTP_STORAGE = {}

def send_email(to_email, code):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        return False
    try:
        msg = MIMEMultipart()
        msg['From'] = f"KELION SECURITY <{SMTP_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = f"Code: {code}"
        
        body = f"<h1>{code}</h1><p>Kelion Verification Code.</p>"
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except:
        return False

# ==============================================================================
# API ROUTES
# ==============================================================================

@app.route('/api/config')
def get_config():
    return jsonify({
        "paypal_client_id": PAYPAL_CLIENT_ID,
        "api_url": request.host_url.rstrip('/')
    })

@app.route('/status')
def status():
    return jsonify({"status": "online", "system": "KELION v10.0 PRO", "db": "SQLite", "security": "JWT+BCRYPT+S2S_PAYPAL"})

# --- AUTH ---

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401
        
    if check_password_hash(user.password_hash, password):
        if user.account_status != 'active':
             return jsonify({"success": False, "error": "Account not active. Payment required."}), 403
        
        # GENERATE TOKEN
        token = jwt.encode({
            'username': user.username,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        return jsonify({
            "success": True,
            "token": token,
            "role": user.role,
            "subscription": user.subscription,
            "username": user.username
        })
    
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/api/send-code', methods=['POST'])
@limiter.limit("3 per hour")
def send_code_api():
    email = request.json.get('email')
    code = str(random.randint(100000, 999999))
    OTP_STORAGE[email] = code
    
    sent = send_email(email, code)
    if sent: 
        logger.info(f"Email sent to {email}")
    else:
        print(f"\n[SIMULATION] Code for {email}: {code}\n")
    
    return jsonify({"success": True})

@app.route('/api/verify-code', methods=['POST'])
@limiter.limit("10 per hour")
def verify_code_api():
    email = request.json.get('email')
    code = request.json.get('code')
    
    if OTP_STORAGE.get(email) == code:
        del OTP_STORAGE[email]
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Invalid Code"}), 400

def get_paypal_access_token():
    try:
        res = requests.post(
            "https://api-m.paypal.com/v1/oauth2/token",
            auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
            data={"grant_type": "client_credentials"}
        )
        return res.json().get('access_token')
    except:
        return None

@app.route('/api/register', methods=['POST'])
@limiter.limit("5 per hour")
def register():
    data = request.json
    order_id = data.get('paypalOrderId')
    
    # SERVER-SIDE VERIFICATION
    if not order_id:
        return jsonify({"success": False, "error": "Missing Payment Evidence"}), 400
        
    token = get_paypal_access_token()
    if not token:
        return jsonify({"success": False, "error": "Payment Gateway Offline"}), 500
        
    pay_res = requests.get(
        f"https://api-m.paypal.com/v2/checkout/orders/{order_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    order_details = pay_res.json()
    
    if order_details.get('status') != 'COMPLETED':
         return jsonify({"success": False, "error": "Payment not authorized by PayPal"}), 402

    # Check existing user
    if User.query.filter((User.username==data['username']) | (User.email==data['email'])).first():
        return jsonify({"success": False, "error": "User or Email already exists"}), 409
        
    # CREATE ACCOUNT
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        subscription=data['plan'],
        account_status='active',
        role='user'
    )
    
    # Audit log
    payment_record = [{
        "transactionId": order_id,
        "amount": order_details['purchase_units'][0]['amount']['value'],
        "currency": "GBP",
        "date": datetime.datetime.utcnow().isoformat()
    }]
    new_user.billing_history = json.dumps(payment_record)
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"success": True})

# --- ADMIN ROUTES ---

@app.route('/api/users', methods=['GET'])
@admin_required
def get_all_users(current_user):
    users = User.query.all()
    output = {}
    for u in users:
        try:
            hist = json.loads(u.billing_history)
        except:
            hist = []
        
        output[u.username] = {
            "email": u.email,
            "role": u.role,
            "subscription": u.subscription,
            "accountStatus": u.account_status,
            "password": "********",
            "billing": {"history": hist}
        }
    return jsonify(output)

@app.route('/api/users/<username>', methods=['DELETE'])
@admin_required
def delete_user(current_user, username):
    if username in ['admin', 'demo']:
        return jsonify({"success": False, "error": "Protected"}), 403
        
    user = User.query.filter_by(username=username).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Not found"}), 404

@app.route('/api/users/<username>', methods=['PUT'])
@admin_required
def update_user(current_user, username):
    user = User.query.filter_by(username=username).first()
    if user:
        user.subscription = request.json.get('plan')
        db.session.commit()
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Not found"}), 404

# --- STATIC ---
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def assets(path):
    return send_from_directory(app.static_folder, path)

# --- INIT ---
if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        with app.app_context():
            db.create_all()
            print("DATABASE CREATED (SQLite)")
            
            # Create Default Admin
            admin = User(
                username='admin',
                email='admin@kelion.ai',
                password_hash=generate_password_hash('Andrada_1968!'),
                role='admin',
                subscription='enterprise',
                account_status='active'
            )
            demo = User(
                username='demo',
                email='demo@kelion.ai',
                password_hash=generate_password_hash('demo'),
                role='demo',
                subscription='basic',
                account_status='active'
            )
            db.session.add(admin)
            db.session.add(demo)
            db.session.commit()
            print("ADMIN & DEMO ACCOUNTS CREATED")

    print("KELION PRO SERVER RUNNING (PORT 8000)")
    print("Access at: http://localhost:8000/status")
    app.run(port=8000, debug=True, host='0.0.0.0')
