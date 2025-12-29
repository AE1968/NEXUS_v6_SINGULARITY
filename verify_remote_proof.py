import paramiko

HOST = 'fs-cygni.easywp.com'
USER = 'geneza-kelion-129030d'
PASS = 'vAMhj455TYdCtTUd1dM8'

print("🕵️ EXTRAGERE DOVADA DIRECT DE PE SERVER (SFTP)...")

try:
    transport = paramiko.Transport((HOST, 22))
    transport.connect(username=USER, password=PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    # 1. LISTARE FISIERE
    files = sftp.listdir('.')
    print(f"\n📂 FISIERE PE SERVER:\n{files}")
    
    if 'index.html' in files:
        print("❌ ATENTIE: index.html inca exista! (Asta e problema)")
    else:
        print("✅ CONFIRMAT: index.html NU exista.")

    # 2. CITIRE CONTINUT index.php
    print("\n------------------------------------------------")
    print("PAGE SOURCE (index.php) - Primele 500 caractere:")
    with sftp.open('index.php', 'r') as f:
        content = f.read().decode('utf-8')
        print(content[:500])
        
        # Cautam Dovada
        print("\n------------------------------------------------")
        print("🔎 CAUTARE VERSIUNE IN CODUL DE PE SERVER:")
        if "v143.0" in content:
            print("✅ GASIT: 'v143.0' este prezent in fisierul de pe server!")
        else:
            print("❌ EROARE: 'v143.0' NU a fost gasit in fisier!")

    sftp.close()
    transport.close()

except Exception as e:
    print(f"❌ EROARE CONEXIUNE: {e}")
