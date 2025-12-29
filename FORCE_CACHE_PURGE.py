"""
FORCE CACHE PURGE - Invalidate CDN cache for kelionai.app
This script uploads a modified .htaccess that forces cache invalidation
"""

import paramiko
from datetime import datetime
import time

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

CURRENT_VERSION = "v142.0"

def force_cache_purge():
    """Force CDN cache invalidation"""
    
    print("=" * 60)
    print("[CACHE PURGE] Forcing CDN invalidation")
    print(f"[TIME] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        cache_buster = int(time.time())
        
        # Create aggressive cache-busting .htaccess
        htaccess = f'''# KELION {CURRENT_VERSION} - CACHE PURGE {timestamp}
# CACHE BUSTER: {cache_buster}

# Force no caching at all
<IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    Header set Pragma "no-cache"
    Header set Expires "0"
    Header unset ETag
    Header unset Last-Modified
    Header set X-Kelion-Version "{CURRENT_VERSION}"
    Header set X-Cache-Buster "{cache_buster}"
    Header set Vary "*"
</IfModule>

# Disable ETags completely
FileETag None

# Default index
DirectoryIndex index.php

# Rewrite for cache busting
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Force refresh by appending timestamp if no query string
    RewriteCond %{{QUERY_STRING}} ^$
    RewriteCond %{{REQUEST_URI}} ^/$
    RewriteRule ^$ index.php?_ts={cache_buster} [L,R=302]
</IfModule>

<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
'''
        
        print("\n[STEP 1] Uploading aggressive .htaccess...")
        with sftp.open('.htaccess', 'w') as f:
            f.write(htaccess)
        print("  [OK] .htaccess updated with cache-buster")
        
        # Also touch index.php to update modification time
        print("\n[STEP 2] Touching index.php...")
        try:
            with sftp.open('index.php', 'r') as f:
                content = f.read().decode('utf-8')
            
            # Add a new timestamp comment at the top
            if '// CACHE_PURGE_TIMESTAMP:' in content:
                # Replace existing timestamp
                import re
                content = re.sub(r'// CACHE_PURGE_TIMESTAMP: \d+', f'// CACHE_PURGE_TIMESTAMP: {cache_buster}', content)
            else:
                # Add after first <?php line
                content = content.replace('<?php', f'<?php\n// CACHE_PURGE_TIMESTAMP: {cache_buster}', 1)
            
            with sftp.open('index.php', 'w') as f:
                f.write(content)
            print(f"  [OK] index.php touched with timestamp {cache_buster}")
        except Exception as e:
            print(f"  [SKIP] Could not touch index.php: {e}")
        
        sftp.close()
        transport.close()
        
        print("\n" + "=" * 60)
        print("[DONE] Cache purge completed")
        print("=" * 60)
        print(f"\nNow access: https://kelionai.app/?_ts={cache_buster}")
        print("Or wait 30 seconds and try: https://kelionai.app")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        return False

if __name__ == "__main__":
    force_cache_purge()
