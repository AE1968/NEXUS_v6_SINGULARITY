import paramiko
from datetime import datetime
import time

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def nuclear_deploy():
    """Nuclear option: Delete everything related to index and recreate"""
    transport = paramiko.Transport((SFTP_HOST, 22))
    transport.connect(username=SFTP_USER, password=SFTP_PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    print("🔴 NUCLEAR DEPLOY - Deleting all cached versions...")
    
    # Delete ALL index files and old versions
    files_to_delete = [
        'index.php', 'index.html', 'index.htm',
        'KELION_V135.php', 'kelion_v135.php'
    ]
    
    for f in files_to_delete:
        try:
            sftp.remove(f)
            print(f"   ❌ Deleted: {f}")
        except:
            pass
    
    # Also delete any backup files that might be cached
    for f in sftp.listdir('.'):
        if 'v135' in f.lower() or 'V135' in f:
            try:
                sftp.remove(f)
                print(f"   ❌ Deleted old version: {f}")
            except:
                pass
    
    print("\n⏳ Waiting 2 seconds for cache to clear...")
    time.sleep(2)
    
    # Read local KELION_V142_CLEAN.php
    with open('KELION_V142_CLEAN.php', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create simple PHP with version marker
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    php_content = f'''<?php
// KELION v142.0 NUCLEAR DEPLOY - {timestamp}
// EasyWP Cache Bypass
header("Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
header("X-Version: v142-{timestamp}");
?>
{content}'''
    
    # Upload as index.php
    print("🚀 Uploading fresh index.php...")
    with sftp.open('index.php', 'w') as f:
        f.write(php_content)
    
    # Verify upload
    stat = sftp.stat('index.php')
    print(f"   ✅ index.php uploaded: {stat.st_size} bytes")
    
    # Create a cache-bust .htaccess
    htaccess = '''# KELION v142 CACHE BUSTER
<IfModule mod_expires.c>
    ExpiresActive Off
</IfModule>

<IfModule mod_headers.c>
    Header set Cache-Control "no-cache, no-store, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
    Header set Expires "Thu, 01 Jan 1970 00:00:00 GMT"
    Header set X-Content-Type-Options "nosniff"
    Header unset ETag
</IfModule>

FileETag None

# Force .php first
DirectoryIndex index.php
'''
    
    print("🚀 Uploading .htaccess...")
    with sftp.open('.htaccess', 'w') as f:
        f.write(htaccess)
    
    print("\n" + "="*60)
    print("✅ NUCLEAR DEPLOY COMPLETE")
    print("="*60)
    print(f"   Timestamp: {timestamp}")
    print(f"   Version: v142.0")
    print("\n⚠️ IMPORTANT: The CDN may still serve cached version.")
    print("   Try: https://kelionai.app/?bust=" + timestamp)
    print("   Or wait 5-10 minutes for CDN cache to expire")
    
    sftp.close()
    transport.close()

if __name__ == "__main__":
    nuclear_deploy()
