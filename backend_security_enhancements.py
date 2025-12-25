"""
SECURITY ENHANCEMENTS - Add these to backend.py
Instructions: Merge these imports and configurations into your backend.py
"""

# ═══════════════════════════════════════════════════════════
# ADDITIONAL IMPORTS FOR SECURITY
# ═══════════════════════════════════════════════════════════

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import Schema, fields, validate, ValidationError
from flask_talisman import Talisman

# ═══════════════════════════════════════════════════════════
# RATE LIMITING CONFIGURATION
# ═══════════════════════════════════════════════════════════

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

#═══════════════════════════════════════════════════════════
# HTTPS ENFORCEMENT (Production only)
# ═══════════════════════════════════════════════════════════

if not app.debug:
    Talisman(app, 
             force_https=True,
             strict_transport_security=True,
             strict_transport_security_max_age=31536000)

# ═══════════════════════════════════════════════════════════
# INPUT VALIDATION SCHEMAS
# ═══════════════════════════════════════════════════════════

class ChatRequestSchema(Schema):
    message = fields.Str(required=True, validate=validate.Length(min=1, max=2000))
    user_id = fields.Str(required=True, validate=validate.Length(max=100))
    language = fields.Str(validate=validate.OneOf(['en', 'ro']), missing='en')

class MemoryRequestSchema(Schema):
    user_id = fields.Str(required=True, validate=validate.Length(max=100))
    key = fields.Str(required=True, validate=validate.Length(max=200))
    value = fields.Str(required=True, validate=validate.Length(max=5000))

# ═══════════════════════════════════════════════════════════
# SECURITY HEADERS
# ═══════════════════════════════════════════════════════════

@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response

# ═══════════════════════════════════════════════════════════
# UPDATED CORS CONFIGURATION
# ═══════════════════════════════════════════════════════════

# Replace existing CORS(app) with:
ALLOWED_ORIGINS = [
    "https://chipper-melba-0f3b83.netlify.app",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]

CORS(app, resources={
    r"/api/*": {
        "origins": ALLOWED_ORIGINS,
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type", "X-API-Key"]
    }
})

# ═══════════════════════════════════════════════════════════
# EXAMPLE: Protected Endpoint with Rate Limiting & Validation
# ═══════════════════════════════════════════════════════════

@app.route('/api/nexus/chat', methods=['POST'])
@limiter.limit("10 per minute")  # ADD THIS
def chat():
    # Validate input
    schema = ChatRequestSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify({'error': 'Invalid input', 'details': err.messages}), 400
    
    # Continue with validated data
    message = data['message']
    user_id = data['user_id']
    
    # ... rest of your existing code ...
