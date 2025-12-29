import paramiko
import os

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def final_fix_deploy():
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        print("🚀 UPLOADING kelion_engine.php (Fixed Role Logic)...")
        sftp.put('kelion_engine.php', 'kelion_engine.php')

        print("🚀 UPLOADING kelion_master.php (New Frontend Entry Point)...")
        # index.html was copied to kelion_master.php locally
        sftp.put('kelion_master.php', 'kelion_master.php')
        
        print("🚀 UPLOADING kelion_fix_final.php (Emergency Fix Link)...")
        sftp.put('kelion_fix_final.php', 'kelion_fix_final.php')

        print("🚀 UPLOADING KELION_NO_CACHE_V140.php (Ultimate Fresh Version)...")
        sftp.put('KELION_NO_CACHE_V140.php', 'KELION_NO_CACHE_V140.php')

        print("🚀 UPLOADING KELION_CORE_V142.php (Robust Backend)...")
        sftp.put('KELION_CORE_V142.php', 'KELION_CORE_V142.php')

        print("🚀 UPLOADING KELION_SERVER_V142.php (Server-Only Frontend)...")
        sftp.put('KELION_SERVER_V142.php', 'KELION_SERVER_V142.php')
        
        # FORCE OVERWRITE BOTH HTML AND PHP TO ENSURE UPDATE
        print("🚀 UPLOADING index.php (V142 PARTER)...")
        sftp.put('index.php', 'index.php')

        print("� UPLOADING index.html (V142 PARTER - Mirror)...")
        sftp.put('index.html', 'index.html')
        
        print("🚀 UPLOADING KELION_PARTER.php (Saved Version)...")
        sftp.put('KELION_PARTER.php', 'KELION_PARTER.php')
        sftp.put('KELION_ENGINE_PARTER.php', 'KELION_ENGINE_PARTER.php')
        
        print("✅ DEPLOY COMPLETE. BOTH INDEX.HTML AND INDEX.PHP UPDATED.")
        sftp.close()
        transport.close()
        
        print("🚀 UPLOADING KELION_PARTER.php (Saved Version)...")
        sftp.put('KELION_PARTER.php', 'KELION_PARTER.php')
        sftp.put('KELION_ENGINE_PARTER.php', 'KELION_ENGINE_PARTER.php')
        
        print("✅ DEPLOY COMPLETE.")
        sftp.close()
        transport.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    final_fix_deploy()
