import paramiko
import sys

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def list_and_nuke():
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print("\n📂 --- REMOTE FILE LISTING (ROOT) ---")
        files = sftp.listdir('.')
        for f in files:
            attr = sftp.stat(f)
            print(f"[{'DIR' if str(attr).startswith('d') else 'FILE'}] {f} ({attr.st_size} bytes)")
            
        # FORCE DELETE INDEX.HTML TO PROVE CONTROL
        print("\n🔥 ATTEMPTING TO DELETE index.html...")
        try:
            sftp.remove('index.html')
            print("✅ index.html DELETED! (Site should be 404 now if this is the right server)")
        except Exception as e:
            print(f"❌ Failed to delete index.html: {e}")

        sftp.close()
        transport.close()
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    list_and_nuke()
