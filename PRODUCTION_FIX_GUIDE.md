# WhizUnik Portal - Production Deployment Fix Guide

## Issues Identified and Fixed

### 1. **API Configuration Issues** ✅ FIXED
- **Problem**: Frontend was pointing to wrong API endpoint
- **Solution**: Fixed environment variables and API configuration
- **Changes Made**:
  - Updated `frontend/.env.production` with debug flags
  - Fixed `frontend/src/config/api.ts` with proper URL handling
  - Added debug logging for troubleshooting

### 2. **CORS Configuration Issues** ✅ FIXED
- **Problem**: Backend CORS had spacing issues and missing origins
- **Solution**: Fixed CORS configuration in backend
- **Changes Made**:
  - Fixed `backend/.env.production` CORS origins (removed spaces)
  - Enhanced CORS middleware with better logging
  - Added support for www subdomains

### 3. **Port Configuration** ⚠️ NEEDS ATTENTION
- **Problem**: Backend runs on port 5003, but domain expects standard ports
- **Solution**: Need to configure reverse proxy

## Deployment Steps

### Step 1: Backend Configuration

1. **Update Environment Variables**:
   ```bash
   cd backend
   cp .env.production .env
   ```

2. **Verify Backend Configuration**:
   - MongoDB URI: ✅ Already configured
   - JWT Secrets: ✅ Already configured
   - CORS Origins: ✅ Fixed
   - Port: Set to 5003 (needs reverse proxy)

### Step 2: Frontend Configuration

1. **Build Frontend with Production Config**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Environment Variables**:
   - `VITE_API_URL`: Points to `https://portal.whizunikhub.com/api`
   - Debug logging: Enabled

### Step 3: Server Configuration (Critical)

You need to configure your VPS to properly route traffic:

#### Option A: Change Backend Port (Recommended)
Update your backend to run on port 80 or use a reverse proxy.

1. **Update backend/.env.production**:
   ```env
   PORT=80
   ```

2. **Or setup Nginx reverse proxy**:
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
       }
       
       location /health {
           proxy_pass http://localhost:5003;
       }
   }
   ```

#### Option B: Update Frontend API URL
If your backend must stay on port 5003, update the frontend:

```env
# frontend/.env.production
VITE_API_URL=https://portal.whizunikhub.com:5003/api
```

### Step 4: Test API Connection

1. **Test Backend Health**:
   ```bash
   curl https://portal.whizunikhub.com/health
   curl https://portal.whizunikhub.com/api/health
   ```

2. **Test CORS**:
   ```bash
   curl -H "Origin: https://whizunikhub.com" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS https://portal.whizunikhub.com/api/health
   ```

### Step 5: Debug API Issues

The code now includes comprehensive logging. Check:

1. **Frontend Console**: Open browser dev tools, look for API configuration logs
2. **Backend Logs**: Check server logs for CORS and request information
3. **Network Tab**: Check if requests are reaching the correct URLs

## Quick Test Commands

### Test API Connectivity:
```bash
# Test health endpoint
curl -v https://portal.whizunikhub.com/health

# Test API health endpoint  
curl -v https://portal.whizunikhub.com/api/health

# Test with CORS headers
curl -v -H "Origin: https://whizunikhub.com" https://portal.whizunikhub.com/api/health
```

### Test Login Endpoint:
```bash
curl -X POST https://portal.whizunikhub.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://whizunikhub.com" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## Common Issues and Solutions

### 1. "Error fetching data"
- **Cause**: API endpoint not reachable
- **Check**: Browser Network tab for failed requests
- **Fix**: Ensure reverse proxy or correct port configuration

### 2. CORS Errors
- **Cause**: Origin not allowed
- **Check**: Browser console for CORS messages
- **Fix**: Update CORS_ORIGIN in backend/.env.production

### 3. 404 on API calls
- **Cause**: Wrong API URL or missing reverse proxy
- **Check**: Verify API URL in browser Network tab
- **Fix**: Setup Nginx reverse proxy or fix API URL

### 4. SSL/Certificate Issues
- **Cause**: Mixed HTTP/HTTPS content
- **Check**: Ensure all API calls use HTTPS in production
- **Fix**: Use certbot to setup SSL certificates

## Recommended Nginx Configuration

Create `/etc/nginx/sites-available/whizunik-portal`:

```nginx
server {
    listen 80;
    server_name portal.whizunikhub.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # API proxy
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
        
        # Handle preflight OPTIONS requests
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:5003;
    }
    
    # Handle all other requests (if needed)
    location / {
        return 301 https://whizunikhub.com$request_uri;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/whizunik-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Post-Deployment Checklist

- [ ] Backend responds to health checks
- [ ] API endpoints return valid responses
- [ ] CORS headers are correct
- [ ] Frontend can successfully authenticate
- [ ] Database connections work
- [ ] File uploads work (if applicable)
- [ ] SSL certificates are configured
- [ ] PM2 or service manager is configured for auto-restart

## Monitoring and Logs

- **Backend Logs**: Check your process manager logs
- **Nginx Logs**: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **Browser Console**: For frontend debugging
- **Network Tab**: For API request debugging

## Support

If issues persist after following this guide:

1. Check the browser console for detailed error messages
2. Verify network requests in the Network tab
3. Test API endpoints directly with curl
4. Check server logs for backend errors
5. Ensure all environment variables are correctly set