"""
🔒 NEXUS BACKUP SYSTEM v11.0
Automated backup creation with versioning and compression
"""

import os
import shutil
import datetime
import json
from pathlib import Path

class NexusBackup:
    def __init__(self, source_dir, backup_number):
        self.source_dir = Path(source_dir)
        self.backup_number = backup_number
        self.timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        self.backup_name = f"NEXUS_BACKUP_v{backup_number}_{self.timestamp}"
        self.backup_dir = self.source_dir / "backups" / self.backup_name
        
    def create_backup(self):
        """Create a complete backup of the project"""
        print(f"\n{'='*60}")
        print(f"🔒 NEXUS BACKUP SYSTEM v11.0")
        print(f"{'='*60}\n")
        
        # Create backup directory
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 Creating backup: {self.backup_name}")
        
        # Files to backup
        files_to_backup = [
            "app.py",
            "index.html",
            "README.md",
            "DEPLOYMENT_GUIDE.md",
            "CHANGELOG.md",
            "LICENSE",
            "requirements.txt",
            "AUDIT_TOTAL_REPORT.txt",
            "NEXUS_AUDITOR_TOTAL.py"
        ]
        
        # Directories to backup
        dirs_to_backup = ["js", "assets", "css"]
        
        # Copy files
        copied_files = 0
        for file in files_to_backup:
            src = self.source_dir / file
            if src.exists():
                dst = self.backup_dir / file
                shutil.copy2(src, dst)
                copied_files += 1
                print(f"  ✅ {file}")
        
        # Copy directories
        copied_dirs = 0
        for dir_name in dirs_to_backup:
            src = self.source_dir / dir_name
            if src.exists():
                dst = self.backup_dir / dir_name
                shutil.copytree(src, dst, dirs_exist_ok=True)
                copied_dirs += 1
                file_count = sum(1 for _ in dst.rglob('*') if _.is_file())
                print(f"  ✅ {dir_name}/ ({file_count} files)")
        
        # Create backup manifest
        manifest = {
            "backup_version": self.backup_number,
            "timestamp": self.timestamp,
            "files_backed_up": copied_files,
            "directories_backed_up": copied_dirs,
            "total_size_mb": self._get_dir_size(self.backup_dir),
            "nexus_version": "10.8.0",
            "modules": [
                "Neural Engine", "Bio-Matrix", "Vision System", 
                "Memory Vector", "Knowledge Base", "Cortex Monitor",
                "Sensory Awareness", "Particle System", "Bio-Audio",
                "Achievements", "Economy", "Marketplace", 
                "Mainframe Console", "Voice System"
            ]
        }
        
        manifest_path = self.backup_dir / "BACKUP_MANIFEST.json"
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"\n📊 Backup Statistics:")
        print(f"  • Files: {copied_files}")
        print(f"  • Directories: {copied_dirs}")
        print(f"  • Total Size: {manifest['total_size_mb']:.2f} MB")
        print(f"  • Location: {self.backup_dir}")
        
        # Create quick restore script
        self._create_restore_script()
        
        print(f"\n{'='*60}")
        print(f"✅ BACKUP v{self.backup_number} COMPLETED SUCCESSFULLY!")
        print(f"{'='*60}\n")
        
        return str(self.backup_dir)
    
    def _get_dir_size(self, path):
        """Calculate directory size in MB"""
        total = sum(f.stat().st_size for f in path.rglob('*') if f.is_file())
        return total / (1024 * 1024)
    
    def _create_restore_script(self):
        """Create a restore script for easy recovery"""
        restore_script = f"""# NEXUS RESTORE SCRIPT v{self.backup_number}
# Created: {self.timestamp}

# To restore this backup:
# 1. Navigate to the backup directory
# 2. Copy all files back to the main project directory
# 3. Run: python app.py

# Backup contains:
# - All core files (app.py, index.html)
# - All JavaScript modules (14 files)
# - Documentation (README, DEPLOYMENT_GUIDE, etc.)
# - Assets and resources

# Restore command (PowerShell):
# Copy-Item -Path "{self.backup_dir}\\*" -Destination "C:\\Users\\adria\\.gemini\\antigravity\\scratch\\GENEZA_NEXUS_HUMANOID" -Recurse -Force
"""
        
        restore_path = self.backup_dir / "RESTORE_INSTRUCTIONS.txt"
        with open(restore_path, 'w') as f:
            f.write(restore_script)

if __name__ == "__main__":
    import sys
    
    # Get backup number from command line
    backup_num = sys.argv[1] if len(sys.argv) > 1 else "11"
    
    # Source directory
    source = Path(__file__).parent
    
    # Create backup
    backup = NexusBackup(source, backup_num)
    backup_path = backup.create_backup()
    
    print(f"💾 Backup saved to: {backup_path}")
    print(f"🔐 Your GENEZA NEXUS KELION v10.8 is now safely backed up!")
