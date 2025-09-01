#!/usr/bin/env python3
"""
Database restoration script for PipLinePro production deployment
This script restores the database from backup on the production server
"""

import os
import sys
import sqlite3
import shutil
import glob
from pathlib import Path


def find_backup_file():
    """Find the latest database backup file"""
    backup_pattern = "deployment/treasury_backup_*.db"
    backup_files = glob.glob(backup_pattern)
    
    if not backup_files:
        print("❌ No database backup files found!")
        print(f"Looking for: {backup_pattern}")
        return None
    
    # Get the most recent backup
    latest_backup = max(backup_files, key=os.path.getctime)
    print(f"📄 Found backup file: {latest_backup}")
    return latest_backup


def restore_database():
    """Restore database from backup"""
    print("🗄️ Starting database restoration...")
    
    # Find backup file
    backup_file = find_backup_file()
    if not backup_file:
        return False
    
    # Target database path
    target_db = "instance/treasury_improved.db"
    
    # Create instance directory if it doesn't exist
    os.makedirs("instance", exist_ok=True)
    
    try:
        # Backup existing database if it exists
        if os.path.exists(target_db):
            backup_existing = f"{target_db}.backup.{int(__import__('time').time())}"
            shutil.copy2(target_db, backup_existing)
            print(f"📦 Existing database backed up to: {backup_existing}")
        
        # Copy backup to target location
        shutil.copy2(backup_file, target_db)
        print(f"✅ Database restored from: {backup_file}")
        
        # Verify the restoration
        conn = sqlite3.connect(target_db)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if tables:
            print(f"📊 Verified {len(tables)} tables in restored database:")
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f"   - {table[0]}: {count} records")
        else:
            print("⚠️ Warning: No tables found in restored database")
            return False
        
        conn.close()
        
        # Set proper permissions
        os.chmod(target_db, 0o666)
        print("🔒 Database permissions set")
        
        return True
        
    except Exception as e:
        print(f"❌ Error restoring database: {e}")
        return False


def initialize_app_database():
    """Initialize application database tables"""
    print("🔧 Initializing application database...")
    
    try:
        # Import Flask app
        sys.path.insert(0, '.')
        from app import create_app
        from app.models import db
        from deployment.production_config import ProductionConfig
        
        # Create app instance
        app = create_app(ProductionConfig)
        
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✅ Database tables initialized successfully")
            
            # Run any pending migrations
            try:
                from flask_migrate import upgrade
                upgrade()
                print("✅ Database migrations applied successfully")
            except Exception as e:
                print(f"⚠️ No migrations to apply or migration error: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main function"""
    print("🗄️ PipLinePro Database Restoration")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("app.py"):
        print("❌ Error: This script must be run from the application root directory")
        sys.exit(1)
    
    # Restore database from backup
    if not restore_database():
        print("❌ Database restoration failed!")
        sys.exit(1)
    
    # Initialize application database
    if not initialize_app_database():
        print("❌ Database initialization failed!")
        sys.exit(1)
    
    print("\n✅ Database restoration completed successfully!")
    print("🚀 Application database is ready for production use")


if __name__ == "__main__":
    main()
