import paramiko
import sys

# Force UTF-8 for output file
sys.stdout.reconfigure(encoding='utf-8')

HOST = 'fs-cygni.easywp.com'
USER = 'geneza-kelion-129030d'
PASS = 'vAMhj455TYdCtTUd1dM8'

output_log = []

def log(msg):
    print(msg)
    output_log.append(msg)

log("🕵️ EXTRAGERE DOVADA DIRECT DE PE SERVER (SFTP)...")

try:
    transport = paramiko.Transport((HOST, 22))
    transport.connect(username=USER, password=PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    # 1. LISTARE FISIERE
    files = sftp.listdir('.')
    log(f"\n📂 FISIERE PE SERVER: {files}")
    
    if 'index.html' in files:
        log("❌ ATENTIE: index.html inca exista! (Asta e problema)")
    else:
        log("✅ CONFIRMAT: index.html NU exista.")

    # 2. CITIRE CONTINUT index.php
    log("\n------------------------------------------------")
    log("PAGE SOURCE (index.php) - Primele 500 caractere:")
    with sftp.open('index.php', 'r') as f:
        content = f.read().decode('utf-8')
        log(content[:500])
        
        # Cautam Dovada
        log("\n------------------------------------------------")
        log("🔎 CAUTARE VERSIUNE IN CODUL DE PE SERVER:")
        if "v143.0" in content:
            log("✅ GASIT: 'v143.0' este prezent in fisierul de pe server!")
        else:
            log("❌ EROARE: 'v143.0' NU a fost gasit in fisier!")

    sftp.close()
    transport.close()

    # Save to file safely
    with open('final_proof.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_log))

except Exception as e:
    err = f"❌ EROARE CONEXIUNE: {e}"
    print(err)
    with open('final_proof.txt', 'w', encoding='utf-8') as f:
        f.write(err)
