import paramiko
import os
from datetime import datetime

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def deploy_v142_clean():
    """Deploy KELION v142.0 CLEAN to kelionai.app with aggressive cache-busting"""
    try:
        print("🔌 Connecting to EasyWP SFTP...")
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print("✅ Connected!")
        
        # Delete old index files first (cache-busting)
        print("🗑️ DELETING OLD FILES...")
        try:
            sftp.remove('index.php')
            print("   Deleted: index.php")
        except: pass
        try:
            sftp.remove('index.html')
            print("   Deleted: index.html")
        except: pass
        
        # Upload main file as index.php (WordPress uses PHP)
        print("🚀 UPLOADING KELION_V142_CLEAN.php as index.php...")
        sftp.put('KELION_V142_CLEAN.php', 'index.php')
        
        # Also upload as index.html backup
        print("🚀 UPLOADING KELION_V142_CLEAN.php as index.html...")
        sftp.put('KELION_V142_CLEAN.php', 'index.html')
        
        # Upload backup copy with timestamp
        backup_name = f'KELION_V142_CLEAN_{datetime.now().strftime("%Y%m%d_%H%M%S")}.php'
        print(f"🚀 UPLOADING backup: {backup_name}...")
        sftp.put('KELION_V142_CLEAN.php', backup_name)
        
        # Upload PHP proxy if exists
        if os.path.exists('KELION_CORE_V142.php'):
            print("🚀 UPLOADING KELION_CORE_V142.php...")
            sftp.put('KELION_CORE_V142.php', 'KELION_CORE_V142.php')
        
        # Create cache-buster .htaccess
        htaccess_content = '''# KELION v142.0 CACHE BUSTER
<IfModule mod_headers.c>
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</IfModule>

# Force PHP for index
DirectoryIndex index.php index.html

# Disable ETag
FileETag None
'''
        # Write htaccess locally first
        with open('.htaccess', 'w') as f:
            f.write(htaccess_content)
        
        print("🚀 UPLOADING .htaccess (cache-buster)...")
        sftp.put('.htaccess', '.htaccess')
        
        print("\n" + "="*60)
        print("✅ DEPLOY COMPLETE - v142.0 CLEAN")
        print("="*60)
        print(f"🌐 Site: https://kelionai.app")
        print(f"📦 Version: v142.0 CLEAN (AUDITED)")
        print(f"⏰ Deployed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"💾 Backup: {backup_name}")
        print("="*60)
        print("\n⚠️ IMPORTANT: Clear browser cache or use:")
        print("   https://kelionai.app/?v=142clean&t=" + str(int(datetime.now().timestamp())))
        
        sftp.close()
        transport.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    deploy_v142_clean()
