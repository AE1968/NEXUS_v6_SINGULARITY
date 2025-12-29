import paramiko
import time

HOST = 'fs-cygni.easywp.com'
USER = 'geneza-kelion-129030d'
PASS = 'vAMhj455TYdCtTUd1dM8'

print("🔍 INSPECTING REMOTE SERVER...")

try:
    transport = paramiko.Transport((HOST, 22))
    transport.connect(username=USER, password=PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    files = sftp.listdir('.')
    print("\n📂 REMOTE FILES:")
    for f in files:
        if 'index' in f or 'sw.js' in f:
            attr = sftp.stat(f)
            size = attr.st_size
            mtime = time.ctime(attr.st_mtime)
            print(f" - {f:<20} | {size:>10} bytes | {mtime}")

    # Check specifically for the conflict
    if 'index.html' in files and 'index.php' in files:
        print("\n⚠️ CONFLICT DETECTED: Both index.html and index.php exist!")
        print("Server likely serves index.html (old) instead of index.php (new).")
        
        # Aggressive delete
        print("🧨 DELETING index.html...")
        sftp.remove('index.html')
        print("✅ index.html DELETED.")
    else:
        print("\n✅ No index.html/index.php conflict.")

    sftp.close()
    transport.close()

except Exception as e:
    print(f"❌ ERROR: {e}")
