# WhizUnik Portal - Complete Deployment Guide

## Overview
- **Frontend**: Deploy to Hostinger (Static hosting)
- **Backend**: Deploy to VPS (Node.js server)
- **Database**: MongoDB Atlas (Already configured)

## Prerequisites
✅ GitHub repository uploaded  
✅ Hostinger account with hosting plan  
✅ VPS with Ubuntu/CentOS  
✅ Domain configured (whizunikhub.com)  

---

## Part 1: Frontend Deployment on Hostinger

### Step 1: Prepare Frontend for Production

First, let's create the production build configuration:

```bash
# In your local project directory
cd frontend
npm install
npm run build
```

### Step 2: Configure Environment for Hostinger

Create a production environment file specifically for Hostinger:

**frontend/.env.hostinger**
```
VITE_API_URL=https://your-vps-domain.com:5000/api
VITE_APP_NAME=WhizUnik Portal
VITE_APP_VERSION=1.0.0
```

### Step 3: Build for Hostinger

```bash
# Build with Hostinger environment
cd frontend
npm run build -- --mode production
```

### Step 4: Upload to Hostinger

**Option A: Using Hostinger File Manager**
1. Login to Hostinger Control Panel
2. Go to "File Manager"
3. Navigate to `public_html` folder
4. Delete any existing files in `public_html`
5. Upload all files from `frontend/dist` folder to `public_html`
6. Ensure `index.html` is in the root of `public_html`

**Option B: Using FTP/SFTP**
```bash
# Using FileZilla or similar FTP client
Host: your-domain.com
Username: [Hostinger FTP username]
Password: [Hostinger FTP password]
Port: 21 (FTP) or 22 (SFTP)

# Upload contents of frontend/dist/ to public_html/
```

### Step 5: Configure Hostinger for SPA

Create `.htaccess` file in `public_html`:
```apache
RewriteEngine On
RewriteBase /

# Handle Angular and React Routes
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</FilesMatch>
```

---

## Part 2: Backend Deployment on VPS

### Step 1: VPS Initial Setup

```bash
# Connect to your VPS
ssh root@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

### Step 2: Clone and Setup Project

```bash
# Clone your repository
cd /var/www
sudo git clone https://github.com/RamShrivastava3681/Whizunik-hub.git
sudo chown -R $USER:$USER Whizunik-hub
cd Whizunik-hub

# Install backend dependencies
cd backend
npm install --production

# Create production environment file
sudo nano .env.production
```

**backend/.env.production content:**
```env
# Production Environment Configuration

# Database
MONGODB_URI=mongodb+srv://emp-whizunik2025:whizunik-emp-portal876@whizunik.v4cet6v.mongodb.net/

# JWT Configuration
JWT_SECRET=5878b1b35bcdd625a002b10c55a40a2c4fffb641efe96b98fda59c5694618d9767fb8180d6ac6c5ceb0a7843b8ebeb8ec20febfe5213f5d98bfdeea3db3afe5b
JWT_REFRESH_SECRET=4f2b17cf4a3fe5bc0f733f0a82816faeb37090dfbb62d1916e2da84a92bded31736e2d42f0981fc04716dfc6c5757be851506d9611c7efdd009204a178f4ef84

# Server Configuration
PORT=5000
CORS_ORIGIN=https://whizunikhub.com,http://whizunikhub.com

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

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=infowhizunik@gmail.com
EMAIL_PASS=gbfc pfcb uhiv pipo
```

### Step 3: Setup PM2 Process Manager

```bash
# Create PM2 configuration
nano ecosystem.config.js
```

**ecosystem.config.js content:**
```javascript
module.exports = {
  apps: [
    {
      name: 'whizunik-backend',
      script: 'server.cjs',
      cwd: '/var/www/Whizunik-hub/backend',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/log/pm2/whizunik-error.log',
      out_file: '/var/log/pm2/whizunik-out.log',
      log_file: '/var/log/pm2/whizunik-combined.log',
      time: true
    }
  ]
};
```

```bash
# Create log directory
sudo mkdir -p /var/log/pm2

