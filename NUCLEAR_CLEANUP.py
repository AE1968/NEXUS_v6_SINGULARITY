import os
import shutil

# Files to ABSOLUTELY KEEP (v135 related)
KEEP_LIST = [
    'index.html',
    'V_134_FINAL.html',
    'app.py',
    'sw.js',
    'manifest.json',
    'assets',
    'config_kelion.py',
    '.env.example',
    '.gitignore',
    '.agent',
    '.git',
    'requirements.txt',
    'Procfile',
    'runtime.txt',
    'Dockerfile',
    'docker-compose.yml',
    'robots.txt',
    'sitemap.xml',
    'EXTREME_DEPLOY_RO.py',
    'LIST_REMOTE_FILES.py',
    'NUCLEAR_CLEANUP.py'
]

def nuclear_local_cleanup():
    print("☢️ STARTING NUCLEAR LOCAL CLEANUP...")
    current_dir = os.getcwd()
    for item in os.listdir(current_dir):
        if item not in KEEP_LIST:
            try:
                if os.path.isfile(item):
                    os.remove(item)
                    print(f"🗑️ Deleted file: {item}")
                elif os.path.isdir(item):
                    shutil.rmtree(item)
                    print(f"🗑️ Deleted directory: {item}")
            except Exception as e:
                print(f"⚠️ Could not delete {item}: {e}")
    print("✅ LOCAL CLEANUP COMPLETE.")

if __name__ == "__main__":
    nuclear_local_cleanup()
