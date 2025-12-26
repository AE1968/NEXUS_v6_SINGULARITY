# KELION BACKEND - ALL APIs ACTIVE - Version FINAL
# Toate API-urile sunt integrate și active permanent

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///kelion.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ============================================
# DATABASE MODELS - ALL ACTIVE
# ============================================

class IPVisit(db.Model):
    """IP Visit Tracking - ACTIVE"""
    __tablename__ = 'ip_visits'
    
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), nullable=False)
    public_ip = db.Column(db.String(45))  # VPN IP if different
    
    # Location
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    city = db.Column(db.String(100))
    country = db.Column(db.String(100))
    region = db.Column(db.String(100))
    
    # Address details
    street = db.Column(db.String(200))
    postal_code = db.Column(db.String(20))
    isp = db.Column(db.String(100))
    
    # Timestamp (for chronological sorting)
    visit_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    day = db.Column(db.Integer)
    month = db.Column(db.Integer)
    year = db.Column(db.Integer)
    hour = db.Column(db.Integer)
    minute = db.Column(db.Integer)
    
    # VPN Detection
    vpn_detected = db.Column(db.Boolean, default=False)
    
    # User agent and session
    user_agent = db.Column(db.String(500))
    session_id = db.Column(db.String(100))
    
    def __init__(self, **kwargs):
        super(IPVisit, self).__init__(**kwargs)
        if self.visit_date:
            self.day = self.visit_date.day
            self.month = self.visit_date.month
            self.year = self.visit_date.year
            self.hour = self.visit_date.hour
            self.minute = self.visit_date.minute
    
    def to_dict(self):
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'public_ip': self.public_ip,
            'location': {
                'latitude': self.latitude,
                'longitude': self.longitude,
                'city': self.city,
                'country': self.country,
                'region': self.region
            },
            'address': {
                'street': self.street,
                'postal_code': self.postal_code,
                'isp': self.isp
            },
            'timestamp': {
                'full': self.visit_date.isoformat(),
                'day': self.day,
                'month': self.month,
                'year': self.year,
                'hour': self.hour,
                'minute': self.minute
            },
            'vpn_detected': self.vpn_detected,
            'user_agent': self.user_agent,
            'session_id': self.session_id
        }

# ============================================
# API ENDPOINTS - ALL ACTIVE
# ============================================

@app.route('/api/status', methods=['GET'])
def status():
    """Health check - ACTIVE"""
    return jsonify({
        'status': 'online',
        'version': 'KELION v10.0 - All APIs Active',
        'timestamp': datetime.utcnow().isoformat(),
        'apis': {
            'ip_visits': 'ACTIVE',
            'statistics': 'ACTIVE',
            'health': 'ACTIVE'
        }
    }), 200

@app.route('/api/ip-visits', methods=['POST'])
def add_ip_visit():
    """Add IP visit - ACTIVE"""
    try:
        data = request.json
        
        visit = IPVisit(
            ip_address=data.get('ip_address'),
            public_ip=data.get('public_ip'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            city=data.get('city'),
            country=data.get('country'),
            region=data.get('region'),
            street=data.get('street'),
            postal_code=data.get('postal_code'),
            isp=data.get('isp'),
            vpn_detected=data.get('vpn_detected', False),
            user_agent=data.get('user_agent'),
            session_id=data.get('session_id')
        )
        
        db.session.add(visit)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'IP visit recorded',
            'visit': visit.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ip-visits', methods=['GET'])
def get_ip_visits():
    """Get IP visits - ACTIVE - Sorted chronologically"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        year = request.args.get('year', type=int)
        month = request.args.get('month', type=int)
        day = request.args.get('day', type=int)
        country = request.args.get('country', type=str)
        
        query = IPVisit.query
        
        if year:
            query = query.filter_by(year=year)
        if month:
            query = query.filter_by(month=month)
        if day:
            query = query.filter_by(day=day)
        if country:
            query = query.filter_by(country=country)
        
        # CHRONOLOGICAL SORT - ALWAYS ACTIVE
        query = query.order_by(
            IPVisit.year.desc(),
            IPVisit.month.desc(),
            IPVisit.day.desc(),
            IPVisit.hour.desc(),
            IPVisit.minute.desc()
        )
        
        total = query.count()
        visits = query.limit(limit).offset(offset).all()
        
        return jsonify({
            'success': True,
            'total': total,
            'limit': limit,
            'offset': offset,
            'visits': [visit.to_dict() for visit in visits]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ip-visits/stats', methods=['GET'])
def get_visit_stats():
    """Get statistics - ACTIVE"""
    try:
        from sqlalchemy import func
        
        total_visits = IPVisit.query.count()
        
        # Visits by day (last 30 days)
        visits_by_day = db.session.query(
            IPVisit.year,
            IPVisit.month,
            IPVisit.day,
            func.count(IPVisit.id).label('count')
        ).group_by(
            IPVisit.year,
            IPVisit.month,
            IPVisit.day
        ).order_by(
            IPVisit.year.desc(),
            IPVisit.month.desc(),
            IPVisit.day.desc()
        ).limit(30).all()
        
        # Visits by country
        visits_by_country = db.session.query(
            IPVisit.country,
            func.count(IPVisit.id).label('count')
        ).group_by(
            IPVisit.country
        ).order_by(
            func.count(IPVisit.id).desc()
        ).limit(10).all()
        
        # VPN detection stats
        vpn_count = IPVisit.query.filter_by(vpn_detected=True).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_visits': total_visits,
                'vpn_detected': vpn_count,
                'vpn_percentage': (vpn_count / total_visits * 100) if total_visits > 0 else 0,
                'by_day': [
                    {
                        'date': f'{item.year}-{item.month:02d}-{item.day:02d}',
                        'count': item.count
                    }
                    for item in visits_by_day
                ],
                'by_country': [
                    {
                        'country': item.country,
                        'count': item.count
                    }
                    for item in visits_by_country
                ]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# INITIALIZE DATABASE - AUTO
# ============================================

with app.app_context():
    db.create_all()
    print("✅ All database tables created")
    print("✅ All APIs are ACTIVE and ready")

# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
