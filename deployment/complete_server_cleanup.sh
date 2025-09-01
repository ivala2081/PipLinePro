#!/bin/bash
# Complete Linux Server Cleanup Script for PipLinePro
# WARNING: This script will remove ALL existing applications and reset the server
# Use with extreme caution - this is destructive!

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                    ⚠️  DANGER ZONE ⚠️                       ║${NC}"
echo -e "${RED}║          COMPLETE LINUX SERVER CLEANUP SCRIPT              ║${NC}"
echo -e "${RED}║                                                              ║${NC}"
echo -e "${RED}║  This script will COMPLETELY RESET your server!             ║${NC}"
echo -e "${RED}║  - Remove ALL applications in /opt/                         ║${NC}"
echo -e "${RED}║  - Delete ALL web server configurations                     ║${NC}"
echo -e "${RED}║  - Remove ALL systemd services                              ║${NC}"
echo -e "${RED}║  - Clean ALL user data and logs                             ║${NC}"
echo -e "${RED}║  - Reset firewall rules                                     ║${NC}"
echo -e "${RED}║                                                              ║${NC}"
echo -e "${RED}║  THIS CANNOT BE UNDONE!                                     ║${NC}"
echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${YELLOW}Server Information:${NC}"
echo "Hostname: $(hostname)"
echo "IP Address: $(hostname -I | awk '{print $1}')"
echo "OS: $(lsb_release -d | cut -f2 2>/dev/null || echo 'Unknown')"
echo "Uptime: $(uptime -p 2>/dev/null || uptime)"
echo ""

echo -e "${RED}Type 'DESTROY' (in uppercase) to continue with complete cleanup:${NC}"
read -r confirmation

if [ "$confirmation" != "DESTROY" ]; then
    echo -e "${GREEN}✅ Cleanup cancelled. Server is safe.${NC}"
    exit 0
fi

echo ""
echo -e "${RED}Final confirmation: Type 'YES I WANT TO DESTROY EVERYTHING':${NC}"
read -r final_confirmation

if [ "$final_confirmation" != "YES I WANT TO DESTROY EVERYTHING" ]; then
    echo -e "${GREEN}✅ Cleanup cancelled. Server is safe.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🚨 Starting COMPLETE server cleanup in 5 seconds...${NC}"
echo -e "${YELLOW}Press Ctrl+C NOW to cancel!${NC}"
sleep 5

echo -e "${RED}🗑️ BEGINNING DESTRUCTIVE CLEANUP...${NC}"

# 1. Stop all custom services
echo -e "${BLUE}1. Stopping all custom services...${NC}"
systemctl stop piplinepro 2>/dev/null || echo "piplinepro service not found"
systemctl stop nginx 2>/dev/null || echo "nginx not running"
systemctl stop apache2 2>/dev/null || echo "apache2 not running"
systemctl stop redis-server 2>/dev/null || echo "redis not running"
systemctl stop postgresql 2>/dev/null || echo "postgresql not running"
systemctl stop mysql 2>/dev/null || echo "mysql not running"
systemctl stop fail2ban 2>/dev/null || echo "fail2ban not running"

