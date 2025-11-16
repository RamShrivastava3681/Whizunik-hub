# WhizUnik Portal - Final Deployment Checklist

## ✅ Issues Fixed

### 1. API Configuration Issues ✅
- Fixed frontend API URL configuration with proper environment variable handling
- Added comprehensive debug logging to track API calls
- Improved error handling and response logging

### 2. CORS Configuration Issues ✅  
- Fixed backend CORS configuration (removed spaces from origins)
- Added support for www subdomains and multiple domain variants
- Enhanced CORS middleware with detailed logging
- Added proper preflight request handling

### 3. Request/Response Debugging ✅
- Added detailed logging for all axios requests and responses
- Created API connection test component for frontend debugging
- Added health check endpoints for both `/health` and `/api/health`

## 🚀 Quick Deployment Steps

### Step 1: Deploy Backend
```bash
# On your VPS
cd /path/to/your/backend
cp .env.production .env
npm install --production
pm2 start server.cjs --name whizunik-backend
```

### Step 2: Deploy Frontend
```bash
# Build with production config
cd frontend
npm run build
# Copy dist folder to your web server
```

### Step 3: Configure Reverse Proxy (CRITICAL)
Your backend runs on port 5003, but your domain expects standard web ports. You MUST configure a reverse proxy:

**Create/Update Nginx Config:**
```nginx
server {
    listen 80;
    server_name portal.whizunikhub.com;
    
    location /api/ {
        proxy_pass http://localhost:5003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://whizunikhub.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    location /health {
        proxy_pass http://localhost:5003;
    }
}
```

## 🔍 Testing Your Deployment

### 1. Quick API Tests (Run on your VPS)
```bash
# Make test script executable
chmod +x test-api-connection.sh

# Run comprehensive tests
./test-api-connection.sh
```

### 2. Manual Tests
```bash
# Test backend health
curl https://portal.whizunikhub.com/health

# Test API health  
curl https://portal.whizunikhub.com/api/health

# Test CORS
curl -H "Origin: https://whizunikhub.com" https://portal.whizunikhub.com/api/health

# Test login endpoint
curl -X POST https://portal.whizunikhub.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://whizunikhub.com" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 3. Frontend Debug Testing
Add this to your frontend URL to test API connectivity:
```
https://whizunikhub.com/?debug=api
```

Then open browser console to see detailed API configuration and test results.

## 🐛 Common Issues & Solutions

### Issue 1: "Error fetching data"
**Symptoms:** All API calls fail, no data loads
**Causes & Solutions:**
- ❌ Backend not running → ✅ Start backend with `pm2 start server.cjs`
- ❌ Wrong port configuration → ✅ Setup reverse proxy or change backend port
- ❌ Firewall blocking → ✅ Open port 5003 or use reverse proxy on port 80
- ❌ SSL/Certificate issues → ✅ Setup SSL with certbot

### Issue 2: CORS Errors
**Symptoms:** "Access to fetch blocked by CORS policy"
**Solutions:**
- ✅ Check `CORS_ORIGIN` in backend `.env.production` (no spaces!)
- ✅ Ensure your frontend domain is listed in CORS origins
- ✅ Add proper CORS headers in Nginx config
- ✅ Restart backend after changing CORS settings

### Issue 3: 404 on API Calls
**Symptoms:** API calls return 404 Not Found
**Solutions:**
- ✅ Setup reverse proxy to route `/api/*` to backend
- ✅ Verify backend is running on correct port (5003)
- ✅ Check Nginx configuration syntax with `nginx -t`

### Issue 4: 500 Internal Server Error
**Symptoms:** API calls return 500 errors
**Solutions:**
- ✅ Check backend logs: `pm2 logs whizunik-backend`
- ✅ Verify MongoDB connection string
- ✅ Check environment variables are set correctly
- ✅ Ensure JWT secrets are configured

## 📊 Debug & Monitoring

### Check Backend Status
```bash
# PM2 status
pm2 status

# Backend logs
pm2 logs whizunik-backend

# System logs
sudo tail -f /var/log/nginx/error.log
```

### Check Frontend Debug Info
Open browser dev tools and look for:
- API configuration logs (will show resolved URLs)
- Network tab (shows actual request URLs and responses) 
- Console errors (CORS, network, or auth errors)

### Environment Variables Check
```bash
# Backend
cat backend/.env.production

# Frontend (check build)
cat frontend/.env.production
```

## 🔐 Security Checklist

- [ ] JWT secrets are secure and unique
- [ ] Database credentials are secure
- [ ] CORS is restrictive (only your domains)
- [ ] SSL certificates are installed
- [ ] Firewall is configured properly
- [ ] File upload limits are set
- [ ] Rate limiting is enabled (if needed)

## 🎯 Expected Results After Fixing

1. **API Health Check**: `https://portal.whizunikhub.com/health` returns JSON success
2. **API Endpoint**: `https://portal.whizunikhub.com/api/health` returns JSON success
3. **Frontend Loads**: No console errors, authentication works
4. **CORS Works**: No CORS errors in browser console
5. **Login Works**: Users can log in and see dashboard

## 📞 If Still Having Issues

1. **Run the test script**: `./test-api-connection.sh`
2. **Check browser console**: Look for specific error messages
3. **Check network tab**: See exactly which URLs are failing
4. **Verify environment**: Ensure all config files are correct
5. **Test backend directly**: `curl http://localhost:5003/health`

## 📋 Final Verification Commands

```bash
# 1. Check if backend is running
curl http://localhost:5003/health

# 2. Check if reverse proxy works
curl https://portal.whizunikhub.com/health

# 3. Check API endpoint
curl https://portal.whizunikhub.com/api/health

# 4. Check CORS
curl -H "Origin: https://whizunikhub.com" https://portal.whizunikhub.com/api/health

# 5. Test authentication endpoint
curl -X POST https://portal.whizunikhub.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

All of these should return valid JSON responses (not HTML error pages).

---

**💡 Remember**: The key issue was likely the reverse proxy configuration. Your backend runs on port 5003, but your domain expects standard web ports (80/443). The Nginx reverse proxy bridges this gap and handles CORS properly.