"""
Quick ZIP backup creator for NEXUS v11
"""
import zipfile
import os
from pathlib import Path

def create_desktop_zip():
    # Source backup directory
    current_dir = Path(__file__).parent
    backup_dir = current_dir / "backups" / "NEXUS_BACKUP_v11_20251222_214705"
    
    if not backup_dir.exists():
        print(f"❌ Error: Backup directory not found: {backup_dir}")
        return
    
    # Destination on Desktop
    desktop = Path.home() / "Desktop"
    zip_path = desktop / "NEXUS_BACKUP_v11.zip"
    
    print(f"Creating ZIP archive...")
    print(f"Source: {backup_dir}")
    print(f"Destination: {zip_path}")
    
    # Create ZIP file
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in backup_dir.rglob('*'):
            if file.is_file():
                arcname = file.relative_to(backup_dir.parent)
                zipf.write(file, arcname)
                print(f"  Added: {arcname}")
    
    size_mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"\n✅ ZIP created successfully!")
    print(f"📦 Size: {size_mb:.2f} MB")
    print(f"📁 Location: {zip_path}")

if __name__ == "__main__":
    create_desktop_zip()
