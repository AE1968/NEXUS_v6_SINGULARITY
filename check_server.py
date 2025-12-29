import paramiko
import sys

SFTP_HOST = 'fs-cygni.easywp.com'
SFTP_USER = 'geneza-kelion-129030d'
SFTP_PASS = 'vAMhj455TYdCtTUd1dM8'

print("Connecting...")
transport = paramiko.Transport((SFTP_HOST, 22))
transport.connect(username=SFTP_USER, password=SFTP_PASS)
sftp = paramiko.SFTPClient.from_transport(transport)
print("Connected!")

# List files
print("\n=== SERVER FILES ===")
files = sftp.listdir('.')
for f in sorted(files):
    print(f"  {f}")

# Check what index.php contains
print("\n=== CHECKING index.php ===")
try:
    with sftp.open('index.php', 'r') as fp:
        content = fp.read(500).decode('utf-8', errors='ignore')
        print(content[:500])
except Exception as e:
    print(f"Error reading index.php: {e}")

sftp.close()
transport.close()
print("\nDone.")
