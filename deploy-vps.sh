#!/bin/bash

# WhizUnik Portal - VPS Deployment Script
# Run this script on your VPS after initial setup

echo "🚀 Starting WhizUnik Portal Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
sudo apt install nginx -y

# Install Git if not present
print_status "Installing Git..."
sudo apt install git -y

# Clone repository
print_status "Cloning WhizUnik Portal repository..."
cd /var/www
if [ -d "Whizunik-hub" ]; then
    print_warning "Repository already exists, pulling latest changes..."
    cd Whizunik-hub
    git pull origin main
else
    sudo git clone https://github.com/RamShrivastava3681/Whizunik-hub.git
    sudo chown -R $USER:$USER Whizunik-hub
    cd Whizunik-hub
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install --production

# Create uploads directory
mkdir -p uploads

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'whizunik-backend',
      script: 'server/index.cjs',
      cwd: '/var/www/Whizunik-hub/backend',
      env_production: {
        NODE_ENV: 'production',
        PORT: 80
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/whizunik-error.log',
      out_file: '/var/log/pm2/whizunik-out.log',
      log_file: '/var/log/pm2/whizunik-combined.log',
      time: true,
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Create production environment file template
print_status "Creating environment file template..."
cat > .env.production << 'EOF'
# Production Environment Configuration

# Database - UPDATE THIS WITH YOUR MONGODB URI
MONGODB_URI=mongodb+srv://emp-whizunik2025:whizunik-emp-portal876@whizunik.v4cet6v.mongodb.net/

# JWT Configuration - UPDATE THESE SECRETS
JWT_SECRET=5878b1b35bcdd625a002b10c55a40a2c4fffb641efe96b98fda59c5694618d9767fb8180d6ac6c5ceb0a7843b8ebeb8ec20febfe5213f5d98bfdeea3db3afe5b
JWT_REFRESH_SECRET=4f2b17cf4a3fe5bc0f733f0a82816faeb37090dfbb62d1916e2da84a92bded31736e2d42f0981fc04716dfc6c5757be851506d9611c7efdd009204a178f4ef84

# Server Configuration
PORT=80
CORS_ORIGIN=https://whizunikhub.com,http://whizunikhub.com,https://portal.whizunikhub.com,http://portal.whizunikhub.com,https://www.whizunikhub.com,http://www.portal.whizunikhub.com

# Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Node Environment
NODE_ENV=production

# Auth Configuration
BCRYPT_ROUNDS=12
TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Application Configuration
APP_NAME=WhizUnik Portal
APP_VERSION=1.0.0

# Email Configuration - UPDATE WITH YOUR EMAIL SETTINGS
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=infowhizunik@gmail.com
EMAIL_PASS=gbfc pfcb uhiv pipo
EOF

print_warning "Please edit .env.production file and update your credentials before starting the application!"

# Create Nginx configuration
print_status "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/whizunik-portal > /dev/null << 'EOF'
server {
    listen 80;
    server_name portal.whizunikhub.com;
    client_max_body_size 50M;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API endpoints - Direct proxy to backend on port 80
    location /api/ {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://whizunikhub.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # All other requests - proxy to backend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect www to non-www
server {
    listen 80;
    server_name www.portal.whizunikhub.com;
    return 301 http://portal.whizunikhub.com$request_uri;
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/whizunik-portal /etc/nginx/sites-enabled/

# Remove old config if exists
sudo rm -f /etc/nginx/sites-enabled/whizunik-backend

# Remove default Nginx site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
    sudo systemctl restart nginx
    sudo systemctl enable nginx
else
    print_error "Nginx configuration test failed!"
    exit 1
fi

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw --force enable

# Create update script
print_status "Creating update script..."
sudo tee /usr/local/bin/update-whizunik > /dev/null << 'EOF'
#!/bin/bash
echo "🔄 Updating WhizUnik Portal..."

cd /var/www/Whizunik-hub
git pull origin main

cd backend
npm install --production

# Restart PM2 process
pm2 restart whizunik-backend

echo "✅ Update completed!"
EOF

sudo chmod +x /usr/local/bin/update-whizunik

# Create start script
print_status "Creating start script..."
cat > /var/www/Whizunik-hub/backend/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting WhizUnik Portal Backend..."

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

echo "✅ Backend started successfully!"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs whizunik-backend"
EOF

chmod +x /var/www/Whizunik-hub/backend/start.sh

print_status "Deployment script completed successfully! 🎉"
echo ""
print_warning "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Edit /var/www/Whizunik-hub/backend/.env.production with your actual credentials"
echo "2. Run: cd /var/www/Whizunik-hub/backend && ./start.sh"
echo "3. Setup PM2 startup: pm2 startup (and follow the instructions)"
echo "4. Test the backend: curl http://your-server-ip/health"
echo ""
print_status "For SSL setup, run: sudo certbot --nginx"
print_status "To update application: update-whizunik"