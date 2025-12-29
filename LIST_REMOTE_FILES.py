import paramiko
import os

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def list_files():
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        files = sftp.listdir('.')
        print("Remote Files:")
        for f in files:
            print(f"- {f}")
            
        sftp.close()
        transport.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_files()
