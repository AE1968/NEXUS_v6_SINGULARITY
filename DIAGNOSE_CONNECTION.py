import paramiko
import os
import requests
import time

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

APP_URL = "https://kelionai.app/verify_me.txt"

def verify_deployment_target():
    print(f"🕵️ DIAGNOSING DEPLOYMENT PATH...")
    
    try:
        # 1. Upload Verification File
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print("📤 Uploading 'verify_me.txt' to SFTP root...")
        sftp.put('verify_me.txt', 'verify_me.txt')
        sftp.close()
        transport.close()
        
        print("✅ Upload complete. Waiting 5s for propagation...")
        time.sleep(5)
        
        # 2. Check via HTTP
        print(f"🌍 Checking {APP_URL}...")
        try:
            r = requests.get(APP_URL, verify=False, timeout=10) # Verify=False to ignore cert issues if any
            if r.status_code == 200 and "verification file" in r.text:
                print("✅ CONFIRMED: We are on the correct server/directory!")
                print("   The issue is likely aggressive Browser/Cloudflare Caching.")
            else:
                print(f"❌ FAIL: File not found via HTTP. Status: {r.status_code}")
                print(f"   Content received: {r.text[:100]}")
                print("   CONCLUSION: We are uploading to a folder that is NOT served by kelionai.app, OR the domain points elsewhere.")
        except Exception as e:
            print(f"❌ HTTP Request Failed: {e}")
            
    except Exception as e:
        print(f"❌ SFTP Error: {e}")

if __name__ == "__main__":
    verify_deployment_target()
