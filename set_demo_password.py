
import sys
import os
from werkzeug.security import generate_password_hash
from app import app, db, User

def set_demo_password():
    with app.app_context():
        # Find demo user
        demo_user = User.query.filter_by(username='demo').first()
        
        if demo_user:
            print(f"Found user 'demo'. Updating password...")
            demo_user.password_hash = generate_password_hash('demo123')
            
            try:
                db.session.commit()
                print("✅ User 'demo' password updated to 'demo123' successfully!")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error updating password: {e}")
        else:
            print("❌ User 'demo' not found. Creating it now...")
            # Optional: Create if not exists, though user implied it exists ("predefineste pe fundal demo")
            # If the user meant "ensure it exists with this password", I should probably create it if missing.
            # But the previous tool output showed ID 2 is 'demo', so it exists.
            # Just incase, I'll add creation logic if missing, to be safe "predefineste".
            new_demo = User(
                username='demo',
                email='demo@kelionai.app', # Placeholder email
                password_hash=generate_password_hash('demo123'),
                role='user',
                subscription='demo',
                first_name='Demo',
                last_name='User',
                account_status='active'
            )
            db.session.add(new_demo)
            try:
                db.session.commit()
                print("✅ User 'demo' created with password 'demo123'!")
            except Exception as e:
                print(f"❌ Error creating user: {e}")

if __name__ == "__main__":
    set_demo_password()
