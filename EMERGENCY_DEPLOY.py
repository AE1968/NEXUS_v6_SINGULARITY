import paramiko
import os

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def emergency_deploy():
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print("🚀 UPLOADING NEW FILE TO BYPASS CACHE: kelion_v135.html")
        sftp.put('index.html', 'kelion_v135.html')
        
        print("✅ Success! The new file is 'kelion_v135.html'")
        sftp.close()
        transport.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    emergency_deploy()
