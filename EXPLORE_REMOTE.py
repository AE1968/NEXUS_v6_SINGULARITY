import paramiko
import os

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def explore_remote():
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print(f"📂 Connected to {SFTP_HOST}. Current Working Directory: {sftp.getcwd()}")
        
        # List root files
        try:
            root_files = sftp.listdir('.')
            print(f"📂 Files in '.': {root_files}")
        except Exception as e:
            print(f"Error listing root: {e}")

        # Check for common web folders
        potential_roots = ['public_html', 'www', 'htdocs', 'web']
        for folder in potential_roots:
            if folder in root_files:
                print(f"found POTENTIAL WEB ROOT: {folder}")
                try:
                    subfiles = sftp.listdir(folder)
                    print(f"   📂 Content of {folder}: {subfiles[:10]}...") # Limit output
                except:
                    pass
        
        sftp.close()
        transport.close()
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    explore_remote()
