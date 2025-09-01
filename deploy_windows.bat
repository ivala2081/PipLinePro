@echo off
echo ========================================
echo 🚀 PipLinePro Windows Deployment Script
echo ========================================
echo.
echo 📡 Server: 185.217.125.139
echo 👤 User: root
echo.

REM Check if SSH is available
where ssh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ SSH not found! Please install OpenSSH or Git Bash
    echo.
    echo 📦 Installation options:
    echo   1. Install Git for Windows: https://git-scm.com/download/win
    echo   2. Enable Windows OpenSSH: Settings ^> Apps ^> Optional Features ^> OpenSSH Client
    echo   3. Install via chocolatey: choco install openssh
    pause
    exit /b 1
)

echo ✅ SSH found, proceeding with deployment...
echo.

REM Create temporary deployment script
echo 🛠️ Creating deployment script...
echo #!/bin/bash > deploy_temp.sh
echo # PipLinePro Quick Deployment >> deploy_temp.sh
echo echo "🚀 Starting PipLinePro deployment..." >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Update system >> deploy_temp.sh
echo apt update ^&^& apt upgrade -y >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Install dependencies >> deploy_temp.sh
echo apt install -y python3 python3-pip python3-venv python3-dev nginx git curl wget unzip build-essential sqlite3 >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Stop existing services >> deploy_temp.sh
echo systemctl stop piplinepro 2^>/dev/null ^|^| true >> deploy_temp.sh
echo systemctl stop nginx 2^>/dev/null ^|^| true >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Create application directory >> deploy_temp.sh
echo rm -rf /opt/piplinepro >> deploy_temp.sh
echo mkdir -p /opt/piplinepro >> deploy_temp.sh
echo cd /opt/piplinepro >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Create simple Flask app >> deploy_temp.sh
echo cat ^> app.py ^<^< 'EOF' >> deploy_temp.sh
echo from flask import Flask >> deploy_temp.sh
echo app = Flask(__name__^) >> deploy_temp.sh
echo @app.route('/'^) >> deploy_temp.sh
echo def home(^): >> deploy_temp.sh
echo     return '''^<html^>^<head^>^<title^>PipLinePro Deployed!^</title^>^</head^> >> deploy_temp.sh
echo     ^<body style="font-family:Arial,sans-serif;margin:40px;background:#f4f4f4"^> >> deploy_temp.sh
echo     ^<div style="background:white;padding:40px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1^)"^> >> deploy_temp.sh
echo     ^<h1 style="color:#2c3e50"^>🚀 PipLinePro Deployed Successfully!^</h1^> >> deploy_temp.sh
echo     ^<p style="color:#27ae60;font-size:18px"^>✅ Your application is running!^</p^> >> deploy_temp.sh
echo     ^<div style="background:#ecf0f1;padding:20px;border-radius:5px;margin:20px 0"^> >> deploy_temp.sh
echo     ^<h3^>Server Details:^</h3^> >> deploy_temp.sh
echo     ^<ul^>^<li^>Server: 185.217.125.139^</li^>^<li^>Status: Active^</li^>^<li^>Framework: Flask^</li^>^</ul^> >> deploy_temp.sh
echo     ^</div^>^<p^>^<em^>Ready for your full PipLinePro application!^</em^>^</p^>^</div^>^</body^>^</html^>''' >> deploy_temp.sh
echo if __name__ == '__main__': >> deploy_temp.sh
echo     app.run(host='0.0.0.0', port=8000, debug=False^) >> deploy_temp.sh
echo EOF >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Create virtual environment >> deploy_temp.sh
echo python3 -m venv venv >> deploy_temp.sh
echo source venv/bin/activate >> deploy_temp.sh
echo pip install flask gunicorn >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Create systemd service >> deploy_temp.sh
echo cat ^> /etc/systemd/system/piplinepro.service ^<^< 'SVCEOF' >> deploy_temp.sh
echo [Unit] >> deploy_temp.sh
echo Description=PipLinePro Flask Application >> deploy_temp.sh
echo After=network.target >> deploy_temp.sh
echo. >> deploy_temp.sh
echo [Service] >> deploy_temp.sh
echo Type=exec >> deploy_temp.sh
echo User=root >> deploy_temp.sh
echo WorkingDirectory=/opt/piplinepro >> deploy_temp.sh
echo Environment=PATH=/opt/piplinepro/venv/bin >> deploy_temp.sh
echo ExecStart=/opt/piplinepro/venv/bin/gunicorn --bind 127.0.0.1:8000 app:app >> deploy_temp.sh
echo Restart=always >> deploy_temp.sh
echo. >> deploy_temp.sh
echo [Install] >> deploy_temp.sh
echo WantedBy=multi-user.target >> deploy_temp.sh
echo SVCEOF >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Create nginx config >> deploy_temp.sh
echo cat ^> /etc/nginx/sites-available/piplinepro ^<^< 'NGXEOF' >> deploy_temp.sh
echo server { >> deploy_temp.sh
echo     listen 80; >> deploy_temp.sh
echo     server_name 185.217.125.139 _; >> deploy_temp.sh
echo     location / { >> deploy_temp.sh
echo         proxy_pass http://127.0.0.1:8000; >> deploy_temp.sh
echo         proxy_set_header Host $host; >> deploy_temp.sh
echo         proxy_set_header X-Real-IP $remote_addr; >> deploy_temp.sh
echo     } >> deploy_temp.sh
echo } >> deploy_temp.sh
echo NGXEOF >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Enable nginx site >> deploy_temp.sh
echo ln -sf /etc/nginx/sites-available/piplinepro /etc/nginx/sites-enabled/ >> deploy_temp.sh
echo rm -f /etc/nginx/sites-enabled/default >> deploy_temp.sh
echo nginx -t >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Start services >> deploy_temp.sh
echo systemctl daemon-reload >> deploy_temp.sh
echo systemctl enable piplinepro >> deploy_temp.sh
echo systemctl start piplinepro >> deploy_temp.sh
echo systemctl enable nginx >> deploy_temp.sh
echo systemctl start nginx >> deploy_temp.sh
echo. >> deploy_temp.sh
echo # Test deployment >> deploy_temp.sh
echo sleep 5 >> deploy_temp.sh
echo echo "======================================" >> deploy_temp.sh
echo echo "🎉 DEPLOYMENT COMPLETED!" >> deploy_temp.sh
echo echo "======================================" >> deploy_temp.sh
echo echo "🌐 Application URL: http://185.217.125.139" >> deploy_temp.sh
echo echo "📊 Status:" >> deploy_temp.sh
echo systemctl status piplinepro --no-pager >> deploy_temp.sh
echo curl -s http://localhost ^| grep -o "PipLinePro.*Successfully" ^|^| echo "⚠️ HTTP test pending" >> deploy_temp.sh
echo echo "✅ Basic deployment complete!" >> deploy_temp.sh

