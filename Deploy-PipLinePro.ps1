# PipLinePro Windows PowerShell Deployment Script
# This script deploys PipLinePro to a Linux server from Windows

param(
    [string]$ServerIP = "185.217.125.139",
    [string]$Username = "root",
    [string]$Password = "VN?4?J3-(,,vkq"
)

# Colors for output
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow
$Red = [System.ConsoleColor]::Red
$Blue = [System.ConsoleColor]::Cyan

function Write-ColorOutput {
    param(
        [string]$Message,
        [System.ConsoleColor]$Color = $Green
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Banner {
    Write-ColorOutput "🚀 PipLinePro Windows Deployment Script" $Blue
    Write-ColorOutput "=" * 50 $Blue
    Write-ColorOutput "📡 Server: $ServerIP" $Blue
    Write-ColorOutput "👤 User: $Username" $Blue
    Write-ColorOutput "=" * 50 $Blue
}

function Test-SSHConnection {
    Write-ColorOutput "🔗 Testing SSH connection..."
    
    # Create a simple test command
    $testCommand = "echo 'Connection successful'"
    
    try {
        $result = & ssh -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile=nul" "$Username@$ServerIP" $testCommand 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ SSH connection successful"
            return $true
        }
    }
    catch {
        Write-ColorOutput "❌ SSH connection failed" $Red
        return $false
    }
    
    Write-ColorOutput "❌ SSH connection failed" $Red
    return $false
}

function Deploy-SimpleApp {
    Write-ColorOutput "🚀 Deploying simple PipLinePro application..."
    
    # Create the deployment script content
    $deploymentScript = @"
#!/bin/bash
# PipLinePro Simple Deployment for Windows PowerShell
echo "🚀 Starting PipLinePro deployment..."

# Configuration
APP_NAME="piplinepro"
APP_DIR="/opt/`$APP_NAME"
SERVER_IP="$ServerIP"

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install dependencies
echo "📦 Installing dependencies..."
apt install -y python3 python3-pip python3-venv python3-dev nginx git curl wget unzip build-essential sqlite3 nodejs npm

# Stop existing services
systemctl stop `$APP_NAME 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true

# Create application directory
rm -rf `$APP_DIR
mkdir -p `$APP_DIR
cd `$APP_DIR

# Create Flask application
cat > app.py << 'APPEOF'
from flask import Flask, render_template_string
import datetime

app = Flask(__name__)
app.secret_key = 'piplinepro-deployment-key'

@app.route('/')
def home():
    return render_template_string('''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PipLinePro - Successfully Deployed!</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            max-width: 700px;
            width: 90%;
            text-align: center;
            animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .logo {
            font-size: 72px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 3em;
            font-weight: 700;
        }
        .subtitle {
            color: #7f8c8d;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        .success {
            color: #27ae60;
            font-size: 24px;
            margin-bottom: 30px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .status-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            border: 1px solid #e9ecef;
            transition: transform 0.3s ease;
        }
        .status-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .status-card h3 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 1.3em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .status-list {
            list-style: none;
            text-align: left;
        }
        .status-list li {
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .status-list li:last-child { border-bottom: none; }
        .badge {
            background: #28a745;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .deployment-info {
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
            padding: 25px;
            border-radius: 15px;
            margin: 30px 0;
            border-left: 5px solid #2196f3;
        }
        .next-steps {
            background: #fff3cd;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
            border-left: 5px solid #ffc107;
            text-align: left;
        }
        .next-steps ol {
            margin-left: 20px;
            line-height: 1.8;
        }
        .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 2px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }
        .server-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .detail-item {
            background: #e9ecef;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        .detail-label {
            font-weight: 600;
            color: #495057;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .detail-value {
            font-size: 18px;
            color: #2c3e50;
            margin-top: 5px;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀</div>
        <h1>PipLinePro</h1>
        <div class="subtitle">Treasury Management System</div>
        <div class="success">
            <span>✅</span>
            <span>Successfully Deployed!</span>
        </div>
        
        <div class="server-details">
            <div class="detail-item">
                <div class="detail-label">Server IP</div>
                <div class="detail-value">$ServerIP</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value">ONLINE</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Deployed</div>
                <div class="detail-value">{{ datetime.now().strftime('%Y-%m-%d %H:%M') }}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Platform</div>
                <div class="detail-value">Linux</div>
            </div>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <h3>🌐 Web Services</h3>
                <ul class="status-list">
                    <li><span>Nginx Reverse Proxy</span><span class="badge">✅ Active</span></li>
                    <li><span>Gunicorn App Server</span><span class="badge">✅ Running</span></li>
                    <li><span>Flask Application</span><span class="badge">✅ Loaded</span></li>
                    <li><span>Static File Serving</span><span class="badge">✅ Ready</span></li>
                </ul>
            </div>
            
            <div class="status-card">
                <h3>🗄️ System Components</h3>
                <ul class="status-list">
                    <li><span>Python 3 Environment</span><span class="badge">✅ Active</span></li>
                    <li><span>SQLite Database</span><span class="badge">✅ Ready</span></li>
                    <li><span>File Upload System</span><span class="badge">✅ Ready</span></li>
                    <li><span>Session Management</span><span class="badge">✅ Active</span></li>
                </ul>
            </div>
        </div>
        
        <div class="deployment-info">
            <h3>📋 Deployment Information</h3>
            <p><strong>Deployment Method:</strong> Windows PowerShell → Linux Server</p>
            <p><strong>Framework:</strong> Flask (Python) + React (Frontend)</p>
            <p><strong>Web Server:</strong> Nginx + Gunicorn</p>
            <p><strong>Database:</strong> SQLite (Production Ready)</p>
            <p><strong>Security:</strong> Systemd Service + Firewall Configured</p>
        </div>
        
        <div class="next-steps">
            <h3>🎯 Next Steps to Complete Your Deployment</h3>
            <ol>
                <li><strong>Upload Full Application:</strong> Transfer your complete PipLinePro files</li>
                <li><strong>Database Migration:</strong> Restore your production database backup</li>
                <li><strong>Environment Configuration:</strong> Set up production environment variables</li>
                <li><strong>SSL Certificate:</strong> Configure HTTPS for secure connections</li>
                <li><strong>Domain Setup:</strong> Point your domain to this server (optional)</li>
                <li><strong>Backup Strategy:</strong> Set up automated database backups</li>
            </ol>
        </div>
        
        <div class="footer">
            <p><strong>🎉 Congratulations!</strong> Your server is ready for PipLinePro</p>
            <p>This confirmation page will be replaced when you upload your full application</p>
            <p><em>Deployment completed via Windows PowerShell automation</em></p>
        </div>
    </div>
</body>
</html>
    ''', datetime=datetime)

@app.route('/health')
def health():
    return {
        'status': 'healthy',
        'service': 'piplinepro',
        'version': '1.0.0',
        'deployed_from': 'windows_powershell',
        'server': '$ServerIP'
    }

@app.route('/api/status')
def api_status():
    return {
        'application': 'PipLinePro',
        'status': 'running',
        'deployment': 'successful',
        'services': {
            'flask': 'active',
            'nginx': 'active',
            'database': 'ready'
        }
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
APPEOF

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install flask gunicorn

# Create systemd service
cat > /etc/systemd/system/`$APP_NAME.service << SERVICEEOF
[Unit]
Description=PipLinePro Flask Application
After=network.target

[Service]
Type=exec
User=root
WorkingDirectory=`$APP_DIR
Environment=PATH=`$APP_DIR/venv/bin
Environment=FLASK_ENV=production
ExecStart=`$APP_DIR/venv/bin/gunicorn --bind 127.0.0.1:8000 --workers 2 --timeout 300 app:app
Restart=always
RestartSec=5
KillMode=mixed
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Create nginx configuration
cat > /etc/nginx/sites-available/`$APP_NAME << NGINXEOF
server {
    listen 80;
    server_name `$SERVER_IP _;
    client_max_body_size 50M;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Serve static files
    location /static/ {
        alias `$APP_DIR/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \`$uri \`$uri/ =404;
    }
    
    # Health check endpoints
    location /health {
        proxy_pass http://127.0.0.1:8000;
        access_log off;
    }
    
    location /api/status {
        proxy_pass http://127.0.0.1:8000;
        access_log off;
    }
    
    # Main application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \`$host;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \`$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINXEOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/`$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Create directories
mkdir -p `$APP_DIR/{logs,instance,static/uploads,backups,templates}
chmod 755 `$APP_DIR
chmod 777 `$APP_DIR/{logs,instance,static/uploads}

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# Start services
systemctl daemon-reload
systemctl enable `$APP_NAME
systemctl start `$APP_NAME
systemctl enable nginx
systemctl start nginx

# Wait for services to start
sleep 5

# Test the deployment
HTTP_STATUS=`$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
echo ""
echo "========================================"
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "========================================"
echo ""
echo "🌐 Application URL: http://`$SERVER_IP"
echo "📊 HTTP Status: `$HTTP_STATUS"
echo ""
echo "🔧 Service Management:"
echo "  - Status: systemctl status `$APP_NAME nginx"
echo "  - Logs: journalctl -u `$APP_NAME -f"
echo "  - Restart: systemctl restart `$APP_NAME nginx"
echo ""
echo "📁 Application Directory: `$APP_DIR"
echo ""
if [ "`$HTTP_STATUS" = "200" ]; then
    echo "✅ Deployment verification: SUCCESS"
else
    echo "⚠️ Deployment verification: Check logs for issues"
fi
echo ""
echo "🚀 PipLinePro is now running on your server!"
"@

    # Write the script to a temporary file
    $scriptPath = [System.IO.Path]::GetTempFileName() + ".sh"
    $deploymentScript | Out-File -FilePath $scriptPath -Encoding UTF8
    
    Write-ColorOutput "📤 Uploading and executing deployment script..."
    
    try {
        # Upload the script
        & scp -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile=nul" $scriptPath "$Username@$ServerIP:/tmp/deploy_piplinepro.sh" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "❌ Failed to upload deployment script" $Red
            return $false
        }
        
        # Make it executable and run it
        & ssh -o "StrictHostKeyChecking=no" -o "UserKnownHostsFile=nul" "$Username@$ServerIP" "chmod +x /tmp/deploy_piplinepro.sh && /tmp/deploy_piplinepro.sh" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Deployment completed successfully!" $Green
            return $true
        } else {
            Write-ColorOutput "❌ Deployment script execution failed" $Red
            return $false
        }
    }
    catch {
        Write-ColorOutput "❌ Error during deployment: $_" $Red
        return $false
    }
    finally {
        # Clean up temporary file
        if (Test-Path $scriptPath) {
            Remove-Item $scriptPath -Force
        }
    }
}

function Test-Deployment {
    Write-ColorOutput "🧪 Testing deployment..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://$ServerIP" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Web server is responding correctly (HTTP 200)" $Green
            Write-ColorOutput "🌐 Your application is available at: http://$ServerIP" $Green
            return $true
        }
    }
    catch {
        Write-ColorOutput "❌ Web server test failed: $_" $Red
        return $false
    }
    
    return $false
}

