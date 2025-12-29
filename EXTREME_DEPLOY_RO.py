import paramiko
import os
SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def extreme_deploy():
    try:
        print("🚀 Starting AGGRESSIVE Deployment of KELION v135.0 (Translated)...")
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)

        # 1. DELETE ALL INDEX TYPES (AGGRESSIVE CLEANUP)
        print("🗑️ Deleting old files...")
        files_to_nuke = ['index.html', 'index.php', 'index.htm', 'v135.html', 'V_134_FINAL.html', 'default.html']
        for f in files_to_nuke:
            try:
                sftp.remove(f)
                print(f"   - Deleted {f}")
            except:
                pass
        
        # 2. UPLOAD FRESH index.html
        print("📤 Uploading fresh index.html (Source of Truth)...")
        sftp.put('index.html', 'index.html')
        
        # 3. OVERWRITE index.php with a version that SERVES html with NO-CACHE HEADERS
        print("📤 Creating index.php with Anti-Cache Headers...")
        php_content = """<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
readfile("index.html");
?>"""
        with open('index_redirect.php', 'w') as f:
            f.write(php_content)
            
        sftp.put('index_redirect.php', 'index.php')
        os.remove('index_redirect.php') # Clean up local temp
        
        # 4. UPLOAD APP.PY (Just in case, though backend is usually separate)


        # 4. UPLOAD APP.PY
        # 4. UPLOAD APP.PY
        print("📤 Uploading updated app.py...")
        sftp.put('app.py', 'app.py')
        
        # 4.5 UPLOAD NATIVE PHP ENGINE
        print("📤 Uploading kelion_engine.php (THE BRAIN)...")
        sftp.put('kelion_engine.php', 'kelion_engine.php')

        # 5. UPLOAD PWA FILES
        print("📤 Uploading PWA files (sw.js, manifest.json)...")
        if os.path.exists('sw.js'):
            sftp.put('sw.js', 'sw.js')
        if os.path.exists('manifest.json'):
            sftp.put('manifest.json', 'manifest.json')

        sftp.close()
        transport.close()
        print("✅ DEPLOYMENT SUCCESSFUL! KELION v135.0 is now live and Romanian-translated.")
        print("🔗 https://kelionai.app/")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    extreme_deploy()
