"""
KELION Backend - Minimal Test Version
This is a simplified version to test Render deployment
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://kelionai.app", "http://localhost:8000"])

@app.route('/')
def index():
    return jsonify({
        "status": "ONLINE",
        "system": "KELION BACKEND TEST",
        "version": "1.0",
        "message": "Backend is running successfully on Render!"
    })

@app.route('/status')
def status():
    return jsonify({
        "status": "online",
        "system": "KELION v1.31",
        "engine": "Flask/Python",
        "cloud": "Render.com"
    })

@app.route('/health')
def health():
    return jsonify({"healthy": True, "port": os.getenv('PORT', '8000')})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    print(f"🚀 KELION TEST SERVER READY on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
