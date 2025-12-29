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

log("🕵️ VERIFICARE .htaccess PE SERVER...")

try:
    transport = paramiko.Transport((HOST, 22))
    transport.connect(username=USER, password=PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    # Check if file exists
    try:
        sftp.stat('.htaccess')
        log("✅ .htaccess EXISTA pe server.")
        
        # Read content
        with sftp.open('.htaccess', 'r') as f:
            content = f.read().decode('utf-8')
            log("\n--- CONTINUT .htaccess ---")
            log(content)
            log("--------------------------")
            
            if "no-store" in content and "Expires" in content:
                log("✅ .htaccess contine regulile de cache dorite.")
            else:
                log("❌ .htaccess pare sa nu aiba regulile corecte!")
                
    except FileNotFoundError:
        log("❌ .htaccess NU a fost gasit pe server!")

    sftp.close()
    transport.close()

except Exception as e:
    log(f"❌ EROARE: {e}")
