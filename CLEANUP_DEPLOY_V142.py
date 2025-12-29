import paramiko
from datetime import datetime
import time

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

# VERSIUNE OFICIALA
CURRENT_VERSION = "v142.0"

def cleanup_and_deploy():
    """Cleanup v143, old backups, and deploy v142.0 as index.php"""
    results = []
    
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        results.append("=" * 60)
        results.append(f"[DEPLOY] KELION {CURRENT_VERSION} - CLEANUP & DEPLOY")
        results.append(f"[TIME] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        results.append("=" * 60)
        
        # 1. DELETE v143 FILES
        results.append("\n[STEP 1] Deleting v143 files...")
        v143_files = ['v143_bypass.php']
        for f in v143_files:
            try:
                sftp.remove(f)
                results.append(f"  [DELETED] {f}")
            except FileNotFoundError:
                results.append(f"  [SKIP] {f} - not found")
            except Exception as e:
                results.append(f"  [ERROR] {f} - {e}")
        
        # 2. DELETE OLD BACKUP FILES
        results.append("\n[STEP 2] Cleaning old backups...")
        all_files = sftp.listdir('.')
        backup_pattern = 'KELION_V142_CLEAN_'
        deleted_count = 0
        for f in all_files:
            if f.startswith(backup_pattern) and f.endswith('.php'):
                try:
                    sftp.remove(f)
                    results.append(f"  [DELETED] {f}")
                    deleted_count += 1
                except Exception as e:
                    results.append(f"  [ERROR] {f} - {e}")
        results.append(f"  Total backups deleted: {deleted_count}")
        
        # 3. DELETE CURRENT INDEX.PHP (v143)
        results.append("\n[STEP 3] Removing old index.php...")
        try:
            sftp.remove('index.php')
            results.append("  [DELETED] index.php (was v143)")
        except FileNotFoundError:
            results.append("  [SKIP] index.php not found")
        except Exception as e:
            results.append(f"  [ERROR] {e}")
        
        time.sleep(1)
        
        # 4. READ AND UPLOAD KELION_PARTER.php AS index.php
        results.append("\n[STEP 4] Deploying KELION_PARTER.php as index.php...")
        with open('KELION_PARTER.php', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Verify version in content
        if 'v142.0' in content:
            results.append(f"  [OK] Version {CURRENT_VERSION} confirmed in source file")
        else:
            results.append(f"  [WARNING] Version {CURRENT_VERSION} NOT found in source!")
        
        # Add deploy header
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        php_header = f'''<?php
// KELION {CURRENT_VERSION} - DEPLOYED {timestamp}
// AUTO-DEPLOY SYSTEM - DO NOT EDIT MANUALLY
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
header("X-Kelion-Version: {CURRENT_VERSION}");
header("X-Deploy-Time: {timestamp}");
?>
'''
        # Remove the first <?php from content if it exists
        if content.strip().startswith('<?php'):
            # Find the closing ?> of the first PHP block
            first_php_end = content.find('?>')
            if first_php_end != -1:
                content = content[first_php_end + 2:].lstrip()
        
        final_content = php_header + content
        
        # Upload
        with sftp.open('index.php', 'w') as f:
            f.write(final_content)
        
        # Verify upload
        stat = sftp.stat('index.php')
        results.append(f"  [UPLOADED] index.php - {stat.st_size} bytes")
        
        # 5. UPDATE .htaccess
        results.append("\n[STEP 5] Updating .htaccess...")
        htaccess_content = f'''# KELION {CURRENT_VERSION} - DEPLOYED {timestamp}
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
            f.write(htaccess_content)
        results.append("  [UPDATED] .htaccess")
        
        # 6. VERIFY DEPLOYMENT
        results.append("\n[STEP 6] Verification...")
        with sftp.open('index.php', 'r') as f:
            first_500 = f.read(500).decode('utf-8', errors='ignore')
        
        if CURRENT_VERSION in first_500:
            results.append(f"  [SUCCESS] index.php contains {CURRENT_VERSION}")
        else:
            results.append(f"  [FAIL] {CURRENT_VERSION} NOT FOUND in deployed file!")
        
        sftp.close()
        transport.close()
        
        results.append("\n" + "=" * 60)
        results.append(f"[COMPLETE] KELION {CURRENT_VERSION} DEPLOYED SUCCESSFULLY")
        results.append("=" * 60)
        results.append(f"\nURL: https://kelionai.app")
        results.append("NOTE: Clear browser cache or use incognito to verify")
        
    except Exception as e:
        results.append(f"\n[FATAL ERROR] {e}")
    
    # Save and print results
    output = '\n'.join(results)
    with open('deploy_result.txt', 'w', encoding='utf-8') as f:
        f.write(output)
    
    print(output)

if __name__ == "__main__":
    cleanup_and_deploy()
