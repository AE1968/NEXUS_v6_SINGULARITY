
import os
import sys

file_path = r"C:\Users\adria\.gemini\antigravity\scratch\GENEZA_NEXUS_HUMANOID\KELIONAI_CREDENTIALS.md"
url_files = [
    r"C:\Users\adria\.gemini\antigravity\scratch\GENEZA_NEXUS_HUMANOID\backend_url.txt",
    r"C:\Users\adria\.gemini\antigravity\scratch\GENEZA_NEXUS_HUMANOID\frontend_url.txt"
]

def read_file(path):
    print(f"--- READING {os.path.basename(path)} ---")
    if not os.path.exists(path):
        print("File not found.")
        return
    
    encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
    content = None
    for enc in encodings:
        try:
            with open(path, 'r', encoding=enc) as f:
                content = f.read()
            print(f"Successfully read with {enc}")
            break
        except Exception:
            continue
            
    if content:
        # Print line by line safely, replacing control chars
        for line in content.splitlines():
            print(line.encode('ascii', 'replace').decode('ascii'))
    else:
        print("Failed to read with standard encodings.")
    print("\n")

read_file(file_path)
for u in url_files:
    read_file(u)
