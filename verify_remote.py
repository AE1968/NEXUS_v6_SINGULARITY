import paramiko
import os

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def verify_deployment():
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print("🔍 READING index.php FROM SERVER...")
        with sftp.open('index.php', 'r') as f:
            # Read first 1000 bytes to check title/version
            remote_content = f.read(2000).decode('utf-8', errors='ignore')
            
        print("\n--- REMOTE FILE CONTENT START ---")
        # Print clearly
        lines = remote_content.split('\n')
        for i, line in enumerate(lines[:15]):
            print(f"REMOTE LINE {i}: {line.strip()}")
        
        if "<title>" in remote_content:
            start = remote_content.find("<title>")
            end = remote_content.find("</title>") + 8
            print(f"TITLE TAG: {remote_content[start:end]}")
        else:
            print("❌ No <title> tag found in first 2000 bytes.")
            
        if "v142.0" in remote_content:
             print("✅ VERSION v142.0 FOUND in remote file.")
        else:
             print("❌ VERSION v142.0 NOT FOUND in remote file.")
             
        if "PARTER" in remote_content:
             print("✅ 'PARTER' FOUND in remote file.")
        else:
             print("❌ 'PARTER' NOT FOUND in remote file.")

        print("--- REMOTE FILE CONTENT END ---\n")
        
        # SEARCH FOR OTHER INDEX FILES
        print("🔍 SCANNING FOR INTERFERING FILES...")
        files = sftp.listdir('.')
        bad_files = ['index.html', 'index.htm', 'default.html', 'default.php', 'home.html', 'home.php']
        found_bad = [f for f in files if f in bad_files]
        
        if found_bad:
            print(f"⚠️ FOUND INTERFERING FILES: {found_bad}")
            for bad in found_bad:
                print(f"   🔥 Deleting {bad}...")
                sftp.remove(bad)
        else:
            print("✅ No conflicting index files found.")

        sftp.close()
        transport.close()
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    verify_deployment()
