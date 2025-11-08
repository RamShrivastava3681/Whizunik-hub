# WhizUnik Portal - Deployment Guide

## 🚀 Deployment Checklist

### ✅ Production-Ready Changes Made:

1. **Removed Demo Credentials** - No more exposed credentials in UI
2. **Environment Variables** - All configurations now use environment variables
3. **Secure Secrets** - JWT secrets and database URIs are configurable
4. **API URLs** - Frontend uses `VITE_API_URL` environment variable
5. **Email Configuration** - Uses environment variables for email service
6. **Development OTP** - OTP is logged to console only, not exposed in API response

### 📋 Environment Variables Required:

#### Frontend (.env.local):
```bash
VITE_API_URL=https://your-backend-domain.com/api
```

#### Backend (Environment or .env):
```bash
NODE_ENV=production
MONGODB_URI=mongodb://your-mongo-host:27017/whizunik-portal
JWT_SECRET=your-super-secure-jwt-secret-key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=5000
```

### 🔧 Production Build Commands:

#### For Development:
```bash
npm run dev:full          # Run both frontend and backend in development
```

#### For Production:
```bash
npm run build:prod        # Build frontend for production
npm run server:prod       # Run backend in production mode
npm run start:prod         # Build and run in production mode
```

### 🌐 Deployment Steps:

#### 1. **Frontend Deployment** (Vercel, Netlify, etc.):
```bash
# Build the frontend
npm run build:prod

# Deploy the 'dist' folder to your hosting service
# Set environment variable: VITE_API_URL=https://your-backend-domain.com/api
```

#### 2. **Backend Deployment** (Railway, Heroku, VPS, etc.):
```bash
# Set all required environment variables
# Deploy server.cjs and node_modules
# Start with: npm run server:prod
```

#### 3. **Database Setup**:
- MongoDB Atlas (Cloud) or self-hosted MongoDB
- Update `MONGODB_URI` environment variable
- Run initial seed if needed: `npm run seed`

#### 4. **Email Service Setup**:
- Configure Gmail App Password or use another SMTP service
- Update `EMAIL_*` environment variables

### 🔐 Security Considerations:

1. **JWT Secret**: Generate a strong, unique secret for production
2. **Database**: Use MongoDB Atlas or secure self-hosted instance
3. **CORS**: Update CORS settings in server.cjs for your frontend domain
4. **HTTPS**: Ensure both frontend and backend use HTTPS in production
5. **Environment Variables**: Never commit .env files to version control

### 📁 File Structure:
```
dist/                 # Built frontend (deploy this to CDN/static hosting)
server.cjs           # Backend server (deploy this to server hosting)
.env.example         # Template for environment variables
package.json         # Dependencies and scripts
```

### 🧪 Testing Production Build Locally:

1. Create `.env.local` with production API URL
2. Build frontend: `npm run build:prod`
3. Serve built files: `npm run preview`
4. Run backend: `npm run server:prod`
5. Test all functionality

### 🚨 Common Issues:

1. **CORS Errors**: Update CORS configuration in server.cjs
2. **API Connection**: Verify `VITE_API_URL` points to correct backend
3. **Email Not Working**: Check EMAIL_* environment variables
4. **Database Connection**: Verify `MONGODB_URI` is correct
5. **Authentication Issues**: Ensure JWT_SECRET is same across deployments

### 📊 Monitoring & Maintenance:

- Set up logging for production errors
- Monitor email delivery rates
- Regular database backups
- Update dependencies regularly
- Monitor API response times

The application is now ready for production deployment! 🎉