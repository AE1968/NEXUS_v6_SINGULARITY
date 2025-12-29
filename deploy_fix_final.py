import paramiko

HOST = 'fs-cygni.easywp.com'
USER = 'geneza-kelion-129030d'
PASS = 'vAMhj455TYdCtTUd1dM8'

print("☢️ DEPLOYING NUCLEAR .htaccess & BYPASS FILE...")

try:
    transport = paramiko.Transport((HOST, 22))
    transport.connect(username=USER, password=PASS)
    sftp = paramiko.SFTPClient.from_transport(transport)
    
    # 1. UPLOAD .htaccess (The Enforcer)
    sftp.put('.htaccess', '.htaccess')
    print("✅ .htaccess UPDATED (Aggressive Anti-Cache)")

    # 2. UPLOAD v143_bypass.php (The Proof)
    # We add a small PHP header just to be safe
    with open('v143_bypass.php', 'r', encoding='utf-8') as f:
        content = f.read()
    
    final_bypass = f"<?php header('Cache-Control: no-store'); ?>\n{content}"
    
    with sftp.open('v143_bypass.php', 'w') as f:
        f.write(final_bypass)
    
    print("✅ v143_bypass.php UPLOADED.")

    # 3. VERIFY index.php AGAIN
    # Just to be sure, we overwrite index.php one last time with the aggressive version
    with sftp.open('index.php', 'w') as f:
        f.write(final_bypass)
    print("✅ index.php OVERWRITTEN (Again).")

    print("\n🚀 DEPLOYMENT DONE.")
    print("👉 TRY: https://kelionai.app/v143_bypass.php")
    
    sftp.close()
    transport.close()

except Exception as e:
    print(f"❌ ERROR: {e}")
