#!/usr/bin/env python3
"""
Database backup script for PipLinePro deployment
This script creates a backup of the SQLite database for transfer to production
"""

import os
import sqlite3
import shutil
import sys
from datetime import datetime


def backup_database():
    """Create a backup of the database"""
    
    # Source database path
    source_db = "instance/treasury_improved.db"
    
    if not os.path.exists(source_db):
        print(f"❌ Source database not found: {source_db}")
        return False
    
    # Create backup filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"treasury_backup_{timestamp}.db"
    backup_path = os.path.join("deployment", backup_filename)
    
    try:
        # Ensure deployment directory exists
        os.makedirs("deployment", exist_ok=True)
        
        # Copy the database file
        shutil.copy2(source_db, backup_path)
        
        # Verify the backup
        conn = sqlite3.connect(backup_path)
        cursor = conn.cursor()
        
        # Check if main tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if tables:
            print(f"✅ Database backup created successfully: {backup_path}")
            print(f"📊 Found {len(tables)} tables in backup:")
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f"   - {table[0]}: {count} records")
        else:
            print("⚠️ Warning: No tables found in backup database")
        
        conn.close()
        
        # Create a SQL dump as well (for easier inspection)
        dump_path = backup_path.replace('.db', '.sql')
        try:
            with open(dump_path, 'w', encoding='utf-8') as f:
                conn = sqlite3.connect(backup_path)
                for line in conn.iterdump():
                    f.write('%s\n' % line)
                conn.close()
            print(f"📄 SQL dump created: {dump_path}")
        except Exception as dump_error:
            print(f"⚠️ Warning: Could not create SQL dump: {dump_error}")
            # Continue anyway as the main backup was successful
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating database backup: {e}")
        return False


def main():
    """Main function"""
    print("Creating database backup for deployment...")
    
    if backup_database():
        print("\nDatabase backup completed successfully!")
        print("Files created in deployment/ directory")
        print("Ready for deployment to server")
    else:
        print("\nDatabase backup failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()
