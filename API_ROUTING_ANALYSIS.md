# Current API Request Routing Analysis

## 📍 **WHERE REQUESTS ARE GOING**

### Frontend Configuration
- **Current Frontend URL**: http://localhost:5173
- **Target Backend URL**: http://localhost:5000/api

### Environment Configuration

#### Frontend `.env` file:
```bash
VITE_API_URL=http://localhost:5000/api  # ✅ Now configured
```

#### Backend `.env` file:
```bash
PORT=5000  # Backend listening port
CORS_ORIGIN=http://localhost:5173, https://hotpink-gull-817583.hostingersite.com/
```

## 📊 **REQUEST ROUTING DETAILS**

### API Configuration Hierarchy
1. **Primary**: `VITE_API_URL` environment variable → `http://localhost:5000/api`
2. **Fallback**: Hardcoded in multiple files → `http://localhost:5000/api`

### Files Using API Endpoints

#### ✅ **Using Environment Variable (Recommended)**:
- `src/pages/Login.tsx`
- `src/pages/AdminPage.tsx` 
- `src/lib/auth.ts`
- `src/components/AdminLogin.tsx`

#### ⚠️ **Using Hardcoded URLs (Should be updated)**:
- `src/components/AdminDashboard.tsx` - Multiple fetch calls
- `src/components/PotentialClientsManager.tsx` - Axios baseURL
- `src/pages/ApplicationView_MongoDB.tsx`
- `src/lib/auth_old.ts`
- `src/lib/auth_new.ts`
- `src/config/api.ts`

## 🚀 **CURRENT SERVER STATUS**

### Backend Server
- **Expected URL**: http://localhost:5000
- **Status**: Backend keeps shutting down (needs investigation)
- **Configuration**: Uses MongoDB Atlas connection

### Frontend Server  
- **Current URL**: http://localhost:5173
- **Status**: ✅ Running
- **Dev Server**: Vite development server

## 📡 **API ENDPOINTS BEING CALLED**

### Admin Dashboard Endpoints:
- `GET /api/admin/users` - Fetch all users
- `GET /api/admin/applications` - Fetch applications  
- `GET /api/admin/stats` - Dashboard statistics
- `PATCH /api/admin/users/:id/toggle-status` - Toggle user status

### Authentication Endpoints:
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Potential Clients Endpoints:
- `GET /api/potential-clients` - Fetch clients
- `POST /api/potential-clients` - Create client
- `PUT /api/potential-clients/:id` - Update client
- `DELETE /api/potential-clients/:id` - Delete client

## ⚠️ **ISSUES TO ADDRESS**

1. **Backend Stability**: Server keeps shutting down
2. **Mixed Configuration**: Some files use env vars, others are hardcoded
3. **Environment Consistency**: Should standardize on environment-based URLs

## ✅ **RECOMMENDED NEXT STEPS**

1. **Fix Backend Stability**: Investigate why server shuts down
2. **Standardize API URLs**: Update all hardcoded URLs to use `VITE_API_URL`
3. **Environment Setup**: Ensure `.env` files are consistent across frontend/backend
4. **CORS Configuration**: Verify CORS settings match current frontend URL

## 🎯 **CURRENT REQUEST FLOW**

```
Frontend (localhost:5173) 
    ↓ HTTP Requests
Backend API (localhost:5000/api)
    ↓ Database Queries  
MongoDB Atlas (Cloud Database)
```

**Bottom Line**: Requests are configured to go to `http://localhost:5000/api` but the backend server needs to be stabilized for consistent operation.