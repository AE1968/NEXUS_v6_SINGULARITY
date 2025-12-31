import sqlite3
import os

def check_db(db_name, log):
    log.write(f"--- Checking {db_name} ---\n")
    if not os.path.exists(db_name):
        log.write(f"File {db_name} not found.\n")
        return
    
    try:
        conn = sqlite3.connect(db_name)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        log.write(f"Tables found: {tables}\n")
        
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table});")
            columns = [c[1] for c in cursor.fetchall()]
            log.write(f"Table '{table}' columns: {columns}\n")
            
            cursor.execute(f"SELECT COUNT(*) FROM {table};")
            count = cursor.fetchone()[0]
            log.write(f"Table '{table}' entry count: {count}\n")
            
        conn.close()
    except Exception as e:
        log.write(f"Error checking {db_name}: {e}\n")

with open('audit_db_result.txt', 'w', encoding='utf-8') as f:
    check_db('nexus.db', f)
    check_db('kelion_mainframe.db', f)
