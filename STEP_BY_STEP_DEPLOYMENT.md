# 🎯 WhizUnik Portal - Step-by-Step Deployment Guide

## 🔧 What You Need
- ✅ VPS Server (Ubuntu/CentOS)
- ✅ Hostinger Hosting Account
- ✅ GitHub Repository (already uploaded)
- ✅ Domain: whizunikhub.com

---

## 📋 STEP 1: Prepare Your Local Files

Run this in your project directory (Windows PowerShell):

```powershell
# Make the build script executable and run it
chmod +x build-frontend.sh
./build-frontend.sh
```

When prompted, enter your VPS IP address or domain.

---

## 🖥️ STEP 2: Deploy Backend to VPS

### 2.1 Connect to Your VPS
```bash
ssh root@YOUR_VPS_IP_ADDRESS
```

### 2.2 Run the Automated Deployment Script
```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/RamShrivastava3681/Whizunik-hub/main/deploy-vps.sh
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### 2.3 Configure Environment (Important!)
```bash
# Edit the environment file
nano /var/www/Whizunik-hub/backend/.env.production
```

**Update these values in the file:**
```env
# Change this line to include your domain
CORS_ORIGIN=https://whizunikhub.com,http://whizunikhub.com

# Keep your existing MongoDB URI
MONGODB_URI=mongodb+srv://emp-whizunik2025:whizunik-emp-portal876@whizunik.v4cet6v.mongodb.net/

# Keep your existing email settings
EMAIL_USER=infowhizunik@gmail.com
EMAIL_PASS=gbfc pfcb uhiv pipo
```

### 2.4 Start the Backend
```bash
cd /var/www/Whizunik-hub/backend
./start.sh

# Setup PM2 to start automatically on server reboot
pm2 startup
# Follow the command it shows you (copy and paste it)

# Save the PM2 configuration
pm2 save
```

### 2.5 Test Backend
```bash
# Test if backend is running
curl http://localhost:5003/health

# Test from outside (replace with your VPS IP)
curl http://YOUR_VPS_IP/health
```

---

## 🌐 STEP 3: Deploy Frontend to Hostinger

### 3.1 Login to Hostinger
1. Go to [Hostinger Control Panel](https://www.hostinger.com/cpanel-login)
2. Login with your account
3. Select your hosting plan for `whizunikhub.com`

### 3.2 Access File Manager
1. Click on **"File Manager"** in the control panel
2. Navigate to the **`public_html`** folder
3. **Delete ALL existing files** in `public_html` (but keep the folder itself)

### 3.3 Upload Your Frontend
You have two options:

**Option A: Upload the Zip File (Easier)**
1. Upload `frontend/whizunik-frontend-hostinger.zip` to `public_html`
2. Right-click the zip file and select "Extract"
3. Delete the zip file after extraction

**Option B: Upload Files Directly**
1. Select ALL files from your local `frontend/dist/` folder
2. Upload them to `public_html` folder
3. Make sure `index.html` is in the root of `public_html`

### 3.4 Verify Upload
Your `public_html` folder should contain:
- `index.html`
- `assets/` folder
- `.htaccess` file
- Other build files

---

## 🔗 STEP 4: Configure Domain DNS

### 4.1 In Your Domain Registrar (or Cloudflare)
Add these DNS records:
```
Type: A Record
Name: whizunikhub.com
Value: [Your Hostinger IP Address]

Type: A Record  
Name: api.whizunikhub.com
Value: [Your VPS IP Address]

Type: CNAME
Name: www
Value: whizunikhub.com
```

---

## 🔒 STEP 5: Setup SSL (Optional but Recommended)

### 5.1 For the VPS (Backend SSL)
```bash
# Install SSL certificate for your VPS
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.whizunikhub.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 5.2 For Hostinger (Frontend SSL)
1. In Hostinger Control Panel, go to **SSL**
2. Enable **Free SSL Certificate** for your domain
3. Wait for activation (can take a few minutes)

---

## ✅ STEP 6: Test Everything

### 6.1 Test Backend API
Visit these URLs in your browser:
- `http://YOUR_VPS_IP/health` (should show backend health info)
- `http://api.whizunikhub.com/health` (after DNS propagation)

### 6.2 Test Frontend
Visit: `https://whizunikhub.com`

### 6.3 Test Full Application
1. Try to register a new user
2. Check if login works
3. Verify email functionality
4. Test admin dashboard

---

## 🔧 STEP 7: Troubleshooting Commands

If something doesn't work:

### On Your VPS:
```bash
# Check if backend is running
pm2 status

# View backend logs
pm2 logs whizunik-backend

# Restart backend
pm2 restart whizunik-backend

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

### Common Issues:
1. **CORS Error**: Make sure CORS_ORIGIN in `.env.production` includes your domain
2. **502 Bad Gateway**: Backend not running - check `pm2 status`
3. **404 on Frontend Routes**: Make sure `.htaccess` file is uploaded
4. **Can't reach API**: Check VPS firewall: `sudo ufw status`

---

## 🔄 STEP 8: Future Updates

### Update Backend:
```bash
# SSH to your VPS and run:
update-whizunik
```

### Update Frontend:
1. Run `./build-frontend.sh` locally
2. Upload new files to Hostinger `public_html`
3. Clear browser cache

---

## 📞 Need Help?

If you get stuck:

1. **Check the logs first**:
   - VPS: `pm2 logs whizunik-backend`
   - Browser: Open Developer Console (F12)

2. **Common fixes**:
   - Restart everything: `pm2 restart all && sudo systemctl restart nginx`
   - Check if services are running: `pm2 status`

3. **Test step by step**:
   - Backend health: `curl http://YOUR_VPS_IP/health`
   - Frontend loading: Check network tab in browser dev tools

---

**🎉 You're all set! Your WhizUnik Portal should now be live at https://whizunikhub.com**