import paramiko
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
paramiko_logger = logging.getLogger("paramiko")
paramiko_logger.setLevel(logging.DEBUG)

HOST = "fs-cygni.easywp.com"
PORT = 22
USER = "geneza-kelion-129030d"
PASS = "8pjKAr0nbDJfzlpa6TUI"

LOCAL_FILE = "index.html"
REMOTE_FILE = "index.html"

def deploy():
    print(f"Attempting connection to {HOST}...")
    try:
        transport = paramiko.Transport((HOST, PORT))
        transport.connect(username=USER, password=PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print(f"✅ Connected! Uploading {LOCAL_FILE}...")
        sftp.put(LOCAL_FILE, REMOTE_FILE)
        
        print(f"✅ Upload COMPLETE!")
        print(f"Files in root:")
        print(sftp.listdir('.'))
        
        sftp.close()
        transport.close()
        print("🚀 DEPLOYMENT SUCCESSFUL!")
        
    except Exception as e:
        print(f"❌ Deployment Failed: {e}")

if __name__ == "__main__":
    deploy()
