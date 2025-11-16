# WhizUnik Portal - whizunikhub.com Deployment Guide

## Backend Configuration for whizunikhub.com

The backend has been configured to accept requests from `whizunikhub.com` domain. Here are the key changes made:

### 1. CORS Configuration
Both backend servers now accept requests from:
- `https://portal.whizunikhub.com` (main frontend)
- `https://whizunikhub.com`
- `http://whizunikhub.com`
- `http://portal.whizunikhub.com`
- `http://localhost:5173` (for development)
- Any domains specified in the `CORS_ORIGIN` environment variable

### 2. Environment Configuration

#### Backend `.env` file updated:
```properties
CORS_ORIGIN=http://localhost:5173, https://hotpink-gull-817583.hostingersite.com/, https://whizunikhub.com, http://whizunikhub.com, https://portal.whizunikhub.com, http://portal.whizunikhub.com
```

#### New production environment files created:
- `backend/.env.production` - Production backend configuration
- `frontend/.env.production` - Production frontend configuration

### 3. Frontend API Configuration
The frontend now dynamically detects the domain and uses the appropriate API URL:
- When running on `whizunikhub.com` or `portal.whizunikhub.com`, it uses `https://portal.whizunikhub.com/api`
- In development, it uses `http://localhost:5003/api`
- Can be overridden with `VITE_API_URL` environment variable

### 4. Email Notifications
Approval emails now redirect to `https://whizunikhub.com/login` instead of localhost.

## Deployment Commands

### For whizunikhub.com deployment:
```bash
# Install dependencies
npm run install:all

# Build and start for whizunikhub.com
npm run start:whizunikhub
```

### Manual deployment steps:
```bash
# Backend
cd backend
NODE_ENV=production npm run start:whizunikhub

# Frontend (if serving separately)
cd frontend
npm run build -- --mode production
```

## Server Requirements

1. **Backend Server**: Needs to be accessible on port 5003
   - URL: `https://whizunikhub.com:5003` or `http://whizunikhub.com:5003`

2. **Frontend**: Can be served on standard web ports (80/443)
   - Main URL: `https://portal.whizunikhub.com`
   - Alternative: `https://whizunikhub.com` or `http://whizunikhub.com`

## SSL Configuration

If using HTTPS (recommended for production):
1. Ensure SSL certificates are properly configured for `whizunikhub.com`
2. Update all API URLs to use `https://` protocol
3. Verify CORS settings allow the HTTPS origin

## Files Modified

### Backend Files:
- `backend/server.cjs` - CORS configuration and email templates
- `backend/server/index.cjs` - CORS configuration
- `backend/.env` - Added whizunikhub.com origins
- `backend/.env.production` - Production configuration
- `backend/package.json` - Added production scripts

### Frontend Files:
- `frontend/src/config/api.ts` - Dynamic API URL detection
- `frontend/src/components/AdminDashboard.tsx` - Use centralized API config
- `frontend/src/pages/Login.tsx` - Use centralized API config
- `frontend/src/lib/auth.ts` - Use centralized API config
- `frontend/src/components/PotentialClientsManager.tsx` - Use centralized API config
- All other files using hardcoded localhost URLs
- `frontend/.env.production` - Production configuration

### Root Files:
- `package.json` - Added whizunikhub.com deployment scripts

## Testing

1. **Local Testing**: Run `npm run dev` and verify everything works on localhost
2. **Production Testing**: Deploy to whizunikhub.com and verify:
   - Frontend loads correctly
   - API calls work from the domain
   - Authentication and registration flow works
   - Email notifications contain correct URLs

## Troubleshooting

1. **CORS Errors**: Ensure the backend CORS configuration includes the exact domain being used
2. **API Connection Issues**: Verify the backend is accessible on the expected port
3. **Mixed Content Warnings**: If using HTTPS frontend with HTTP backend, consider enabling SSL on backend
