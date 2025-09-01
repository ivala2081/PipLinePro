#!/bin/bash
# Simple PipLinePro Web Deployment Script
# This script can be copy-pasted into any terminal interface

echo "🚀 PipLinePro Simple Deployment"
echo "================================"

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing dependencies..."
apt install -y python3 python3-pip python3-venv python3-dev nginx git curl wget unzip build-essential sqlite3

# Create application directory
echo "📁 Setting up directories..."
mkdir -p /opt/piplinepro
cd /opt/piplinepro

# Create a simple Python application (fallback if upload fails)
echo "🐍 Creating basic Flask app..."
cat > app.py << 'EOF'
from flask import Flask, render_template_string

app = Flask(__name__)

@app.route('/')
def home():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>PipLinePro - Deployed Successfully!</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f4f4f4; }
            .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; }
            .success { color: #27ae60; font-size: 18px; }
            .info { background: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 PipLinePro Deployed Successfully!</h1>
            <p class="success">✅ Your application is running on the server!</p>
            
            <div class="info">
                <h3>Deployment Information:</h3>
                <ul>
                    <li><strong>Server IP:</strong> 185.217.125.139</li>
                    <li><strong>Status:</strong> Active</li>
                    <li><strong>Framework:</strong> Flask (Python)</li>
                    <li><strong>Web Server:</strong> Nginx + Gunicorn</li>
                </ul>
            </div>
            
            <div class="info">
                <h3>Next Steps:</h3>
                <ol>
                    <li>Upload your full PipLinePro application</li>
                    <li>Restore your database backup</li>
                    <li>Configure production settings</li>
                    <li>Set up SSL certificate</li>
                </ol>
            </div>
            
            <p><em>This is a placeholder page. Your full PipLinePro application will replace this.</em></p>
        </div>
    </body>
    </html>
    ''')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
EOF

# Create virtual environment
echo "🐍 Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install flask gunicorn

# Create systemd service
echo "⚙️ Creating system service..."
cat > /etc/systemd/system/piplinepro.service << 'EOF'
[Unit]
Description=PipLinePro Flask Application
After=network.target

[Service]
Type=exec
User=root
WorkingDirectory=/opt/piplinepro
Environment=PATH=/opt/piplinepro/venv/bin
ExecStart=/opt/piplinepro/venv/bin/gunicorn --bind 127.0.0.1:8000 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create nginx configuration
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/piplinepro << 'EOF'
server {
    listen 80;
    server_name 185.217.125.139;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/piplinepro /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Start services
echo "🚀 Starting services..."
systemctl daemon-reload
systemctl enable piplinepro
systemctl start piplinepro
systemctl restart nginx

# Show status
echo "📊 Service Status:"
systemctl status piplinepro --no-pager
systemctl status nginx --no-pager

echo ""
echo "✅ Basic deployment completed!"
echo "🌐 Visit: http://185.217.125.139"
echo ""
echo "📋 To upload your full PipLinePro application:"
echo "1. Upload piplinepro_deployment_20250901_155351.zip to /tmp/"
echo "2. Run: cd /opt/piplinepro && unzip /tmp/piplinepro_deployment_20250901_155351.zip"
echo "3. Run: ./deployment/deploy.sh"
echo ""
echo "🔧 Troubleshooting:"
echo "- Check logs: journalctl -u piplinepro -f"
echo "- Restart: systemctl restart piplinepro nginx"
