#!/usr/bin/env python3
"""
Simple deployment package creator for PipLinePro
"""

import os
import zipfile
from datetime import datetime


def create_deployment_package():
    """Create deployment package"""
    print("Creating PipLinePro deployment package...")
    
    package_name = f"piplinepro_deployment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    
    # Files and directories to include
    include_items = [
        'app/',
        'templates/',
        'static/',
        'migrations/',
        'scripts/',
        'deployment/',
        'config.py',
        'app.py',
        'requirements.txt',
        '.gitignore'
    ]
    
    # Find the latest database backup
    backup_files = [f for f in os.listdir('deployment') if f.startswith('treasury_backup_') and f.endswith('.db')]
    if backup_files:
        latest_backup = max(backup_files)
        print(f"Including database backup: {latest_backup}")
    
    try:
        with zipfile.ZipFile(package_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for item in include_items:
                if os.path.exists(item):
                    if os.path.isfile(item):
                        zipf.write(item)
                        print(f"Added file: {item}")
                    elif os.path.isdir(item):
                        for root, dirs, files in os.walk(item):
                            # Skip unwanted directories
                            dirs[:] = [d for d in dirs if d not in ['__pycache__', '.git', 'node_modules', 'venv']]
                            
                            for file in files:
                                if not file.endswith(('.pyc', '.pyo', '.log')):
                                    file_path = os.path.join(root, file)
                                    zipf.write(file_path)
        
        print(f"\nDeployment package created: {package_name}")
        print(f"Package size: {os.path.getsize(package_name) / 1024 / 1024:.2f} MB")
        
        # Show manual deployment instructions
        print(f"""
DEPLOYMENT INSTRUCTIONS:

1. Upload package to server:
   scp {package_name} root@185.217.125.139:/tmp/

2. Connect to server:
   ssh root@185.217.125.139

3. Extract and prepare:
   cd /opt
   mkdir -p piplinepro
   cd piplinepro
   unzip /tmp/{package_name}

4. Run deployment:
   chmod +x deployment/*.sh
   ./deployment/deploy.sh

5. Restore database:
   cp deployment/treasury_backup_*.db instance/treasury_improved.db

6. Start services:
   systemctl start piplinepro
   systemctl start nginx

7. Test:
   curl http://185.217.125.139

Your application will be available at: http://185.217.125.139
        """)
        
        return True
        
    except Exception as e:
        print(f"Error creating package: {e}")
        return False


if __name__ == "__main__":
    if create_deployment_package():
        print("Package creation completed successfully!")
    else:
        print("Package creation failed!")
        exit(1)
