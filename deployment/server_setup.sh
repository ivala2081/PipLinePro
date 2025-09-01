#!/bin/bash
# Server Setup Script for PipLinePro
# This script prepares a clean Linux server for deployment

set -e  # Exit on any error

echo "🧹 Cleaning and preparing Linux server for PipLinePro deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="piplinepro"
APP_DIR="/opt/$APP_NAME"
APP_USER="pipline"

echo -e "${YELLOW}🛑 WARNING: This will clean the server and remove existing installations!${NC}"
echo -e "${YELLOW}Press Enter to continue or Ctrl+C to cancel...${NC}"
read

# Stop and remove existing services
echo -e "${GREEN}🛑 Stopping existing services...${NC}"
systemctl stop $APP_NAME 2>/dev/null || echo "Service $APP_NAME not running"
systemctl stop nginx 2>/dev/null || echo "Nginx not running"

# Remove existing application
echo -e "${GREEN}🗑️ Removing existing application...${NC}"
rm -rf $APP_DIR
userdel -r $APP_USER 2>/dev/null || echo "User $APP_USER doesn't exist"

# Remove existing nginx configuration
echo -e "${GREEN}🌐 Cleaning Nginx configuration...${NC}"
rm -f /etc/nginx/sites-available/$APP_NAME
rm -f /etc/nginx/sites-enabled/$APP_NAME
rm -f /etc/systemd/system/$APP_NAME.service

# Clean package cache
echo -e "${GREEN}📦 Cleaning package cache...${NC}"
apt clean
apt autoclean
apt autoremove -y

# Update system
echo -e "${GREEN}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install basic dependencies
echo -e "${GREEN}📦 Installing basic dependencies...${NC}"
apt install -y \
    curl \
    wget \
    unzip \
    git \
    htop \
    nano \
    vim \
    tree \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Python 3 and related packages
echo -e "${GREEN}🐍 Installing Python 3 and development tools...${NC}"
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    python3-setuptools \
    python3-wheel \
    build-essential \
    pkg-config

# Install web server components
echo -e "${GREEN}🌐 Installing web server components...${NC}"
apt install -y \
    nginx \
    supervisor

# Install database tools
echo -e "${GREEN}🗄️ Installing database tools...${NC}"
apt install -y \
    sqlite3 \
    libsqlite3-dev

# Install additional useful tools
echo -e "${GREEN}🔧 Installing additional tools...${NC}"
apt install -y \
    ufw \
    fail2ban \
    logrotate \
    rsync \
    screen \
    tmux

# Configure basic firewall
echo -e "${GREEN}🔥 Configuring basic firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable

# Configure fail2ban for basic security
echo -e "${GREEN}🛡️ Configuring fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

# Clean up
echo -e "${GREEN}🧹 Final cleanup...${NC}"
apt autoremove -y
apt autoclean

# Create swap file if not exists (for small servers)
if [ ! -f /swapfile ]; then
    echo -e "${GREEN}💾 Creating swap file...${NC}"
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

# Set timezone to UTC
echo -e "${GREEN}🕐 Setting timezone to UTC...${NC}"
timedatectl set-timezone UTC

# Show system info
echo -e "${GREEN}📊 System Information:${NC}"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Python: $(python3 --version)"
echo "Nginx: $(nginx -v 2>&1)"
echo "Available Memory: $(free -h | grep '^Mem:' | awk '{print $7}')"
echo "Available Disk: $(df -h / | awk 'NR==2{print $4}')"

echo -e "${GREEN}✅ Server preparation completed successfully!${NC}"
echo -e "${GREEN}🚀 Server is now ready for PipLinePro deployment${NC}"
echo -e "${YELLOW}📝 Next step: Upload your application files and run deploy.sh${NC}"