# Start the application with PM2
cd /var/www/Whizunik-hub/backend
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown by the command above
```

### Step 4: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/whizunik-backend
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-vps-domain.com your-vps-ip;

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:5003;
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

    # Direct backend access (for port 5003)
    location / {
        proxy_pass http://localhost:5003;
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
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/whizunik-backend /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Step 5: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 5000    # Backend port (optional, can be closed if using Nginx proxy)

# Enable firewall
sudo ufw enable
```

---

## Part 3: Domain and SSL Configuration

### Step 1: Configure Domain DNS

In your domain registrar (or Cloudflare if using):
```
A Record: whizunikhub.com → [Hostinger IP]
A Record: api.whizunikhub.com → [VPS IP]
CNAME: www.whizunikhub.com → whizunikhub.com
```

### Step 2: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot --nginx -d your-vps-domain.com

# Auto-renewal setup
sudo systemctl enable certbot.timer
```

### Step 3: Update Frontend Environment

Update your frontend to use the proper API URL:

**frontend/.env.production** (rebuild and redeploy):
```
VITE_API_URL=https://api.whizunikhub.com/api
VITE_APP_NAME=WhizUnik Portal
VITE_APP_VERSION=1.0.0
```

---

## Part 4: Deployment Scripts

### Local Deployment Scripts

Add these to your root `package.json`:

```json
{
  "scripts": {
    "deploy:frontend": "cd frontend && npm run build && echo 'Upload dist/ folder to Hostinger public_html'",
    "deploy:backend": "echo 'SSH to VPS and run: cd /var/www/Whizunik-hub && git pull && cd backend && npm install --production && pm2 restart whizunik-backend'",
    "deploy:full": "npm run deploy:frontend && npm run deploy:backend"
  }
}
```

### VPS Update Script

Create this on your VPS:

```bash
# Create update script
sudo nano /var/www/update-whizunik.sh
```

```bash
#!/bin/bash
echo "Updating WhizUnik Portal..."

cd /var/www/Whizunik-hub
git pull origin main

cd backend
npm install --production

# Restart PM2 process
pm2 restart whizunik-backend

echo "Update completed!"
```

```bash
# Make it executable
sudo chmod +x /var/www/update-whizunik.sh
```

---

## Part 5: Monitoring and Maintenance

### PM2 Monitoring Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs whizunik-backend

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart whizunik-backend

# Stop application
pm2 stop whizunik-backend
```

### Nginx Commands

```bash
# Check status
sudo systemctl status nginx

# Reload configuration
sudo systemctl reload nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Part 6: Testing Deployment

### 1. Test Frontend
- Visit `https://whizunikhub.com`
- Check if the site loads correctly
- Verify all static assets load

### 2. Test Backend API
```bash
# Test API health endpoint
curl https://api.whizunikhub.com/health

# Test with browser
https://api.whizunikhub.com/health
```

### 3. Test Full Application
- Register a new user
- Login functionality
- Admin dashboard
- API calls from frontend to backend

---

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Check backend CORS configuration includes your domain
2. **502 Bad Gateway**: Backend not running - check PM2 status
3. **404 on Frontend Routes**: Missing .htaccess file on Hostinger
4. **SSL Issues**: Verify certificate installation and domain configuration
5. **Database Connection**: Check MongoDB Atlas whitelist includes VPS IP

### Log Locations:
- PM2 Logs: `/var/log/pm2/`
- Nginx Logs: `/var/log/nginx/`
- Application Logs: Check PM2 logs for backend errors

---

## Quick Commands Summary

```bash
# Frontend Redeploy (Local)
cd frontend && npm run build && # upload dist/ to Hostinger

# Backend Update (VPS)
ssh user@vps-ip
cd /var/www/Whizunik-hub && git pull && cd backend && npm install --production && pm2 restart whizunik-backend

# Check Status (VPS)
pm2 status
sudo systemctl status nginx
```

This guide covers the complete deployment process. Follow each section step by step for a successful deployment.