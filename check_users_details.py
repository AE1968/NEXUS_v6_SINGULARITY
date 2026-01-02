
import sqlite3
import os

DB_NAME = 'nexus.db'
if not os.path.exists(DB_NAME):
    print(f"Database {DB_NAME} not found!")
else:
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        print(f"--- Users in {DB_NAME} ---")
        cursor.execute("SELECT id, username, email, role, account_status FROM user")
        users = cursor.fetchall()
        
        for user in users:
            print(f"ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Role: {user[3]}, Status: {user[4]}")
            
        conn.close()
    except Exception as e:
        print(f"Error reading {DB_NAME}: {e}")
