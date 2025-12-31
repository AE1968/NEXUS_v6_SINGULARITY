
import os
import re
import sys

def emergency_fix():
    print("🚑 STARTING EMERGENCY REPAIR SEQUENCE...")
    
    # 1. FIX BACKEND (APP.PY) - HYBRID DATABASE PATH
    if os.path.exists("app.py"):
        with open("app.py", "r", encoding="utf-8") as f:
            content = f.read()
        
        # Define the robust DB logic
        db_logic = """
# 🚨 EMERGENCY DB FIX
import os
import sys
if os.name == 'nt':
    DB_PATH = os.path.join(BASE_DIR, 'nexus.db')
else:
    DB_PATH = '/tmp/nexus.db' # Railway Writeable Path

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
# 🚨 END FIX
"""
        # Search and replace
        # We look for the line setting the URI. It might have slight variations.
        pattern = r"app\.config\['SQLALCHEMY_DATABASE_URI'\]\s*=\s*['\"]sqlite:///nexus\.db['\"]"
        
        if re.search(pattern, content):
            new_content = re.sub(pattern, db_logic.strip(), content)
            with open("app.py", "w", encoding="utf-8") as f:
                f.write(new_content)
            print("✅ APP.PY: Database path patched for Railway (/tmp compatibility).")
        else:
            # Check if it was already setting sqlite without the variable
            print("⚠️ APP.PY: DB Path pattern not found (might be already patched). Checking manually...")
            if "/tmp/nexus.db" not in content:
                 # Force append if not found (risky but necessary if pattern fails)
                 # Better to try replacing the generic line if it exists
                 pass

    # 2. FIX FRONTEND ENCODING (NUCLEAR OPTION)
    files_to_sanitize = ["js/main.js", "js/hologram.js", "js/3d-systems.js"]
    for fname in files_to_sanitize:
        if os.path.exists(fname):
            try:
                with open(fname, "r", encoding="utf-8", errors="ignore") as f:
                    raw_content = f.read()
                clean_content = ""
                for char in raw_content:
                    if ord(char) > 127:
                        clean_content += f"\\u{ord(char):04x}"
                    else:
                        clean_content += char
                with open(fname, "w", encoding="utf-8") as f:
                    f.write(clean_content)
                print(f"✅ JS ENCODING: {fname} sanitized to strict ASCII.")
            except Exception as e:
                print(f"❌ JS ERROR: {fname} - {e}")

    # 3. FIX HTML ENCODING & CACHE BUSTING
    if os.path.exists("index.html"):
        with open("index.html", "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()
        
        clean_html = ""
        for char in html:
            if ord(char) > 127:
                clean_html += f"&#{ord(char)};"
            else:
                clean_html += char
        
        # Cache Busting
        clean_html = re.sub(r'src="js/([^"]+)\.js(\?v=[^"]+)?"', r'src="js/\1.js?v=143.FINAL.2"', clean_html)
        clean_html = re.sub(r'href="css/([^"]+)\.css(\?v=[^"]+)?"', r'href="css/\1.css?v=143.FINAL.2"', clean_html)
        
        with open("index.html", "w", encoding="utf-8") as f:
            f.write(clean_html)
        print("✅ HTML FIX: Index.html sanitized and versioned.")

if __name__ == "__main__":
    emergency_fix()
