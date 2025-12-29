import paramiko
from datetime import datetime
import os

# CONFIG
HOST = 'fs-cygni.easywp.com'
USER = 'geneza-kelion-129030d'
PASS = 'vAMhj455TYdCtTUd1dM8'

print("🚀 INITIATING DEPLOY v143 + FIXED SW...")

try:
    transport = paramiko.Transport((HOST, 22))
    transport.connect(username=USER, password=PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    print("✅ Connected to SFTP")

    # 1. READ HTML SOURCE
    with open('KELION_V143_SOURCE.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 2. PREPARE PHP WRAPPER (CACHE BUSTING)
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    php_content = f'''<?php
// KELION v143 UNIVERSAL DEPLOY - {timestamp}
// Forced Network First Headers
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
?>
{html_content}'''

    # 3. UPLOAD index.php
    print("📤 Uploading index.php (v143)...")
    with sftp.open('index.php', 'w') as f:
        f.write(php_content)
    print("✅ index.php UPLOADED")

    # 4. UPLOAD sw.js (CRITICAL FIX)
    print("📤 Uploading sw.js (Network First Logic)...")
    sftp.put('sw.js', 'sw.js')
    print("✅ sw.js UPLOADED")

    # 5. CLEANUP OLD FILES (just in case)
    try:
        sftp.remove('index.html')
        print("🗑️ Removed blocking index.html")
    except:
        pass

    print("\n🎉 DEPLOY COMPLETE!")
    print(f"👉 Visit https://kelionai.app/?v=143&t={timestamp}")
    print("NOTE: Service Worker is now 'Network First'. Updates should be instant.")

    sftp.close()
    transport.close()

except Exception as e:
    print(f"❌ ERROR: {str(e)}")
