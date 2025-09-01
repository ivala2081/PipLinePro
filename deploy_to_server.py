#!/usr/bin/env python3
"""
PipLinePro Complete Server Deployment
====================================

This script provides multiple deployment options:
1. Automated SSH deployment (recommended)
2. Manual deployment instructions
3. Server preparation scripts

Server: 185.217.125.139
User: root
Password: VN?4?J3-(,,vkq
"""

import os
import sys
import subprocess
import platform
import shutil
from pathlib import Path

class DeploymentManager:
    def __init__(self):
        self.server_ip = "185.217.125.139"
        self.server_user = "root"
        self.server_password = "VN?4?J3-(,,vkq"
        
    def print_banner(self):
        print("🚀 PipLinePro Server Deployment Manager")
        print("=" * 50)
        print(f"📡 Server: {self.server_ip}")
        print(f"👤 User: {self.server_user}")
        print("=" * 50)
    
    def check_ssh_tools(self):
        """Check if SSH tools are available"""
        tools = ['ssh', 'scp']
        if platform.system() != 'Windows':
            tools.append('sshpass')
        
        available = []
        missing = []
        
        for tool in tools:
            if shutil.which(tool):
                available.append(tool)
            else:
                missing.append(tool)
        
        return available, missing
    
    def run_automated_deployment(self):
        """Run the automated deployment script"""
        print("🤖 Starting automated deployment...")
        
        # Check if automated deployment script exists
        auto_script = Path("automated_server_deployment.py")
        if not auto_script.exists():
            print("❌ Automated deployment script not found!")
            return False
        
        # Run the automated deployment
        try:
            result = subprocess.run([sys.executable, str(auto_script)], 
                                  cwd=Path.cwd())
            return result.returncode == 0
        except Exception as e:
            print(f"❌ Failed to run automated deployment: {e}")
            return False
    
    def create_manual_deployment_package(self):
        """Create a manual deployment package"""
        print("📦 Creating manual deployment package...")
        
        # Check if deployment zip exists
        zip_file = Path("piplinepro_deployment_20250901_155351.zip")
        if not zip_file.exists():
            print("❌ Deployment zip file not found!")
            return False
        
        # Create manual deployment instructions
        instructions = f"""
# PipLinePro Manual Deployment Instructions
# ========================================

# Step 1: Connect to your server
ssh {self.server_user}@{self.server_ip}
# Password: {self.server_password}

# Step 2: Run the preparation script
curl -sSL https://raw.githubusercontent.com/your-repo/scripts/simple_deployment.sh | bash

# Step 3: Upload your deployment package
# On your local machine, run:
scp piplinepro_deployment_20250901_155351.zip {self.server_user}@{self.server_ip}:/tmp/

# Step 4: Extract and deploy on server
cd /opt/piplinepro
unzip -o /tmp/piplinepro_deployment_20250901_155351.zip
source venv/bin/activate
pip install -r requirements.txt

# Step 5: Build frontend
cd frontend
npm install
npm run build
cp -r dist/* ../static/

# Step 6: Restart services
systemctl restart piplinepro nginx

# Step 7: Verify deployment
curl http://{self.server_ip}
systemctl status piplinepro nginx

# Your application should now be available at:
# http://{self.server_ip}
"""
        
        # Write instructions to file
        with open("MANUAL_DEPLOYMENT.md", "w") as f:
            f.write(instructions)
        
        print("✅ Manual deployment instructions created: MANUAL_DEPLOYMENT.md")
        return True
    
    def show_ssh_command(self):
        """Show SSH command to connect to server"""
        print("🔗 SSH Connection Command:")
        print("-" * 30)
        print(f"ssh {self.server_user}@{self.server_ip}")
        print(f"Password: {self.server_password}")
        print()
        print("Once connected, you can run:")
        print("curl -sSL https://raw.githubusercontent.com/your-repo/simple_deployment.sh | bash")
    
    def copy_simple_script(self):
        """Show the simple deployment script that can be copy-pasted"""
        script_path = Path("simple_deployment.sh")
        if script_path.exists():
            print("📋 Copy-Paste Deployment Script:")
            print("-" * 40)
            print("You can copy the contents of 'simple_deployment.sh' and paste it into your server terminal.")
            print(f"File location: {script_path.absolute()}")
        else:
            print("❌ Simple deployment script not found!")
    
    def main_menu(self):
        """Show main deployment menu"""
        while True:
            print("\n🚀 PipLinePro Deployment Options:")
            print("1. 🤖 Automated SSH Deployment (Recommended)")
            print("2. 📋 Show SSH Connection Command")
            print("3. 📦 Create Manual Deployment Package")
            print("4. 📝 Show Copy-Paste Script Instructions")
            print("5. 🔍 Check SSH Tools Availability")
            print("6. ❌ Exit")
            
            choice = input("\nEnter your choice (1-6): ").strip()
            
            if choice == "1":
                available, missing = self.check_ssh_tools()
                if missing:
                    print(f"⚠️ Missing SSH tools: {', '.join(missing)}")
                    print("Please install missing tools or use manual deployment.")
                    continue
                
                confirm = input("🚀 Start automated deployment? (y/n): ").strip().lower()
                if confirm == 'y':
                    success = self.run_automated_deployment()
                    if success:
                        print("✅ Automated deployment completed!")
                    else:
                        print("❌ Automated deployment failed!")
            
            elif choice == "2":
                self.show_ssh_command()
            
            elif choice == "3":
                self.create_manual_deployment_package()
            
            elif choice == "4":
                self.copy_simple_script()
            
            elif choice == "5":
                available, missing = self.check_ssh_tools()
                print(f"✅ Available tools: {', '.join(available) if available else 'None'}")
                print(f"❌ Missing tools: {', '.join(missing) if missing else 'None'}")
                
                if missing:
                    print("\n📦 Installation commands:")
                    if platform.system() == "Windows":
                        print("  - Install Git Bash or WSL")
                        print("  - Or use PowerShell: choco install openssh")
                    elif platform.system() == "Linux":
                        print("  - sudo apt install openssh-client sshpass")
                    elif platform.system() == "Darwin":
                        print("  - brew install sshpass")
            
            elif choice == "6":
                print("👋 Goodbye!")
                break
            
            else:
                print("❌ Invalid choice. Please try again.")

def main():
    """Main function"""
    manager = DeploymentManager()
    manager.print_banner()
    
    # Check if we're in the right directory
    if not Path("app.py").exists():
        print("❌ Please run this script from the PipLinePro project root directory")
        return 1
    
    try:
        manager.main_menu()
        return 0
    except KeyboardInterrupt:
        print("\n🛑 Deployment cancelled by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())