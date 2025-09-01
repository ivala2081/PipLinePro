#!/usr/bin/env python3
"""
Alternative upload script for PipLinePro deployment
Uses paramiko for SSH connection
"""

import paramiko
import os
import sys
from scp import SCPClient


def upload_deployment_package():
    """Upload deployment package to server"""
    
    # Server details
    hostname = "185.217.125.139"
    username = "root"
    password = "0nJrtc9N2C"
    
    # Local file
    local_file = "piplinepro_deployment_20250901_155351.zip"
    remote_path = "/tmp/"
    
    if not os.path.exists(local_file):
        print(f"❌ Local file not found: {local_file}")
        return False
    
    try:
        print(f"🔗 Connecting to {hostname}...")
        
        # Create SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Connect to server
        ssh.connect(hostname, username=username, password=password, timeout=30)
        print("✅ SSH connection established")
        
        # Upload file using SCP
        print(f"📤 Uploading {local_file}...")
        with SCPClient(ssh.get_transport()) as scp:
            scp.put(local_file, remote_path)
        
        print("✅ File uploaded successfully!")
        
        # Verify upload
        stdin, stdout, stderr = ssh.exec_command(f"ls -la {remote_path}piplinepro_deployment_*.zip")
        result = stdout.read().decode()
        if result:
            print(f"📄 Verified upload: {result.strip()}")
        
        ssh.close()
        return True
        
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return False


def main():
    """Main function"""
    print("🚀 PipLinePro Upload Script")
    print("=" * 50)
    
    if upload_deployment_package():
        print("\n✅ Upload completed successfully!")
        print("🔧 Next step: Connect to server and run deployment")
        print(f"SSH command: ssh root@185.217.125.139")
    else:
        print("\n❌ Upload failed!")
        print("💡 Try using WinSCP or PuTTY instead")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️ Upload cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
