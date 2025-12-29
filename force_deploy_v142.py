import paramiko
from datetime import datetime

transport = paramiko.Transport(('fs-cygni.easywp.com', 22))
transport.connect(username='geneza-kelion-129030d', password='vAMhj455TYdCtTUd1dM8')
sftp = paramiko.SFTPClient.from_transport(transport)

# Read local file
with open('KELION_V142_CLEAN.php', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Create a PHP file that FORCES no caching WITHOUT changing URL
timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
php_content = f'''<?php
// KELION v142 FORCE DEPLOY - {timestamp}
// Headers to prevent caching
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Accel-Expires: 0');
header('Surrogate-Control: no-store');
header('ETag: "v142-{timestamp}"');
?>
{html_content}'''

# Delete conflicting index.html files if they exist
try:
    sftp.remove('index.html')
    print('❌ Deleted old index.html')
except IOError:
    pass

try:
    sftp.remove('index.htm')
    print('❌ Deleted old index.htm')
except IOError:
    pass

# Upload
with sftp.open('index.php', 'w') as f:
    f.write(php_content)

print('✅ Uploaded REDIRECT version!')

# Verify files
try:
    files = sftp.listdir('.')
    with open('deployment_log.txt', 'w', encoding='utf-8') as log:
        log.write(f'Remote files: {files}\n')
        if 'index.html' in files:
            log.write('WARNING: index.html still exists!\n')
        else:
            log.write('Verified: index.html is GONE.\n')
except Exception as e:
    with open('deployment_log.txt', 'w', encoding='utf-8') as log:
        log.write(f'Error listing files: {str(e)}\n')
    print(f"Error logging: {e}")

print(f'   Now https://kelionai.app/ should serve v142 (via PHP) and redirect to /?v=142&t={timestamp}')

sftp.close()
transport.close()
