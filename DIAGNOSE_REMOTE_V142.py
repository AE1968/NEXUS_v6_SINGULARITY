import paramiko

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

def diagnose_remote():
    results = []
    try:
        transport = paramiko.Transport((SFTP_HOST, 22))
        transport.connect(username=SFTP_USER, password=SFTP_PASS)
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        results.append("=" * 60)
        results.append("[DIAGNOSTIC] REMOTE SERVER - kelionai.app")
        results.append("=" * 60)
        
        # 1. List all files with sizes
        results.append("\n[FILES] ALL FILES IN ROOT:")
        files = sftp.listdir_attr('.')
        for f in sorted(files, key=lambda x: x.filename):
            ftype = "[DIR]" if f.longname.startswith('d') else "[FILE]"
            results.append(f"  {ftype} {f.filename}: {f.st_size} bytes")
        
        # 2. Check for index files
        results.append("\n[CHECK] INDEX FILES:")
        index_files = ['index.php', 'index.html', 'index.htm']
        for idx in index_files:
            try:
                stat = sftp.stat(idx)
                results.append(f"  [OK] {idx}: EXISTS ({stat.st_size} bytes)")
                with sftp.open(idx, 'r') as f:
                    content = f.read(800).decode('utf-8', errors='ignore')
                    if 'v142' in content:
                        results.append(f"       -> Contains v142")
                    elif 'v135' in content:
                        results.append(f"       -> Contains v135")
                    elif 'v140' in content:
                        results.append(f"       -> Contains v140")
                    if '<title>' in content:
                        start = content.find('<title>') + 7
                        end = content.find('</title>')
                        if end > start:
                            results.append(f"       -> Title: {content[start:end]}")
            except FileNotFoundError:
                results.append(f"  [MISSING] {idx}: NOT FOUND")
        
        # 3. Check .htaccess DirectoryIndex
        results.append("\n[HTACCESS] CONTENT:")
        try:
            with sftp.open('.htaccess', 'r') as f:
                htaccess = f.read().decode('utf-8', errors='ignore')
                for line in htaccess.strip().split('\n'):
                    results.append(f"  {line}")
        except Exception as e:
            results.append(f"  [ERROR] {e}")
        
        # 4. Check kelion_root.php
        results.append("\n[ROOT PHP] kelion_root.php:")
        try:
            with sftp.open('kelion_root.php', 'r') as f:
                content = f.read(800).decode('utf-8', errors='ignore')
                for line in content.split('\n')[:20]:
                    results.append(f"  {line}")
        except Exception as e:
            results.append(f"  [ERROR] {e}")
            
        sftp.close()
        transport.close()
        
        results.append("\n" + "=" * 60)
        results.append("[DONE] DIAGNOSTIC COMPLETE")
        
    except Exception as e:
        results.append(f"[FATAL ERROR] {e}")
    
    # Write to file
    with open('diagnose_result.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(results))
    
    print("Results saved to diagnose_result.txt")

if __name__ == "__main__":
    diagnose_remote()
