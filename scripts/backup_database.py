"""
Database Backup Script
Safely creates backups of the SQLite database
"""

import os
import shutil
import logging
from datetime import datetime
from pathlib import Path

def backup_database():
    """Create a backup of the database"""
    try:
        # Database path
        db_path = 'instance/treasury_improved.db'
        
        if not os.path.exists(db_path):
            print(f"❌ Database file not found: {db_path}")
            return False
        
        # Create backups directory
        backup_dir = Path('backups')
        backup_dir.mkdir(exist_ok=True)
        
        # Generate backup filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"treasury_backup_{timestamp}.db"
        backup_path = backup_dir / backup_filename
        
        # Create backup
        shutil.copy2(db_path, backup_path)
        
        # Get backup size
        backup_size = os.path.getsize(backup_path)
        size_mb = round(backup_size / (1024 * 1024), 2)
        
        print(f"✅ Database backup created successfully:")
        print(f"   📁 File: {backup_path}")
        print(f"   📊 Size: {size_mb} MB")
        print(f"   🕒 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Clean up old backups (keep last 10)
        cleanup_old_backups(backup_dir)
        
        return True
        
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False

def cleanup_old_backups(backup_dir, keep_count=10):
    """Clean up old backup files, keeping only the most recent ones"""
    try:
        backup_files = list(backup_dir.glob("treasury_backup_*.db"))
        backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        if len(backup_files) > keep_count:
            files_to_delete = backup_files[keep_count:]
            for file_path in files_to_delete:
                file_path.unlink()
                print(f"🗑️  Removed old backup: {file_path.name}")
                
    except Exception as e:
        print(f"⚠️  Warning: Failed to cleanup old backups: {e}")

if __name__ == "__main__":
    backup_database()