# 2. Remove all applications from /opt/
echo -e "${BLUE}2. Removing ALL applications from /opt/...${NC}"
rm -rf /opt/*
echo "✅ /opt/ directory cleaned"

# 3. Remove all custom users
echo -e "${BLUE}3. Removing custom application users...${NC}"
users_to_remove=("pipline" "webapp" "deploy" "app" "www-data")
for user in "${users_to_remove[@]}"; do
    if id "$user" &>/dev/null; then
        userdel -r "$user" 2>/dev/null && echo "✅ Removed user: $user" || echo "⚠️ Could not remove user: $user"
    fi
done

# 4. Remove systemd services
echo -e "${BLUE}4. Removing ALL custom systemd services...${NC}"
services_to_remove=("piplinepro" "webapp" "flask-app" "django-app" "node-app")
for service in "${services_to_remove[@]}"; do
    if systemctl list-unit-files | grep -q "^$service.service"; then
        systemctl stop "$service" 2>/dev/null
        systemctl disable "$service" 2>/dev/null
        rm -f "/etc/systemd/system/$service.service"
        echo "✅ Removed service: $service"
    fi
done
systemctl daemon-reload

# 5. Clean Nginx configuration
echo -e "${BLUE}5. Cleaning Nginx configuration...${NC}"
rm -f /etc/nginx/sites-available/piplinepro
rm -f /etc/nginx/sites-available/webapp
rm -f /etc/nginx/sites-available/app
rm -f /etc/nginx/sites-enabled/piplinepro
rm -f /etc/nginx/sites-enabled/webapp
rm -f /etc/nginx/sites-enabled/app
# Restore default nginx site
if [ -f /etc/nginx/sites-available/default ]; then
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
fi
echo "✅ Nginx configuration cleaned"

# 6. Clean Apache configuration (if exists)
echo -e "${BLUE}6. Cleaning Apache configuration...${NC}"
if [ -d /etc/apache2/sites-available ]; then
    rm -f /etc/apache2/sites-available/piplinepro*
    rm -f /etc/apache2/sites-available/webapp*
    rm -f /etc/apache2/sites-available/app*
    rm -f /etc/apache2/sites-enabled/piplinepro*
    rm -f /etc/apache2/sites-enabled/webapp*
    rm -f /etc/apache2/sites-enabled/app*
    echo "✅ Apache configuration cleaned"
fi

# 7. Clean databases
echo -e "${BLUE}7. Cleaning databases...${NC}"
# Remove PostgreSQL databases
if command -v psql &> /dev/null; then
    sudo -u postgres dropdb piplinepro 2>/dev/null || echo "No piplinepro PostgreSQL database"
    sudo -u postgres dropdb webapp 2>/dev/null || echo "No webapp PostgreSQL database"
fi
# Remove MySQL databases
if command -v mysql &> /dev/null; then
    mysql -e "DROP DATABASE IF EXISTS piplinepro;" 2>/dev/null || echo "No piplinepro MySQL database"
    mysql -e "DROP DATABASE IF EXISTS webapp;" 2>/dev/null || echo "No webapp MySQL database"
fi
echo "✅ Database cleanup completed"

# 8. Clean logs
echo -e "${BLUE}8. Cleaning application logs...${NC}"
rm -rf /var/log/piplinepro*
rm -rf /var/log/webapp*
rm -rf /var/log/gunicorn*
rm -rf /var/log/uwsgi*
rm -rf /var/log/supervisor/piplinepro*
rm -rf /var/log/supervisor/webapp*
# Clean nginx logs
> /var/log/nginx/access.log
> /var/log/nginx/error.log
echo "✅ Application logs cleaned"

# 9. Clean temporary files
echo -e "${BLUE}9. Cleaning temporary files...${NC}"
rm -rf /tmp/piplinepro*
rm -rf /tmp/webapp*
rm -rf /tmp/*.zip
rm -rf /tmp/*.tar.gz
rm -rf /tmp/deployment*
echo "✅ Temporary files cleaned"

# 10. Clean supervisor configuration
echo -e "${BLUE}10. Cleaning supervisor configuration...${NC}"
rm -f /etc/supervisor/conf.d/piplinepro*
rm -f /etc/supervisor/conf.d/webapp*
if command -v supervisorctl &> /dev/null; then
    supervisorctl reload 2>/dev/null || echo "Supervisor not running"
fi
echo "✅ Supervisor configuration cleaned"

# 11. Reset firewall rules
echo -e "${BLUE}11. Resetting firewall rules...${NC}"
if command -v ufw &> /dev/null; then
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    echo "✅ UFW firewall reset"
fi

# 12. Clean package cache and unused packages
echo -e "${BLUE}12. Cleaning package cache...${NC}"
apt autoremove -y
apt autoclean
apt clean
echo "✅ Package cache cleaned"

# 13. Clean home directories
echo -e "${BLUE}13. Cleaning leftover home directories...${NC}"
rm -rf /home/pipline
rm -rf /home/webapp
rm -rf /home/deploy
rm -rf /home/app
echo "✅ Home directories cleaned"

# 14. Clean cron jobs
echo -e "${BLUE}14. Cleaning cron jobs...${NC}"
# Remove application-related cron jobs
crontab -l 2>/dev/null | grep -v piplinepro | grep -v webapp | crontab - 2>/dev/null || echo "No cron jobs to clean"
echo "✅ Cron jobs cleaned"

# 15. Clean SSL certificates
echo -e "${BLUE}15. Cleaning SSL certificates...${NC}"
rm -rf /etc/letsencrypt/live/piplinepro*
rm -rf /etc/letsencrypt/live/webapp*
rm -rf /etc/ssl/certs/piplinepro*
rm -rf /etc/ssl/private/piplinepro*
echo "✅ SSL certificates cleaned"

# 16. Reset system limits and configurations
echo -e "${BLUE}16. Resetting system configurations...${NC}"
# Remove custom configurations
rm -f /etc/security/limits.d/piplinepro*
rm -f /etc/security/limits.d/webapp*
rm -f /etc/sysctl.d/99-piplinepro*
echo "✅ System configurations reset"

# 17. Clean Docker (if exists)
echo -e "${BLUE}17. Cleaning Docker containers and images...${NC}"
if command -v docker &> /dev/null; then
    docker stop $(docker ps -aq) 2>/dev/null || echo "No running containers"
    docker rm $(docker ps -aq) 2>/dev/null || echo "No containers to remove"
    docker rmi $(docker images -q) 2>/dev/null || echo "No images to remove"
    docker system prune -af 2>/dev/null || echo "Docker cleanup completed"
    echo "✅ Docker cleaned"
fi

# 18. Final system update
echo -e "${BLUE}18. Updating system packages...${NC}"
apt update
apt upgrade -y
echo "✅ System updated"

# 19. Display final status
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  ✅ CLEANUP COMPLETED ✅                     ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  Your server has been completely reset and cleaned:         ║${NC}"
echo -e "${GREEN}║  ✅ All applications removed                                 ║${NC}"
echo -e "${GREEN}║  ✅ All configurations cleaned                               ║${NC}"
echo -e "${GREEN}║  ✅ All users and services removed                          ║${NC}"
echo -e "${GREEN}║  ✅ System packages updated                                  ║${NC}"
echo -e "${GREEN}║  ✅ Server is ready for fresh deployment                    ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║  You can now proceed with PipLinePro deployment!            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${YELLOW}📊 Server Status After Cleanup:${NC}"
echo "Available Disk Space: $(df -h / | awk 'NR==2{print $4}')"
echo "Available Memory: $(free -h | grep '^Mem:' | awk '{print $7}')"
echo "System Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "Active Services: $(systemctl list-units --type=service --state=active | wc -l) services running"

echo ""
echo -e "${GREEN}🚀 Your server is now completely clean and ready for deployment!${NC}"
echo -e "${BLUE}Next step: Upload and run your PipLinePro deployment package.${NC}"
