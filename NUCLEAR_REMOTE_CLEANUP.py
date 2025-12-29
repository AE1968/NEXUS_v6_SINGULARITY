import paramiko
import os

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

KEEP_REMOTE = [
    'index.html',
    'v135.html',
    'app.py',
    'sw.js',
    'manifest.json',
    'assets',
    'wptbox' # System folder
]

def nuclear_remote_cleanup():
    try:
        print("☢️ STARTING NUCLEAR REMOTE CLEANUP...")
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        files = sftp.listdir('.')
        for f in files:
            if f not in KEEP_REMOTE:
                try:
                    # We only delete files, directories are risky unless we know they are old versions
                    # Usually old versions are .html or .py files
                    attr = sftp.stat(f)
                    import stat
                    if not stat.S_ISDIR(attr.st_mode):
                        sftp.remove(f)
                        print(f"🗑️ Deleted remote file: {f}")
                    else:
                        print(f"📁 Skipping directory: {f} (Manual check advised)")
                except Exception as e:
                    print(f"⚠️ Error deleting {f}: {e}")
                    
        sftp.close()
        transport.close()
        print("✅ REMOTE CLEANUP COMPLETE.")
    except Exception as e:
        print(f"❌ SFTP Error: {e}")

if __name__ == "__main__":
    nuclear_remote_cleanup()
