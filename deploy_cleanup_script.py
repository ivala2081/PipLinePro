#!/usr/bin/env python3
"""
Deploy and execute the server cleanup script
This script uploads the cleanup script to the server and optionally executes it
"""

import subprocess
import sys
import os


def upload_cleanup_script():
    """Upload the cleanup script to the server"""
    
    server_ip = "185.217.125.139"
    server_user = "root"
    cleanup_script = "deployment/complete_server_cleanup.sh"
    
    if not os.path.exists(cleanup_script):
        print(f"❌ Cleanup script not found: {cleanup_script}")
        return False
    
    print("🚀 Uploading server cleanup script...")
    print(f"📄 Script: {cleanup_script}")
    print(f"🎯 Target: {server_user}@{server_ip}")
    
    try:
        # Upload the cleanup script
        scp_command = f"scp {cleanup_script} {server_user}@{server_ip}:/tmp/complete_server_cleanup.sh"
        print(f"📤 Running: {scp_command}")
        
        result = subprocess.run(scp_command, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Cleanup script uploaded successfully!")
            return True
        else:
            print(f"❌ Upload failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error uploading script: {e}")
        return False


def show_manual_instructions():
    """Show manual instructions for cleanup"""
    
    print("""
🔧 MANUAL CLEANUP INSTRUCTIONS

Since automated upload may have issues, here are the manual steps:

1. DOWNLOAD PUTTY/WINSCP:
   - PuTTY: https://www.putty.org/
   - WinSCP: https://winscp.net/

2. UPLOAD CLEANUP SCRIPT:
   - Use WinSCP to connect to 185.217.125.139
   - Username: root, Password: 0nJrtc9N2C  
   - Upload: deployment/complete_server_cleanup.sh
   - Upload to: /tmp/complete_server_cleanup.sh

3. CONNECT VIA PUTTY:
   - Host: 185.217.125.139
   - Username: root, Password: 0nJrtc9N2C

4. RUN CLEANUP SCRIPT:
   chmod +x /tmp/complete_server_cleanup.sh
   /tmp/complete_server_cleanup.sh

⚠️  WARNING: This will completely wipe the server!
✅ After cleanup, the server will be ready for fresh deployment.

ALTERNATIVE: Copy and paste these commands directly in PuTTY:

# Quick server reset commands:
systemctl stop piplinepro nginx apache2 2>/dev/null || true
rm -rf /opt/*
userdel -r pipline 2>/dev/null || true
rm -f /etc/systemd/system/piplinepro.service
rm -f /etc/nginx/sites-enabled/piplinepro
rm -f /etc/nginx/sites-available/piplinepro
systemctl daemon-reload
apt update && apt upgrade -y
apt autoremove -y && apt autoclean

echo "✅ Quick cleanup completed - ready for deployment!"
    """)


def main():
    """Main function"""
    
    print("🧹 PipLinePro Server Cleanup Deployment")
    print("=" * 50)
    
    # Try to upload the script automatically
    if upload_cleanup_script():
        print("""
✅ Cleanup script uploaded successfully!

NEXT STEPS:
1. Connect to your server via SSH:
   ssh root@185.217.125.139
   
2. Make the script executable:
   chmod +x /tmp/complete_server_cleanup.sh
   
3. Run the cleanup script:
   /tmp/complete_server_cleanup.sh
   
⚠️  WARNING: The script will ask for confirmation before destroying everything!

After cleanup is complete, you can deploy PipLinePro on the clean server.
        """)
    else:
        print("❌ Automatic upload failed. Showing manual instructions...")
        show_manual_instructions()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️ Process cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        show_manual_instructions()
