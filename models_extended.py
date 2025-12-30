# ==============================================================================
# KELION v142 - EXTENDED MODELS
# Bază de date completă pentru: Subscripții, Vouchere, Trafic, Plăți
# ==============================================================================

import datetime
from flask_sqlalchemy import SQLAlchemy

# Notă: Acest fișier va fi importat în app.py
# db = SQLAlchemy() trebuie definit în app.py

# ==============================================================================
# MODEL: Subscription Plans
# ==============================================================================
class SubscriptionPlan:
    """Planuri de abonament disponibile (hardcoded)"""
    PLANS = {
        '1_month': {
            'name': '1 Month',
            'duration_days': 30,
            'price_gbp': 10.00,
            'price_per_month': 10.00,
            'description': 'Full access for 1 month'
        },
        '6_months': {
            'name': '6 Months',
            'duration_days': 180,
            'price_gbp': 42.00,  # 7 * 6
            'price_per_month': 7.00,
            'description': 'Save 30% - 6 months access'
        },
        '12_months': {
            'name': '12 Months',
            'duration_days': 365,
            'price_gbp': 60.00,  # 5 * 12
            'price_per_month': 5.00,
            'description': 'Best value - 50% savings!'
        }
    }
    
    @classmethod
    def get_plan(cls, plan_id):
        return cls.PLANS.get(plan_id)
    
    @classmethod
    def all_plans(cls):
        return cls.PLANS


# Definițiile modelelor SQLAlchemy (vor fi adăugate în app.py)
# Păstrez aici ca referință și documentație

MODELS_SQL = '''
# ==============================================================================
# MODEL: Voucher Codes
# ==============================================================================
class VoucherCode(db.Model):
    __tablename__ = 'voucher_codes'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    value_months = db.Column(db.Integer, default=1)  # Câte luni oferă
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    created_by = db.Column(db.String(80))  # Admin care a creat
    
    # Alocare
    allocated_to_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    allocated_at = db.Column(db.DateTime, nullable=True)
    
    # Status
    is_used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime, nullable=True)
    used_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Expirare cod (opțional)
    expires_at = db.Column(db.DateTime, nullable=True)


# ==============================================================================
# MODEL: User Voucher Usage Tracking (max 3 per user)
# ==============================================================================
class UserVoucherUsage(db.Model):
    __tablename__ = 'user_voucher_usage'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    voucher_id = db.Column(db.Integer, db.ForeignKey('voucher_codes.id'), nullable=False)
    used_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


# ==============================================================================
# MODEL: Traffic/Visitor Tracking
# ==============================================================================
class VisitorLog(db.Model):
    __tablename__ = 'visitor_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(500))
    page_visited = db.Column(db.String(255))
    referrer = db.Column(db.String(500))
    
    # Timestamp detaliat pentru calendar
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    year = db.Column(db.Integer)
    month = db.Column(db.Integer)
    day = db.Column(db.Integer)
    hour = db.Column(db.Integer)
    
    # Geo (optional - requires IP lookup service)
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    
    # User linkage (if logged in)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    username = db.Column(db.String(80), nullable=True)


# ==============================================================================
# MODEL: Payment Records
# ==============================================================================
class PaymentRecord(db.Model):
    __tablename__ = 'payment_records'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Payment details
    amount_gbp = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='GBP')
    payment_method = db.Column(db.String(50))  # paypal, stripe, voucher
    
    # External references
    paypal_order_id = db.Column(db.String(100))
    paypal_subscription_id = db.Column(db.String(100))
    stripe_payment_id = db.Column(db.String(100))
    voucher_code = db.Column(db.String(20))
    
    # Subscription granted
    plan_id = db.Column(db.String(20))  # '1_month', '6_months', '12_months'
    subscription_start = db.Column(db.DateTime)
    subscription_end = db.Column(db.DateTime)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, refunded
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Email sent?
    confirmation_email_sent = db.Column(db.Boolean, default=False)


# ==============================================================================
# MODEL: Subscription Expiry Notifications
# ==============================================================================
class ExpiryNotification(db.Model):
    __tablename__ = 'expiry_notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    notification_type = db.Column(db.String(20))  # '2_days_before', 'expired', 'reactivation'
    sent_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    email_sent = db.Column(db.Boolean, default=False)


# ==============================================================================
# MODEL: Extended User Fields (adăugat la User existent)
# ==============================================================================
# Adăugări la modelul User existent:
#
# - address_line1 = db.Column(db.String(255))
# - address_line2 = db.Column(db.String(255))
# - city = db.Column(db.String(100))
# - postal_code = db.Column(db.String(20))
# - phone_country_code = db.Column(db.String(5))  # +40, +44, etc.
# - phone_verified = db.Column(db.Boolean, default=False)
# - email_verified = db.Column(db.Boolean, default=False)
# - bank_verified = db.Column(db.Boolean, default=False)
# - sms_verification_code = db.Column(db.String(6))
# - sms_code_sent_at = db.Column(db.DateTime)
# - paypal_subscription_id = db.Column(db.String(100))  # For recurring
'''

# Country codes for phone validation
COUNTRY_PHONE_CODES = {
    'RO': '+40',
    'UK': '+44',
    'US': '+1',
    'DE': '+49',
    'FR': '+33',
    'IT': '+39',
    'ES': '+34',
    'NL': '+31',
    'BE': '+32',
    'AT': '+43',
    'CH': '+41',
    'PL': '+48',
    'CZ': '+420',
    'HU': '+36',
    'BG': '+359',
    'GR': '+30',
    'PT': '+351',
    'SE': '+46',
    'NO': '+47',
    'DK': '+45',
    'FI': '+358',
    'IE': '+353',
    # Add more as needed
}

# Legal compliance messages
AI_SAFETY_RULES = {
    'child_protection': "I cannot provide content that could harm minors or violate child protection laws.",
    'personal_data': "I cannot share personal information about individuals without their consent.",
    'hacking': "I cannot assist with hacking, unauthorized access, or any illegal cyber activities.",
    'illegal_content': "I cannot help create or distribute illegal content.",
    'gdpr_notice': "Your data is processed in accordance with GDPR and applicable privacy laws."
}
