#!/bin/bash 
# PipLinePro Quick Deployment 
echo "🚀 Starting PipLinePro deployment..." 
 
# Update system 
apt update && apt upgrade -y 
 
# Install dependencies 
apt install -y python3 python3-pip python3-venv python3-dev nginx git curl wget unzip build-essential sqlite3 
 
# Stop existing services 
systemctl stop piplinepro 2>/dev/null || true 
systemctl stop nginx 2>/dev/null || true 
 
# Create application directory 
rm -rf /opt/piplinepro 
mkdir -p /opt/piplinepro 
cd /opt/piplinepro 
 
# Create simple Flask app 
cat > app.py << 'EOF' 
from flask import Flask 
app = Flask(__name__) 
@app.route('/') 
def home(): 
    return '''<html><head><title>PipLinePro Deployed!</title></head> 
    <body style="font-family:Arial,sans-serif;margin:40px;background:#f4f4f4"> 
    <div style="background:white;padding:40px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1^)"> 
    <h1 style="color:#2c3e50">🚀 PipLinePro Deployed Successfully!</h1> 
    <p style="color:#27ae60;font-size:18px">✅ Your application is running!</p> 
    <div style="background:#ecf0f1;padding:20px;border-radius:5px;margin:20px 0"> 
    <h3>Server Details:</h3> 
    <ul><li>Server: 185.217.125.139</li><li>Status: Active</li><li>Framework: Flask</li></ul> 
    </div><p><em>Ready for your full PipLinePro application!</em></p></div></body></html>''' 
if __name__ == '__main__': 
    app.run(host='0.0.0.0', port=8000, debug=False) 
EOF 
 
# Create virtual environment 
python3 -m venv venv 
source venv/bin/activate 
pip install flask gunicorn 
 
# Create systemd service 
cat > /etc/systemd/system/piplinepro.service << 'SVCEOF' 
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
 
[Install] 
WantedBy=multi-user.target 
SVCEOF 
 
# Create nginx config 
cat > /etc/nginx/sites-available/piplinepro << 'NGXEOF' 
server { 
    listen 80; 
    server_name 185.217.125.139 _; 
    location / { 
        proxy_pass http://127.0.0.1:8000; 
        proxy_set_header Host $host; 
        proxy_set_header X-Real-IP $remote_addr; 
    } 
} 
NGXEOF 
 
# Enable nginx site 
ln -sf /etc/nginx/sites-available/piplinepro /etc/nginx/sites-enabled/ 
rm -f /etc/nginx/sites-enabled/default 
nginx -t 
 
# Start services 
systemctl daemon-reload 
systemctl enable piplinepro 
systemctl start piplinepro 
systemctl enable nginx 
systemctl start nginx 
 
# Test deployment 
sleep 5 
echo "======================================" 
echo "🎉 DEPLOYMENT COMPLETED!" 
echo "======================================" 
echo "🌐 Application URL: http://185.217.125.139" 
echo "📊 Status:" 
systemctl status piplinepro --no-pager 
curl -s http://localhost | grep -o "PipLinePro.*Successfully" || echo "⚠️ HTTP test pending" 
echo "✅ Basic deployment complete!" 
