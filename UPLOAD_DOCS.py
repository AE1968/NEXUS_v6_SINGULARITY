import paramiko
import os

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def upload_docs():
    try:
        print("📤 Uploading Documentation to Server...")
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        local_file = 'DOCUMENTATIE_COMPLETA_v135.md'
        remote_file = 'DOCUMENTATIE_COMPLETA_v135.txt' # .txt for easy browser viewing
        
        sftp.put(local_file, remote_file)
        
        print(f"✅ Uploaded {local_file} as {remote_file}")
        
        sftp.close()
        transport.close()
        print("🔗 Link: https://kelionai.app/DOCUMENTATIE_COMPLETA_v135.txt")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    upload_docs()
