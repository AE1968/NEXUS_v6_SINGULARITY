import paramiko
from datetime import datetime

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'WUzxy7ZBROvOPW6zlqNr'

def deploy_language_detection():
    """Deploy updated index.html with language detection logic"""
    print("🌍 DEPLOYING LANGUAGE DETECTION UPDATE...")
    print("=" * 60)
    
    transport = paramiko.Transport((SFTP_HOST, 22))
    transport.connect(username=SFTP_USER, password=SFTP_PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Read updated index.html
    print("📖 Reading updated index.html...")
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create PHP wrapper with cache bypass
    php_content = f'''<?php
// KELION v142.0 - LANGUAGE DETECTION UPDATE - {timestamp}
// Auto-detect language from first user message
header("Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
header("X-Version: v142-lang-{timestamp}");
?>
{content}'''
    
    # Delete old index files
    print("🗑️ Cleaning old index files...")
    for f in ['index.php', 'index.html', 'index.htm']:
        try:
            sftp.remove(f)
            print(f"   ❌ Deleted: {f}")
        except:
            pass
    
    # Upload as index.php
    print("🚀 Uploading new index.php with language detection...")
    with sftp.open('index.php', 'w') as f:
        f.write(php_content)
    
    # Verify
    stat = sftp.stat('index.php')
    print(f"   ✅ Uploaded: {stat.st_size} bytes")
    
    print("\n" + "=" * 60)
    print("✅ LANGUAGE DETECTION DEPLOY COMPLETE!")
    print("=" * 60)
    print(f"\n🌐 Test: https://kelionai.app/?v={timestamp}")
    print("\n📋 NOUA LOGICĂ:")
    print("   1. Login -> Afișează mesaj bilingv de așteptare")
    print("   2. User scrie/vorbește -> Detectează limba")  
    print("   3. Robot răspunde în limba detectată")
    print("   4. Log off -> Resetează tot")
    
    sftp.close()
    transport.close()

if __name__ == "__main__":
    deploy_language_detection()