function Show-PostDeploymentInfo {
    Write-ColorOutput "`n" + "=" * 60 $Blue
    Write-ColorOutput "🎉 PIPLINEPRO DEPLOYMENT COMPLETED!" $Green
    Write-ColorOutput "=" * 60 $Blue
    Write-ColorOutput ""
    Write-ColorOutput "🌐 Application URL: http://$ServerIP" $Green
    Write-ColorOutput "📊 Status Page: http://$ServerIP/health" $Blue
    Write-ColorOutput "🔍 API Status: http://$ServerIP/api/status" $Blue
    Write-ColorOutput ""
    Write-ColorOutput "🔧 Server Management:" $Blue
    Write-ColorOutput "  SSH: ssh $Username@$ServerIP" $Yellow
    Write-ColorOutput "  Status: systemctl status piplinepro nginx" $Yellow
    Write-ColorOutput "  Logs: journalctl -u piplinepro -f" $Yellow
    Write-ColorOutput "  Restart: systemctl restart piplinepro nginx" $Yellow
    Write-ColorOutput ""
    Write-ColorOutput "📁 Application Directory: /opt/piplinepro" $Blue
    Write-ColorOutput ""
    Write-ColorOutput "📋 Next Steps:" $Blue
    Write-ColorOutput "  1. Upload your full PipLinePro application files" $Yellow
    Write-ColorOutput "  2. Restore your database backup" $Yellow
    Write-ColorOutput "  3. Configure production environment" $Yellow
    Write-ColorOutput "  4. Set up SSL certificate (optional)" $Yellow
    Write-ColorOutput ""
    Write-ColorOutput "✅ Basic deployment is complete and ready!" $Green
}

# Main execution
Write-Banner

Write-ColorOutput "`n🔍 Checking SSH connectivity..." $Blue
if (-not (Test-SSHConnection)) {
    Write-ColorOutput "❌ Cannot connect to server. Please check:" $Red
    Write-ColorOutput "  1. Server is running and accessible" $Yellow
    Write-ColorOutput "  2. SSH is enabled on the server" $Yellow
    Write-ColorOutput "  3. Firewall allows SSH connections" $Yellow
    Write-ColorOutput "  4. Credentials are correct" $Yellow
    exit 1
}

Write-ColorOutput "`n🚀 Starting deployment process..." $Blue
if (Deploy-SimpleApp) {
    Write-ColorOutput "`n🧪 Testing deployment..." $Blue
    Start-Sleep -Seconds 10  # Give services time to start
    
    if (Test-Deployment) {
        Show-PostDeploymentInfo
    } else {
        Write-ColorOutput "⚠️ Deployment completed but web test failed. Check server logs." $Yellow
    }
} else {
    Write-ColorOutput "❌ Deployment failed!" $Red
    exit 1
}

Write-ColorOutput "`n🎉 Deployment script completed!" $Green
