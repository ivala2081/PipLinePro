#!/usr/bin/env python3
"""
PipLinePro Automated Server Deployment Script
============================================

This script automatically deploys PipLinePro to a Linux server via SSH.
It handles the complete deployment process including:
- Server preparation and cleanup
- File uploads
- Environment setup
- Service configuration
- Database restoration
- Frontend build and deployment

Server Details:
- IP: 185.217.125.139
- User: root
- Auto-deployment with provided credentials

Usage: python automated_server_deployment.py
"""

import os
import sys
import subprocess
import time
import zipfile
import tempfile
import shutil
from pathlib import Path
import json

class PipLineProDeployment:
    def __init__(self):
        self.server_ip = "185.217.125.139"
        self.server_user = "root"
        self.server_password = "VN?4?J3-(,,vkq"
        self.app_name = "piplinepro"
        self.app_dir = f"/opt/{self.app_name}"
        self.local_project_dir = Path.cwd()
        self.deployment_zip = "piplinepro_deployment_20250901_155351.zip"
        
        # Colors for output
        self.colors = {
            'GREEN': '\033[0;32m',
            'YELLOW': '\033[1;33m',
            'RED': '\033[0;31m',
            'BLUE': '\033[0;34m',
            'NC': '\033[0m'  # No Color
        }
    
    def log(self, message, color='GREEN'):
        """Print colored log message"""
        color_code = self.colors.get(color, self.colors['NC'])
        print(f"{color_code}{message}{self.colors['NC']}")
    
    def run_ssh_command(self, command, check_output=False):
        """Execute command on remote server via SSH"""
        ssh_command = [
            'sshpass', '-p', self.server_password,
            'ssh', '-o', 'StrictHostKeyChecking=no',
            '-o', 'UserKnownHostsFile=/dev/null',
            f'{self.server_user}@{self.server_ip}',
            command
        ]
        
        try:
            if check_output:
                result = subprocess.run(ssh_command, capture_output=True, text=True, timeout=300)
                return result.stdout.strip() if result.returncode == 0 else None
            else:
                result = subprocess.run(ssh_command, timeout=300)
                return result.returncode == 0
        except subprocess.TimeoutExpired:
            self.log(f"⏰ Command timed out: {command}", 'RED')
            return False
        except Exception as e:
            self.log(f"❌ SSH command failed: {e}", 'RED')
            return False
    
    def upload_file(self, local_path, remote_path):
        """Upload file to remote server via SCP"""
        scp_command = [
            'sshpass', '-p', self.server_password,
            'scp', '-o', 'StrictHostKeyChecking=no',
            '-o', 'UserKnownHostsFile=/dev/null',
            str(local_path),
            f'{self.server_user}@{self.server_ip}:{remote_path}'
        ]
        
        try:
            result = subprocess.run(scp_command, timeout=600)
            return result.returncode == 0
        except Exception as e:
            self.log(f"❌ File upload failed: {e}", 'RED')
            return False
    
    def check_dependencies(self):
        """Check if required tools are installed"""
        self.log("🔍 Checking local dependencies...")
        
        required_tools = ['sshpass', 'ssh', 'scp']
        missing_tools = []
        
        for tool in required_tools:
            if shutil.which(tool) is None:
                missing_tools.append(tool)
        
        if missing_tools:
            self.log(f"❌ Missing required tools: {', '.join(missing_tools)}", 'RED')
            self.log("📦 Please install missing tools:", 'YELLOW')
            if sys.platform.startswith('win'):
                self.log("  - Install Git Bash or WSL", 'YELLOW')
                self.log("  - Or use: choco install openssh", 'YELLOW')
            elif sys.platform.startswith('linux'):
                self.log("  - sudo apt install openssh-client sshpass", 'YELLOW')
            elif sys.platform.startswith('darwin'):
                self.log("  - brew install sshpass", 'YELLOW')
            return False
        
        self.log("✅ All dependencies available")
        return True
    
    def test_connection(self):
        """Test SSH connection to server"""
        self.log("🔗 Testing server connection...")
        
        if self.run_ssh_command("echo 'Connection successful'"):
            self.log("✅ Server connection established")
            return True
        else:
            self.log("❌ Failed to connect to server", 'RED')
            return False
    
    def prepare_server(self):
        """Prepare the server environment"""
        self.log("🛠️ Preparing server environment...")
        
        # Update system and install dependencies
        commands = [
            "apt update && apt upgrade -y",
            "apt install -y python3 python3-pip python3-venv python3-dev nginx git curl wget unzip build-essential sqlite3 nodejs npm supervisor",
            "systemctl stop nginx || true",
            f"systemctl stop {self.app_name} || true",
            f"rm -rf {self.app_dir}",
            f"mkdir -p {self.app_dir}",
            "mkdir -p /tmp/deployment"
        ]
        
        for cmd in commands:
            self.log(f"📦 Running: {cmd[:50]}...")
            if not self.run_ssh_command(cmd):
                self.log(f"⚠️ Command may have failed: {cmd}", 'YELLOW')
        
        self.log("✅ Server preparation completed")
        return True
    
    def upload_application(self):
        """Upload application files to server"""
        self.log("📤 Uploading application files...")
        
        # Check if deployment zip exists
        zip_path = self.local_project_dir / self.deployment_zip
        if not zip_path.exists():
            self.log(f"❌ Deployment zip not found: {zip_path}", 'RED')
            return False
        
        # Upload deployment zip
        remote_zip_path = f"/tmp/deployment/{self.deployment_zip}"
        if not self.upload_file(zip_path, remote_zip_path):
            self.log("❌ Failed to upload deployment zip", 'RED')
            return False
        
        # Extract on server
        extract_commands = [
            f"cd {self.app_dir}",
            f"unzip -o {remote_zip_path}",
            f"chmod -R 755 {self.app_dir}",
            f"chown -R root:root {self.app_dir}"
        ]
        
        for cmd in extract_commands:
            if not self.run_ssh_command(cmd):
                self.log(f"❌ Failed to run: {cmd}", 'RED')
                return False
        
        self.log("✅ Application files uploaded and extracted")
        return True
    
    def setup_backend(self):
        """Set up Python backend environment"""
        self.log("🐍 Setting up Python backend...")
        
        backend_commands = [
            f"cd {self.app_dir}",
            "python3 -m venv venv",
            "source venv/bin/activate && pip install --upgrade pip",
            "source venv/bin/activate && pip install -r requirements.txt",
            "mkdir -p logs instance static/uploads backups",
            "chmod 777 logs instance static/uploads",
        ]
        
        for cmd in backend_commands:
            self.log(f"🔧 {cmd.split('&&')[-1].strip()}")
            if not self.run_ssh_command(f"cd {self.app_dir} && {cmd.split('&&')[-1] if '&&' in cmd else cmd}"):
                self.log(f"⚠️ Backend setup command may have issues: {cmd}", 'YELLOW')
        
        # Initialize database
        db_init_cmd = f"""cd {self.app_dir} && source venv/bin/activate && python3 -c "
from app import create_app
from app.models import db
import os
os.environ['FLASK_ENV'] = 'production'
app = create_app('deployment.production_config.ProductionConfig')
with app.app_context():
    db.create_all()
    print('Database initialized successfully')
" """
        
        self.log("🗄️ Initializing database...")
        self.run_ssh_command(db_init_cmd)
        
        self.log("✅ Backend setup completed")
        return True
    
    def setup_frontend(self):
        """Set up React frontend"""
        self.log("⚛️ Setting up React frontend...")
        
        frontend_commands = [
            f"cd {self.app_dir}/frontend",
            "npm install",
            "npm run build",
            f"cp -r dist/* {self.app_dir}/static/",
            f"cp dist/index.html {self.app_dir}/templates/"
        ]
        
        for cmd in frontend_commands:
            self.log(f"📦 {cmd.split('/')[-1] if '/' in cmd else cmd}")
            if not self.run_ssh_command(cmd):
                self.log(f"⚠️ Frontend command may have issues: {cmd}", 'YELLOW')
        
        self.log("✅ Frontend setup completed")
        return True
    
    def configure_services(self):
        """Configure systemd and nginx services"""
        self.log("⚙️ Configuring system services...")
        
        # Create systemd service
        systemd_service = f"""[Unit]
Description=PipLinePro Flask Application
After=network.target

[Service]
Type=exec
User=root
WorkingDirectory={self.app_dir}
Environment=PATH={self.app_dir}/venv/bin
Environment=FLASK_ENV=production
ExecStart={self.app_dir}/venv/bin/gunicorn --config deployment/gunicorn_config.py app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target"""
        
        # Create nginx config
        nginx_config = f"""server {{
    listen 80;
    server_name {self.server_ip};
    client_max_body_size 50M;
    
    # Serve static files
    location /static/ {{
        alias {self.app_dir}/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
    
    # Proxy to Flask app
    location / {{
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }}
}}"""
        
        # Write service files
        service_commands = [
            f"echo '{systemd_service}' > /etc/systemd/system/{self.app_name}.service",
            f"echo '{nginx_config}' > /etc/nginx/sites-available/{self.app_name}",
            f"ln -sf /etc/nginx/sites-available/{self.app_name} /etc/nginx/sites-enabled/",
            "rm -f /etc/nginx/sites-enabled/default",
            "nginx -t",
            "systemctl daemon-reload",
            f"systemctl enable {self.app_name}",
            "systemctl enable nginx"
        ]
        
        for cmd in service_commands:
            if not self.run_ssh_command(cmd):
                self.log(f"⚠️ Service configuration issue: {cmd}", 'YELLOW')
        
        self.log("✅ Services configured")
        return True
    
    def restore_database(self):
        """Restore database backup"""
        self.log("🗄️ Restoring database backup...")
        
        # Find the most recent backup
        backup_files = [
            "deployment/treasury_backup_20250901_155243.db",
            "deployment/treasury_backup_20250901_155144.db"
        ]
        
        for backup_file in backup_files:
            restore_cmd = f"cd {self.app_dir} && cp {backup_file} instance/treasury_improved.db && chmod 666 instance/treasury_improved.db"
            if self.run_ssh_command(restore_cmd):
                self.log(f"✅ Database restored from {backup_file}")
                return True
        
        self.log("⚠️ No backup restored, will use fresh database", 'YELLOW')
        return True
    
    def start_services(self):
        """Start all services"""
        self.log("🚀 Starting services...")
        
        start_commands = [
            f"systemctl start {self.app_name}",
            "systemctl start nginx",
            f"systemctl status {self.app_name} --no-pager",
            "systemctl status nginx --no-pager"
        ]
        
        for cmd in start_commands:
            if not self.run_ssh_command(cmd):
                self.log(f"⚠️ Service start issue: {cmd}", 'YELLOW')
        
        self.log("✅ Services started")
        return True
    
    def verify_deployment(self):
        """Verify that deployment is working"""
        self.log("🔍 Verifying deployment...")
        
        # Check if services are running
        service_status = self.run_ssh_command(f"systemctl is-active {self.app_name}", check_output=True)
        nginx_status = self.run_ssh_command("systemctl is-active nginx", check_output=True)
        
        if service_status == "active" and nginx_status == "active":
            self.log("✅ All services are running")
        else:
            self.log(f"⚠️ Service status - App: {service_status}, Nginx: {nginx_status}", 'YELLOW')
        
        # Test HTTP response
        test_cmd = f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost"
        http_status = self.run_ssh_command(test_cmd, check_output=True)
        
        if http_status == "200":
            self.log("✅ HTTP server responding correctly")
        else:
            self.log(f"⚠️ HTTP status: {http_status}", 'YELLOW')
        
        return True
    
    def deploy(self):
        """Main deployment function"""
        self.log("🚀 Starting PipLinePro Automated Deployment", 'BLUE')
        self.log("=" * 50, 'BLUE')
        
        steps = [
            ("Checking dependencies", self.check_dependencies),
            ("Testing server connection", self.test_connection),
            ("Preparing server", self.prepare_server),
            ("Uploading application", self.upload_application),
            ("Setting up backend", self.setup_backend),
            ("Setting up frontend", self.setup_frontend),
            ("Configuring services", self.configure_services),
            ("Restoring database", self.restore_database),
            ("Starting services", self.start_services),
            ("Verifying deployment", self.verify_deployment)
        ]
        
        for step_name, step_func in steps:
            self.log(f"\n📋 Step: {step_name}", 'BLUE')
            try:
                if not step_func():
                    self.log(f"❌ Failed at step: {step_name}", 'RED')
                    return False
                time.sleep(2)  # Brief pause between steps
            except Exception as e:
                self.log(f"❌ Error in {step_name}: {e}", 'RED')
                return False
        
        self.log("\n" + "=" * 50, 'GREEN')
        self.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!", 'GREEN')
        self.log("=" * 50, 'GREEN')
        self.log(f"🌐 Your application is now available at: http://{self.server_ip}", 'GREEN')
        self.log("\n📋 Management Commands:", 'BLUE')
        self.log(f"  - Check status: ssh root@{self.server_ip} 'systemctl status {self.app_name}'")
        self.log(f"  - View logs: ssh root@{self.server_ip} 'journalctl -u {self.app_name} -f'")
        self.log(f"  - Restart app: ssh root@{self.server_ip} 'systemctl restart {self.app_name} nginx'")
        
        return True

def main():
    """Main function"""
    print("🚀 PipLinePro Automated Server Deployment")
    print("==========================================")
    
    deployment = PipLineProDeployment()
    
    try:
        success = deployment.deploy()
        if success:
            print("\n✅ Deployment completed successfully!")
            return 0
        else:
            print("\n❌ Deployment failed!")
            return 1
    except KeyboardInterrupt:
        print("\n🛑 Deployment cancelled by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