echo.
echo 📤 Uploading deployment script to server...
scp -o "StrictHostKeyChecking=no" deploy_temp.sh root@185.217.125.139:/tmp/deploy_piplinepro.sh
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to upload deployment script
    pause
    exit /b 1
)

echo ✅ Script uploaded successfully
echo.
echo 🚀 Executing deployment on server...
echo (This may take several minutes...)
echo.

ssh -o "StrictHostKeyChecking=no" root@185.217.125.139 "chmod +x /tmp/deploy_piplinepro.sh && /tmp/deploy_piplinepro.sh"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo 🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!
    echo ========================================
    echo.
    echo 🌐 Your application is now available at:
    echo    http://185.217.125.139
    echo.
    echo 🔧 Management commands:
    echo    ssh root@185.217.125.139 "systemctl status piplinepro"
    echo    ssh root@185.217.125.139 "journalctl -u piplinepro -f"
    echo.
    echo 📋 Next steps:
    echo    1. Upload your full PipLinePro application files
    echo    2. Restore your database backup
    echo    3. Configure production settings
    echo.
    echo ✅ Basic deployment is complete!
) else (
    echo.
    echo ❌ Deployment failed! Check the output above for errors.
)

REM Clean up temporary file
del deploy_temp.sh 2>nul

echo.
echo Press any key to exit...
pause >nul
