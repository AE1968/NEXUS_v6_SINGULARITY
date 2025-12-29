import paramiko
from datetime import datetime
import time
import re

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

# ============================================
# VERSIUNE OFICIALA - ACTUALIZATI AICI
# ============================================
CURRENT_VERSION = "v142.0"
SOURCE_FILE = "KELION_PARTER.php"
# ============================================

def verify_version_in_file(filepath, expected_version):
    """Verify that the source file contains the expected version"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check title tag
    title_match = re.search(r'<title>.*?' + re.escape(expected_version) + r'.*?</title>', content, re.IGNORECASE)
    
    # Check version tag update
    version_tag_match = re.search(r'vTag\.textContent\s*=\s*["\']' + re.escape(expected_version) + r'["\']', content)
    
    return {
        'title_ok': title_match is not None,
        'version_tag_ok': version_tag_match is not None,
        'overall_ok': expected_version in content
    }

def deploy_parter():
    """Deploy KELION with version verification"""
    
    print("=" * 60)
    print(f"[DEPLOY] KELION {CURRENT_VERSION}")
    print(f"[TIME] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"[SOURCE] {SOURCE_FILE}")
    print("=" * 60)
    
    # STEP 0: Verify local source file version
    print("\n[STEP 0] Verifying source file version...")
    version_check = verify_version_in_file(SOURCE_FILE, CURRENT_VERSION)
    
    if not version_check['overall_ok']:
        print(f"  [ABORT] {CURRENT_VERSION} NOT FOUND in {SOURCE_FILE}!")
        print(f"  Please update {SOURCE_FILE} to include {CURRENT_VERSION}")
        return False
    
    print(f"  [OK] Version {CURRENT_VERSION} found in source")
    print(f"       Title tag: {'OK' if version_check['title_ok'] else 'MISSING'}")
    print(f"       Version tag update: {'OK' if version_check['version_tag_ok'] else 'MISSING'}")
    
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        # STEP 1: Delete old index files
        print("\n[STEP 1] Cleaning old index files...")
        for f in ['index.php', 'index.html', 'index.htm']:
            try:
                sftp.remove(f)
                print(f"  [DELETED] {f}")
            except FileNotFoundError:
                pass
        
        time.sleep(1)
        
        # STEP 2: Read and prepare content
        print(f"\n[STEP 2] Reading {SOURCE_FILE}...")
        with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add deploy header
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        php_header = f'''<?php
// KELION {CURRENT_VERSION} - DEPLOYED {timestamp}
// SOURCE: {SOURCE_FILE}
// AUTO-DEPLOY SYSTEM
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
header("X-Kelion-Version: {CURRENT_VERSION}");
header("X-Deploy-Time: {timestamp}");
?>
'''
        # Remove the first <?php block from content
        if content.strip().startswith('<?php'):
            first_php_end = content.find('?>')
            if first_php_end != -1:
                content = content[first_php_end + 2:].lstrip()
        
        final_content = php_header + content
        
        # STEP 3: Upload
        print("\n[STEP 3] Uploading as index.php...")
        with sftp.open('index.php', 'w') as f:
            f.write(final_content)
        
        stat = sftp.stat('index.php')
        print(f"  [UPLOADED] index.php - {stat.st_size} bytes")
        
        # STEP 4: Update .htaccess
        print("\n[STEP 4] Updating .htaccess...")
        htaccess = f'''# KELION {CURRENT_VERSION} - DEPLOYED {timestamp}
<IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
    Header set Pragma "no-cache"
    Header set Expires "Thu, 01 Jan 1970 00:00:00 GMT"
    Header unset ETag
    Header set X-Kelion-Version "{CURRENT_VERSION}"
</IfModule>

FileETag None
DirectoryIndex index.php

<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
'''
        with sftp.open('.htaccess', 'w') as f:
            f.write(htaccess)
        print("  [UPDATED] .htaccess")
        
        # STEP 5: Verify
        print("\n[STEP 5] Verification...")
        with sftp.open('index.php', 'r') as f:
            deployed_content = f.read(1000).decode('utf-8', errors='ignore')
        
        if CURRENT_VERSION in deployed_content:
            print(f"  [SUCCESS] {CURRENT_VERSION} verified on server")
        else:
            print(f"  [WARNING] Version not found in deployed file header")
        
        sftp.close()
        transport.close()
        
        print("\n" + "=" * 60)
        print(f"[COMPLETE] KELION {CURRENT_VERSION} DEPLOYED")
        print("=" * 60)
        print(f"\nURL: https://kelionai.app")
        print(f"Timestamp: {timestamp}")
        print("\nTIP: Use incognito mode or hard refresh (Ctrl+Shift+R) to verify")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        return False

if __name__ == "__main__":
    deploy_parter()
