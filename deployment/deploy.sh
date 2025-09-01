#!/bin/bash
# PipLinePro Deployment Script
# This script deploys the application to a clean Linux server

set -e  # Exit on any error

# Configuration
APP_NAME="piplinepro"
APP_DIR="/opt/$APP_NAME"
APP_USER="pipline"
PYTHON_VERSION="3.11"

echo "🚀 Starting PipLinePro deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install system dependencies
echo "📦 Installing system dependencies..."
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    nginx \
    supervisor \
    git \
    curl \
    wget \
    unzip \
    build-essential \
    pkg-config \
    sqlite3 \
    libsqlite3-dev

# Create application user
echo "👤 Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash $APP_USER
    echo "User $APP_USER created successfully"
else
    echo "User $APP_USER already exists"
fi

# Create application directory
echo "📁 Creating application directory..."
mkdir -p $APP_DIR
chown $APP_USER:$APP_USER $APP_DIR

# Set up Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd $APP_DIR
sudo -u $APP_USER python3 -m venv venv
sudo -u $APP_USER $APP_DIR/venv/bin/pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."
sudo -u $APP_USER $APP_DIR/venv/bin/pip install -r deployment/production_requirements.txt

# Create necessary directories
echo "📁 Creating application directories..."
sudo -u $APP_USER mkdir -p $APP_DIR/{logs,instance,static/uploads,backups}

# Set up database
echo "🗄️ Setting up database..."
sudo -u $APP_USER $APP_DIR/venv/bin/python -c "
from app import create_app
from app.models import db
app = create_app('deployment.production_config.ProductionConfig')
with app.app_context():
    db.create_all()
    print('Database tables created successfully')
"

# Configure Nginx
echo "🌐 Configuring Nginx..."
cp deployment/nginx_config.conf /etc/nginx/sites-available/$APP_NAME
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # Remove default site
nginx -t  # Test configuration
systemctl restart nginx
systemctl enable nginx

# Configure systemd service
echo "⚙️ Configuring systemd service..."
cp deployment/systemd_service.conf /etc/systemd/system/$APP_NAME.service
systemctl daemon-reload
systemctl enable $APP_NAME

# Set proper permissions
echo "🔒 Setting permissions..."
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 777 $APP_DIR/logs
chmod -R 777 $APP_DIR/instance
chmod -R 777 $APP_DIR/static/uploads

# Start services
echo "🚀 Starting services..."
systemctl start $APP_NAME
systemctl status $APP_NAME --no-pager

# Configure firewall (if UFW is available)
if command -v ufw &> /dev/null; then
    echo "🔥 Configuring firewall..."
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    # ufw --force enable  # Uncomment if you want to enable firewall
fi

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at: http://185.217.125.139"
echo "📊 Check status with: systemctl status $APP_NAME"
echo "📝 View logs with: journalctl -u $APP_NAME -f"
