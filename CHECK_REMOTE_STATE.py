import paramiko
import os

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def check_remote_assets():
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print("📂 Checking remote 'assets' folder...")
        try:
            assets = sftp.listdir('assets')
            for a in assets:
                print(f"  - {a}")
                try:
                    # Check subfolders
                    if a in ['images', 'videos']:
                        sub = sftp.listdir(f'assets/{a}')
                        for s in sub:
                            print(f"    - {a}/{s}")
                except:
                    pass
        except Exception as e:
            print(f"⚠️ Could not list assets: {e}")
            
        print("\n📄 Checking index.html size...")
        try:
            stat = sftp.stat('index.html')
            print(f"  - index.html: {stat.st_size} bytes")
        except:
             print("  - index.html: MISSING")

        sftp.close()
        transport.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_remote_assets()
