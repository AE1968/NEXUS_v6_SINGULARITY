import paramiko

HOST = 'fs-cygni.easywp.com'
USER = 'geneza-kelion-129030d'
PASS = 'vAMhj455TYdCtTUd1dM8'

print("💣 DETONATING SERVICE WORKER (KILL SWITCH)...")

try:
    transport = paramiko.Transport((HOST, 22))
    transport.connect(username=USER, password=PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    files = sftp.listdir('.')
    
    # 1. DELETE sw.js (Forces browser to unregister worker)
    if 'sw.js' in files:
        sftp.remove('sw.js')
        print("✅ sw.js DELETED. Browser worker should die on next refresh.")
    else:
        print("⚠️ sw.js already gone.")

    # 2. DELETE manifest.json (Just in case)
    if 'manifest.json' in files:
        sftp.remove('manifest.json')
        print("✅ manifest.json DELETED.")
    
    sftp.close()
    transport.close()
    print("\n💥 KILL SWITCH EXECUTED. Refreshing page should now fetch fresh content.")

except Exception as e:
    print(f"❌ ERROR: {e}")
