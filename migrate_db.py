import sqlite3
import os

DB_NAME = 'nexus.db'

def migrate():
    if not os.path.exists(DB_NAME):
        print(f"Error: {DB_NAME} not found.")
        return

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    print(f"Starting migration for {DB_NAME}...")

    # 1. Update 'user' table
    # We check which columns are missing and add them
    cursor.execute("PRAGMA table_info(user)")
    existing_columns = [c[1] for c in cursor.fetchall()]
    
    new_columns = [
        ('address_line1', 'TEXT'),
        ('address_line2', 'TEXT'),
        ('city', 'TEXT'),
        ('postal_code', 'TEXT'),
        ('phone_country_code', 'TEXT'),
        ('email_verified', 'BOOLEAN DEFAULT 0'),
        ('phone_verified', 'BOOLEAN DEFAULT 0'),
        ('bank_verified', 'BOOLEAN DEFAULT 0'),
        ('sms_verification_code', 'TEXT'),
        ('sms_code_sent_at', 'DATETIME'),
        ('paypal_subscription_id', 'TEXT'),
        ('reset_token', 'TEXT'),
        ('reset_token_expires', 'DATETIME'),
        ('vouchers_used_count', 'INTEGER DEFAULT 0')
    ]

    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            print(f"Adding column '{col_name}' to 'user' table...")
            try:
                cursor.execute(f"ALTER TABLE user ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")

    # 2. Create missing tables
    tables_to_create = {
        'trial_users': """
            CREATE TABLE IF NOT EXISTS trial_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL,
                trial_start DATETIME,
                trial_end DATETIME,
                daily_seconds_used INTEGER DEFAULT 0,
                last_daily_reset DATE,
                is_trial_active BOOLEAN DEFAULT 1,
                FOREIGN KEY(user_id) REFERENCES user(id)
            )
        """,
        'voucher_codes': """
            CREATE TABLE IF NOT EXISTS voucher_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                value_months INTEGER DEFAULT 1,
                created_at DATETIME,
                created_by TEXT,
                allocated_to_user_id INTEGER,
                allocated_at DATETIME,
                is_used BOOLEAN DEFAULT 0,
                used_at DATETIME,
                used_by_user_id INTEGER,
                expires_at DATETIME,
                FOREIGN KEY(allocated_to_user_id) REFERENCES user(id),
                FOREIGN KEY(used_by_user_id) REFERENCES user(id)
            )
        """,
        'payment_records': """
            CREATE TABLE IF NOT EXISTS payment_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount_gbp REAL NOT NULL,
                currency TEXT DEFAULT 'GBP',
                payment_method TEXT,
                paypal_order_id TEXT,
                paypal_subscription_id TEXT,
                voucher_code TEXT,
                plan_id TEXT,
                subscription_start DATETIME,
                subscription_end DATETIME,
                status TEXT DEFAULT 'pending',
                created_at DATETIME,
                completed_at DATETIME,
                confirmation_email_sent BOOLEAN DEFAULT 0,
                FOREIGN KEY(user_id) REFERENCES user(id)
            )
        """,
        'visitor_logs': """
            CREATE TABLE IF NOT EXISTS visitor_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT,
                user_agent TEXT,
                page_visited TEXT,
                referrer TEXT,
                timestamp DATETIME,
                year INTEGER,
                month INTEGER,
                day INTEGER,
                hour INTEGER,
                country TEXT,
                city TEXT,
                user_id INTEGER,
                username TEXT,
                FOREIGN KEY(user_id) REFERENCES user(id)
            )
        """,
        'expiry_notifications': """
            CREATE TABLE IF NOT EXISTS expiry_notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                notification_type TEXT,
                sent_at DATETIME,
                email_sent BOOLEAN DEFAULT 0,
                FOREIGN KEY(user_id) REFERENCES user(id)
            )
        """,
        'user_memories': """
            CREATE TABLE IF NOT EXISTS user_memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                memory_key TEXT NOT NULL,
                memory_value TEXT NOT NULL,
                memory_type TEXT DEFAULT 'personal',
                importance INTEGER DEFAULT 1,
                created_at DATETIME,
                last_recalled DATETIME,
                recall_count INTEGER DEFAULT 0
            )
        """,
        'conversation_summaries': """
            CREATE TABLE IF NOT EXISTS conversation_summaries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                summary TEXT NOT NULL,
                last_updated DATETIME,
                token_count INTEGER DEFAULT 0
            )
        """
    }

    for table_name, create_sql in tables_to_create.items():
        print(f"Ensuring table '{table_name}' exists...")
        cursor.execute(create_sql)

    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
