# 🚀 WhizUnik Portal - Quick Deployment Checklist

## Prerequisites ✅

- [ ] GitHub repository uploaded
- [ ] Hostinger account with hosting plan
- [ ] VPS server (Ubuntu/CentOS) with root access
- [ ] Domain name configured
- [ ] MongoDB Atlas database (already configured)

---

## 🖥️ VPS Backend Deployment

### Step 1: Initial VPS Setup
```bash
# Connect to your VPS
ssh root@YOUR_VPS_IP

# Download and run deployment script
wget https://raw.githubusercontent.com/RamShrivastava3681/Whizunik-hub/main/deploy-vps.sh
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Step 2: Configure Environment
```bash
# Edit environment file
nano /var/www/Whizunik-hub/backend/.env.production

# Update these values:
# - MONGODB_URI (if different)
# - JWT_SECRET (generate new ones)
# - EMAIL credentials
# - CORS_ORIGIN (your domain)
```

### Step 3: Start Backend
```bash
cd /var/www/Whizunik-hub/backend
./start.sh

# Setup PM2 to start on boot
pm2 startup
# Follow the displayed command
```

### Step 4: Test Backend
```bash
# Test locally on VPS
curl http://localhost:5003/health

# Test from outside
curl http://YOUR_VPS_IP/health
```

---

## 🌐 Frontend Deployment on Hostinger

### Step 1: Build Frontend (On Your Local Machine)
```bash
# In your project directory
./build-frontend.sh
# Enter your VPS IP/domain when prompted
```

### Step 2: Upload to Hostinger
1. **Login to Hostinger Control Panel**
2. **Open File Manager**
3. **Navigate to `public_html`**
4. **Delete existing files**
5. **Upload contents of `frontend/dist/` folder**
6. **Ensure `index.html` is in root of `public_html`**

### Alternative: Use the zip file
1. Upload `frontend/whizunik-frontend-hostinger.zip` to `public_html`
2. Extract the zip file
3. Delete the zip file after extraction

---

## 🔧 Domain Configuration

### DNS Settings (in your domain registrar)
```
A Record: whizunikhub.com → [Hostinger IP]
A Record: api.whizunikhub.com → [VPS IP]
CNAME: www.whizunikhub.com → whizunikhub.com
```

### SSL Certificate (On VPS)
```bash
# Install SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.whizunikhub.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🧪 Testing Deployment

### 1. Test Backend API
```bash
# Health check
curl https://api.whizunikhub.com/health

# Or without subdomain
curl https://YOUR_VPS_DOMAIN/health
```

### 2. Test Frontend
- Visit: `https://whizunikhub.com`
- Check browser console for errors
- Test login/registration flow

### 3. Test Full Integration
- Register new user
- Login to dashboard
- Check admin panel
- Verify email notifications

---

## 🔍 Troubleshooting

### Backend Issues
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs whizunik-backend

# Restart backend
pm2 restart whizunik-backend

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Frontend Issues
- **404 on routes**: Check `.htaccess` file in `public_html`
- **API connection failed**: Verify VPS backend is running
- **CORS errors**: Check backend CORS configuration

### Common Solutions
```bash
# Update application (on VPS)
update-whizunik

# Restart services (on VPS)
pm2 restart all
sudo systemctl restart nginx

# Check firewall (on VPS)
sudo ufw status
```

---

## 📋 Quick Commands

### Local Development
```bash
npm run dev                 # Start local development
./build-frontend.sh         # Build for Hostinger
```

### VPS Management
```bash
pm2 status                  # Check backend status
pm2 logs whizunik-backend  # View backend logs
update-whizunik            # Update from GitHub
sudo systemctl status nginx # Check Nginx status
```

### Hostinger
- Use File Manager to upload new frontend builds
- Clear browser cache after updates

---

## 🔒 Security Checklist

- [ ] SSL certificates installed
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] Strong JWT secrets generated
- [ ] Database credentials secure
- [ ] Email credentials secure
- [ ] MongoDB Atlas IP whitelist updated

---

## 📞 Support

If you encounter issues:

1. **Check logs first**:
   - Backend: `pm2 logs whizunik-backend`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`

2. **Common fixes**:
   - Restart services: `pm2 restart all && sudo systemctl restart nginx`
   - Update code: `update-whizunik`
   - Check firewall: `sudo ufw status`

3. **Test connectivity**:
   - Backend API: `curl http://YOUR_VPS_IP/health`
   - Frontend: Visit your domain in browser

---

## 📈 Monitoring

### Set up monitoring (optional):
```bash
# Install htop for system monitoring
sudo apt install htop

# Monitor with PM2
pm2 monit

# Check disk space
df -h

# Check memory usage
free -h
```

This checklist provides a step-by-step guide for successful deployment!