import paramiko
import os
from datetime import datetime
import time

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

VERSION = "v142.0"

def deploy():
    """Deploy current index.html to kelionai.app"""
    try:
        print(f"🚀 Starting Deployment of KELION {VERSION}...")
        
        # Read local index.html
        with open('index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Prepare PHP content (Cache busting)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        php_header = f'''<?php
// KELION {VERSION} - DEPLOYED {timestamp}
// AUTO-DEPLOY FROM LOCAL index.html
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
header("X-Kelion-Version: {VERSION}");
header("X-Deploy-Timestamp: {timestamp}");
?>
'''
        # Strip potential existing PHP tags if any (unlikely in index.html but safe)
        if html_content.strip().startswith('<?php'):
            first_php_end = html_content.find('?>')
            if first_php_end != -1:
                html_content = html_content[first_php_end + 2:].lstrip()
        
        final_php_content = php_header + html_content
        
        # Connect to SFTP
        print("🔌 Connecting to SFTP...")
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        print("✅ Connected!")
        
        # Upload as index.php
        print("📤 Uploading as index.php...")
        with sftp.open('index.php', 'w') as f:
            f.write(final_php_content)
        
        # Upload as index.html (Backup/Mirror)
        print("📤 Uploading as index.html...")
        with sftp.open('index.html', 'w') as f:
            f.write(html_content)
            
        # Update .htaccess
        print("📤 Updating .htaccess...")
        htaccess = f'''# KELION {VERSION} - {timestamp}
<IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
    Header set Expires "Thu, 01 Jan 1970 00:00:00 GMT"
    Header set X-Kelion-Version "{VERSION}"
</IfModule>
FileETag None
DirectoryIndex index.php
'''
        with sftp.open('.htaccess', 'w') as f:
            f.write(htaccess)
            
        sftp.close()
        transport.close()
        
        print("\n" + "="*40)
        print("🎉 DEPLOYMENT SUCCESSFUL!")
        print(f"🌍 URL: https://kelionai.app")
        print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*40)
        
    except Exception as e:
        print(f"❌ DEPLOYMENT FAILED: {e}")

if __name__ == "__main__":
    deploy()
