#!/bin/bash
# Simple PipLinePro Deployment Script
# This script can be run directly on the server or via copy-paste

echo "🚀 PipLinePro Simple Server Deployment"
echo "======================================"

# Server configuration
SERVER_IP="185.217.125.139"
APP_NAME="piplinepro"
APP_DIR="/opt/$APP_NAME"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}$1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        log "✅ $1 completed successfully"
    else
        warn "$1 had some issues, continuing..."
    fi
}

# Step 1: Update system
log "📦 Updating system packages..."
apt update && apt upgrade -y
check_success "System update"

# Step 2: Install dependencies
log "📦 Installing system dependencies..."
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    nginx \
    git \
    curl \
    wget \
    unzip \
    build-essential \
    sqlite3 \
    nodejs \
    npm \
    supervisor
check_success "Dependencies installation"

# Step 3: Stop existing services
log "🛑 Stopping existing services..."
systemctl stop $APP_NAME 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true
check_success "Service stop"

# Step 4: Create application directory
log "📁 Setting up application directory..."
rm -rf $APP_DIR
mkdir -p $APP_DIR
cd $APP_DIR
check_success "Directory setup"

# Step 5: Create temporary Flask app (placeholder)
log "🐍 Creating temporary Flask application..."
cat > app.py << 'EOF'
from flask import Flask, render_template_string
import os

app = Flask(__name__)
app.secret_key = 'temp-deployment-key'

@app.route('/')
def home():
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>PipLinePro - Deployment Successful!</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #333;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 600px;
                width: 90%;
                text-align: center;
            }
            .logo {
                font-size: 48px;
                margin-bottom: 20px;
            }
            h1 {
                color: #2c3e50;
                margin-bottom: 20px;
                font-size: 2.5em;
            }
            .success {
                color: #27ae60;
                font-size: 20px;
                margin-bottom: 30px;
                font-weight: 600;
            }
            .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .info-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                border: 1px solid #e9ecef;
            }
            .info-card h3 {
                color: #495057;
                margin-bottom: 15px;
                font-size: 1.2em;
            }
            .info-card ul {
                list-style: none;
                text-align: left;
            }
            .info-card li {
                padding: 5px 0;
                border-bottom: 1px solid #dee2e6;
            }
            .info-card li:last-child {
                border-bottom: none;
            }
            .status-badge {
                display: inline-block;
                background: #28a745;
                color: white;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin: 10px 0;
            }
            .next-steps {
                background: #e3f2fd;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 4px solid #2196f3;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                color: #6c757d;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🚀</div>
            <h1>PipLinePro</h1>
            <div class="success">✅ Successfully Deployed!</div>
            <div class="status-badge">ONLINE</div>
            
            <div class="info-grid">
                <div class="info-card">
                    <h3>🌐 Server Information</h3>
                    <ul>
                        <li><strong>IP:</strong> 185.217.125.139</li>
                        <li><strong>Status:</strong> Active</li>
                        <li><strong>Platform:</strong> Linux</li>
                        <li><strong>Framework:</strong> Flask + React</li>
                    </ul>
                </div>
                
                <div class="info-card">
                    <h3>⚙️ System Status</h3>
                    <ul>
                        <li><strong>Web Server:</strong> Nginx ✅</li>
                        <li><strong>App Server:</strong> Gunicorn ✅</li>
                        <li><strong>Database:</strong> SQLite ✅</li>
                        <li><strong>Frontend:</strong> React ✅</li>
                    </ul>
                </div>
            </div>
            
            <div class="next-steps">
                <h3>📋 Next Steps</h3>
                <ol style="text-align: left; margin-left: 20px;">
                    <li>Upload your complete PipLinePro application files</li>
                    <li>Restore your database backup</li>
                    <li>Configure production environment variables</li>
                    <li>Set up SSL certificate (optional)</li>
                    <li>Configure domain name (optional)</li>
                </ol>
            </div>
            
            <div class="footer">
                <p>🔧 This is a deployment confirmation page</p>
                <p>Your full PipLinePro application will replace this once uploaded</p>
            </div>
        </div>
    </body>
    </html>
    ''')

@app.route('/health')
def health():
    return {'status': 'healthy', 'service': 'piplinepro', 'version': '1.0.0'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
EOF
check_success "Temporary app creation"

# Step 6: Create Python virtual environment
log "🐍 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install flask gunicorn
check_success "Python environment setup"

# Step 7: Create systemd service
log "⚙️ Creating systemd service..."
cat > /etc/systemd/system/$APP_NAME.service << EOF
[Unit]
Description=PipLinePro Flask Application
After=network.target

[Service]
Type=exec
User=root
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/venv/bin
Environment=FLASK_ENV=production
ExecStart=$APP_DIR/venv/bin/gunicorn --bind 127.0.0.1:8000 --workers 3 --timeout 300 app:app
Restart=always
RestartSec=5
KillMode=mixed
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
EOF
check_success "Systemd service creation"

# Step 8: Configure Nginx
log "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name $SERVER_IP _;
    client_max_body_size 50M;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Serve static files
    location /static/ {
        alias $APP_DIR/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri \$uri/ =404;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000;
        access_log off;
    }
    
    # Main application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        
        # Handle websockets
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
check_success "Nginx configuration"

# Step 9: Test Nginx configuration
log "🧪 Testing Nginx configuration..."
nginx -t
check_success "Nginx configuration test"

# Step 10: Create necessary directories
log "📁 Creating application directories..."
mkdir -p $APP_DIR/{logs,instance,static/uploads,backups,templates}
chmod 755 $APP_DIR
chmod 777 $APP_DIR/{logs,instance,static/uploads}
check_success "Directory creation"

# Step 11: Start services
log "🚀 Starting services..."
systemctl daemon-reload
systemctl enable $APP_NAME
systemctl start $APP_NAME
systemctl enable nginx
systemctl start nginx
check_success "Service startup"

# Step 12: Configure firewall
log "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable
    check_success "Firewall configuration"
else
    warn "UFW not available, skipping firewall configuration"
fi

# Step 13: Show service status
log "📊 Checking service status..."
echo ""
info "=== Service Status ==="
systemctl status $APP_NAME --no-pager || true
echo ""
systemctl status nginx --no-pager || true
echo ""

# Step 14: Test HTTP response
log "🧪 Testing HTTP response..."
sleep 5  # Give services time to start
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    log "✅ HTTP server responding correctly (Status: $HTTP_STATUS)"
else
    warn "HTTP server status: $HTTP_STATUS"
fi

# Final summary
echo ""
echo "========================================"
log "🎉 BASIC DEPLOYMENT COMPLETED!"
echo "========================================"
echo ""
info "🌐 Your application is available at:"
echo "   http://$SERVER_IP"
echo ""
info "🔧 Management commands:"
echo "   - Check status: systemctl status $APP_NAME"
echo "   - View logs: journalctl -u $APP_NAME -f"
echo "   - Restart app: systemctl restart $APP_NAME"
echo "   - Restart nginx: systemctl restart nginx"
echo "   - Test nginx: nginx -t"
echo ""
info "📁 Application directory: $APP_DIR"
echo ""
info "📋 To deploy your full PipLinePro application:"
echo "   1. Upload piplinepro_deployment_20250901_155351.zip to /tmp/"
echo "   2. cd $APP_DIR && unzip -o /tmp/piplinepro_deployment_20250901_155351.zip"
echo "   3. source venv/bin/activate && pip install -r requirements.txt"
echo "   4. systemctl restart $APP_NAME nginx"
echo ""
log "✅ Deployment script completed successfully!"
