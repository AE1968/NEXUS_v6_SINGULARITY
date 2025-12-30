
import sys
import os
from werkzeug.security import generate_password_hash
from app import app, db, User

def create_admin_user():
    with app.app_context():
        # Check if admin exists
        admin = User.query.filter_by(username='admin').first()
        
        if admin:
            print("Admin user found. Updating password...")
            admin.password_hash = generate_password_hash('Andrada_1968!')
            admin.email = 'contact@kelionai.app'
            admin.role = 'admin'
            admin.subscription = 'enterprise'
            admin.account_status = 'active'
        else:
            print("Creating new admin user...")
            new_admin = User(
                username='admin',
                email='contact@kelionai.app',
                password_hash=generate_password_hash('Andrada_1968!'),
                role='admin',
                subscription='enterprise',
                first_name='Admin',
                last_name='User',
                account_status='active'
            )
            db.session.add(new_admin)
            
        try:
            db.session.commit()
            print("✅ Admin user 'admin' configured successfully!")
            print("Email: contact@kelionai.app")
            print("Password: Andrada_1968!")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    create_admin_user()
