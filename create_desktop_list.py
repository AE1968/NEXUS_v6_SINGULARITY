
import os
import re

# Paths
creds_path = r"C:\Users\adria\.gemini\antigravity\scratch\GENEZA_NEXUS_HUMANOID\CREDENTIALE_ADMIN_SI_RESURSE.txt"
backend_url_path = r"C:\Users\adria\.gemini\antigravity\scratch\GENEZA_NEXUS_HUMANOID\backend_url.txt"
frontend_url_path = r"C:\Users\adria\.gemini\antigravity\scratch\GENEZA_NEXUS_HUMANOID\frontend_url.txt"
desktop_path = r"C:\Users\adria\Desktop\servere detalii.txt"

content_lines = []

def read_file_safe(path, enc='utf-8'):
    if not os.path.exists(path):
        return f"[MISSING FILE: {os.path.basename(path)}]"
    try:
        with open(path, 'r', encoding=enc) as f:
            return f.read()
    except UnicodeError:
        try:
             with open(path, 'r', encoding='utf-16') as f:
                return f.read()
        except UnicodeError:
            try:
                with open(path, 'r', encoding='latin-1') as f:
                    return f.read()
            except Exception as e:
                return f"[ERROR READING {os.path.basename(path)}: {str(e)}]"

# 1. Read Credentials
print("Reading credentials...")
creds_content = read_file_safe(creds_path, 'utf-16') # We identified it as UTF-16
content_lines.append("=== DETALII SERVERE SI CREDENTIALE - GENEZA NEXUS ===\n")
content_lines.append(creds_content.strip())
content_lines.append("\n" + "="*40 + "\n")

# 2. Add Live URLs (Serveo/Pinggy)
content_lines.append("=== ADRESE LIVE TEMPORARE (TUNNELED) ===\n")

# Backend
b_content = read_file_safe(backend_url_path, 'utf-8') # Likely log file
# Extract URL from Serveo log
match_b = re.search(r'https?://[a-zA-Z0-9-]+\.(?:serveo\.net|pinggy\.io|serveousercontent\.com|up\.railway\.app)', b_content)
if match_b:
    content_lines.append(f"BACKEND URL (Live): {match_b.group(0)}")
else:
    content_lines.append(f"BACKEND URL (Raw): {b_content.strip()[:200]}...") # Show snippet if no URL found

# Frontend
f_content = read_file_safe(frontend_url_path, 'utf-8')
match_f = re.search(r'https?://[a-zA-Z0-9-]+\.(?:serveo\.net|pinggy\.io|serveousercontent\.com|netlify\.app)', f_content)
if match_f:
    content_lines.append(f"FRONTEND URL (Live): {match_f.group(0)}")
else:
    content_lines.append(f"FRONTEND URL (Raw): {f_content.strip()[:200]}...")

# 3. Write to Desktop
desktop_path = os.path.join(os.path.expanduser("~"), "Desktop", "servere detalii.txt")
full_content = "\n".join(content_lines)

try:
    with open(desktop_path, 'w', encoding='utf-8') as f:
        f.write(full_content)
    print(f"SUCCESS: File created at {desktop_path}")
    print("Preview:\n" + full_content[:300])
except Exception as e:
    print(f"FAILED to write to desktop: {e}")
    # Try alternate path if OneDrive is involved
    try:
        onedrive_desktop = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop", "servere detalii.txt")
        with open(onedrive_desktop, 'w', encoding='utf-8') as f:
             f.write(full_content)
        print(f"SUCCESS: File created at {onedrive_desktop}")
    except Exception as e2:
         print(f"FAILED to write to OneDrive desktop: {e2}")
         print("CONTENT FOR MANUAL COPY:")
         print(full_content)

