
import os
import json
import random
import string
import datetime
import logging
import requests
import jwt
from functools import wraps
from flask import Flask, request, jsonify, render_template, send_from_directory, redirect, url_for
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ==============================================================================
# CONFIGURATION & INITIALIZATION
# ==============================================================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_NAME = "nexus.db"

# CRITICAL: Hybrid Database Path (Railway Persistence)
if os.name == 'nt':
    DB_PATH = os.path.join(BASE_DIR, DB_NAME)
else:
    DB_PATH = '/tmp/nexus.db'

app = Flask(__name__, static_folder=BASE_DIR)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'v143-neural-secret-key-8822')

db = SQLAlchemy(app)

# Environment Variables
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
SERPER_API_KEY = os.environ.get('SERPER_API_KEY')
SMTP_EMAIL = "contact@kelionai.app"
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')

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
    
    # v143 Features
    address_line1 = db.Column(db.String(255))
    city = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    vouchers_used_count = db.Column(db.Integer, default=0)

    def is_subscription_active(self):
        if self.role == 'admin': return True
        if not self.subscription_end_date: return False
        return datetime.datetime.utcnow() < self.subscription_end_date

class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    user_message = db.Column(db.Text, nullable=False)
    ai_response = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class VisitorLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(50))
    page_visited = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# ==============================================================================
# UTILS
# ==============================================================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token.replace('Bearer ', ''), app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(username=data['username']).first()
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def search_web(query):
    if not SERPER_API_KEY: return {"error": "API Key missing"}
    try:
        url = "https://google.serper.dev/search"
        headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
        response = requests.post(url, headers=headers, json={"q": query, "num": 3}, timeout=5)
        if response.status_code == 200:
            return {"success": True, "results": response.json().get("organic", [])}
    except Exception as e:
        return {"error": str(e)}
    return {"error": "Search failed"}

# ==============================================================================
# ROUTES
# ==============================================================================
@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/api/status')
def status():
    return jsonify({"status": "online", "version": "v143.0", "engine": "KELION_NEURAL"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter((User.username == data.get('username')) | (User.email == data.get('username'))).first()
    if user and check_password_hash(user.password_hash, data.get('password')):
        token = jwt.encode({
            'username': user.username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({
            "success": True, 
            "token": token,
            "username": user.username,
            "subscription": user.subscription
        })
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    username = data.get('username', 'Guest')
    
    # English-Only Neural Response Logic
    system_prompt = "You are KELION v143.0, a humanoid AI. ALWAYS respond in English. Be concise (3-4 sentences)."
    
    if not OPENAI_API_KEY:
        return jsonify({"success": True, "response": "System is in offline mode (API key missing)."})

    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ]
            },
            timeout=15
        )
        ai_reply = response.json()['choices'][0]['message']['content']
        return jsonify({"success": True, "response": ai_reply})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/track', methods=['POST'])
def track():
    data = request.json
    log = VisitorLog(ip_address=request.remote_addr, page_visited=data.get('page'))
    db.session.add(log)
    db.session.commit()
    return jsonify({"success": True})

# Serve Static Files
@app.route('/js/<path:path>')
def send_js(path): return send_from_directory(os.path.join(BASE_DIR, 'js'), path)

@app.route('/css/<path:path>')
def send_css(path): return send_from_directory(os.path.join(BASE_DIR, 'css'), path)

@app.route('/assets/<path:path>')
def send_assets(path): return send_from_directory(os.path.join(BASE_DIR, 'assets'), path)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        import migrate_db
        try: migrate_db.migrate()
        except: pass
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
