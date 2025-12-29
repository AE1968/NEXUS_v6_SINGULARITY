import paramiko
import time

HOST = 'fs-cygni.easywp.com'
USER = 'geneza-kelion-129030d'
PASS = 'vAMhj455TYdCtTUd1dM8'

print("☢️ NUKING index.html...")

try:
    transport = paramiko.Transport((HOST, 22))
    transport.connect(username=USER, password=PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    files = sftp.listdir('.')
    
    targets = ['index.html', 'index.htm', 'default.html']
    
    for t in targets:
        if t in files:
            print(f"Found {t}. Deleting...")
            try:
                sftp.remove(t)
                print(f"✅ Deleted {t}")
            except Exception as e:
                print(f"❌ Failed to delete {t}: {e}")
                print(f"⚠️ Attempting rename as fallback...")
                try:
                    sftp.rename(t, f"{t}.trash.{int(time.time())}")
                    print(f"✅ Renamed {t} to .trash")
                except Exception as ren_e:
                    print(f"❌ Rename also failed: {ren_e}")

    # Verify
    final_files = sftp.listdir('.')
    if 'index.html' not in final_files:
        print("\n✨ VERIFIED: index.html is GONE.")
    else:
        print("\n💀 CRITICAL: index.html STILL EXISTS.")

    sftp.close()
    transport.close()

except Exception as e:
    print(f"❌ ERROR: {e}")
