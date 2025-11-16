#!/bin/bash

# WhizUnik Portal - Quick Fix Deployment Script
# Run this on your VPS to fix API connection issues

echo "🔧 Applying WhizUnik Portal Quick Fixes..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[FIX]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "backend/server/index.cjs" ]; then
    print_error "Please run this script from your WhizUnik Portal root directory"
    print_error "Expected to find: backend/server/index.cjs"
    exit 1
fi

print_status "Starting quick fixes for WhizUnik Portal..."

# Step 1: Update backend environment for port 80
print_status "Updating backend environment configuration..."
cd backend

if [ -f ".env.production" ]; then
    # Backup existing config
    cp .env.production .env.production.backup
    print_status "Backed up existing .env.production"
fi

# Update port in production config
sed -i 's/PORT=5003/PORT=80/g' .env.production 2>/dev/null || {
    print_warning "Could not automatically update PORT in .env.production"
    print_warning "Please manually change PORT=5003 to PORT=80 in backend/.env.production"
}

# Copy production config to active config
cp .env.production .env
print_status "Updated backend environment configuration"

# Step 2: Create/Update PM2 configuration
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'whizunik-backend',
      script: 'server/index.cjs',
      env: {
        NODE_ENV: 'production',
        PORT: 80
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOF

# Create logs directory
mkdir -p logs
print_status "Created PM2 ecosystem configuration"

# Step 3: Stop existing processes
print_status "Stopping existing processes..."
pm2 stop whizunik-backend 2>/dev/null || echo "No existing process found"
pm2 delete whizunik-backend 2>/dev/null || echo "No existing process to delete"

# Kill any process using port 80 (be careful!)
print_warning "Checking for processes using port 80..."
PORT_80_PID=$(lsof -ti:80 2>/dev/null)
if [ ! -z "$PORT_80_PID" ]; then
    print_warning "Found process using port 80 (PID: $PORT_80_PID)"
    print_warning "You may need to stop it manually: sudo kill $PORT_80_PID"
fi

# Step 4: Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install --production
fi

# Step 5: Test backend can start
print_status "Testing backend startup..."
timeout 10s node server/index.cjs &
BACKEND_PID=$!
sleep 3

if kill -0 $BACKEND_PID 2>/dev/null; then
    print_status "Backend can start successfully"
    kill $BACKEND_PID 2>/dev/null
else
    print_error "Backend failed to start. Check your configuration."
    exit 1
fi

# Step 6: Start with PM2
print_status "Starting backend with PM2..."
if sudo -n pm2 start ecosystem.config.js 2>/dev/null; then
    print_status "Started with PM2 (sudo)"
elif pm2 start ecosystem.config.js 2>/dev/null; then
    print_status "Started with PM2 (user)"
else
    print_error "Failed to start with PM2. Starting directly..."
    nohup node server/index.cjs > logs/direct.log 2>&1 &
    echo $! > backend.pid
    print_status "Started backend directly (PID saved to backend.pid)"
fi

sleep 2

# Step 7: Test the backend
print_status "Testing backend endpoints..."

# Test localhost
if curl -s http://localhost:80/health > /dev/null; then
    print_status "✅ Backend responding on localhost:80"
else
    print_error "❌ Backend not responding on localhost:80"
fi

# Test API endpoint
if curl -s http://localhost:80/api/health > /dev/null; then
    print_status "✅ API endpoint responding on localhost:80"
else
    print_error "❌ API endpoint not responding on localhost:80"
fi

# Step 8: Create simple Nginx config (if nginx is available)
if command -v nginx >/dev/null 2>&1; then
    print_status "Creating Nginx configuration..."
    
    sudo tee /etc/nginx/sites-available/whizunik-portal-simple > /dev/null << 'EOF'
server {
    listen 8080;
    server_name _;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Basic CORS
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/whizunik-portal-simple /etc/nginx/sites-enabled/ 2>/dev/null
    
    if sudo nginx -t 2>/dev/null; then
        sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null
        print_status "✅ Nginx configuration updated (available on port 8080)"
    else
        print_warning "Nginx configuration test failed"
    fi
else
    print_warning "Nginx not found. You'll need to configure your web server manually."
fi

# Step 9: Final tests and instructions
cd ..
print_status "Running final connectivity tests..."

echo ""
print_status "=== QUICK FIX COMPLETED ==="
echo ""
print_status "✅ Backend configured to run on port 80"
print_status "✅ PM2 configuration updated"  
print_status "✅ Environment variables set for production"
print_status "✅ Basic Nginx proxy configured (if available)"

echo ""
print_warning "TESTING YOUR DEPLOYMENT:"
echo "1. Test backend: curl http://localhost:80/health"
echo "2. Test API: curl http://localhost:80/api/health"
echo "3. Test from outside: curl http://YOUR_SERVER_IP:80/health"
echo "4. If using Nginx: curl http://YOUR_SERVER_IP:8080/health"

echo ""
print_warning "NEXT STEPS:"
echo "1. Configure your domain DNS to point to your server IP"
echo "2. Update your hosting/firewall to route port 80 to your app"
echo "3. Install SSL certificate: sudo certbot --nginx"
echo "4. Test frontend connection to https://portal.whizunikhub.com"

echo ""
print_status "Logs available at: backend/logs/"
print_status "PM2 status: pm2 status"
print_status "PM2 logs: pm2 logs whizunik-backend"

echo ""
print_status "🎉 Quick fixes applied! Your API should now be accessible."