import paramiko
import os
import time

HOST = "fs-cygni.easywp.com"
PORT = 22
USER = "geneza-kelion-129030d"
PASS = "tgooFLACUinVMaPbLIIL"

LOCAL_FILE = "index.html"
REMOTE_FILE = "index.html"

def deploy():
    print(f"Connecting to {HOST}...")
    try:
        # Use SSHClient which is higher level and easier to configure for password auth
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Connect forcing password auth (disable keys/agent)
        ssh.connect(HOST, port=PORT, username=USER, password=PASS, look_for_keys=False, allow_agent=False)
        
        sftp = ssh.open_sftp()
        print(f"Connected! Uploading {LOCAL_FILE} to {REMOTE_FILE}...")
        
        # Callback for progress
        def progress(transferred, total):
            percent = (transferred / total) * 100
            print(f"Progress: {percent:.1f}%", end="\r")

        sftp.put(LOCAL_FILE, REMOTE_FILE, callback=progress)
        print(f"\nUpload complete!")
        
        # Verify
        try:
            remote_stat = sftp.stat(REMOTE_FILE)
            print(f"Remote file size: {remote_stat.st_size} bytes")
        except:
            print("Could not stat remote file.")

        sftp.close()
        ssh.close()
        print("Deployment Successful!")
        
    except Exception as e:
        print(f"Deployment Failed: {e}")

if __name__ == "__main__":
    deploy()
