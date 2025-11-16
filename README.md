# WhizUnik Portal

A comprehensive full-stack web application for managing applications, users, and potential clients for WhizUnik services. The application is now organized with separate frontend and backend directories for better development and deployment practices.

## 🚀 Features

- **User Authentication**: Secure JWT-based login/logout system
- **Admin Dashboard**: Complete user and application management interface
- **Application Management**: Create, view, and manage user applications
- **Potential Clients**: CRM-style client lead management
- **Role-based Access**: Different interfaces for admins and regular users
- **Email Verification**: Automated email verification system
- **Responsive Design**: Mobile-first responsive interface
- **Production Ready**: Clean codebase with separated concerns

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** + **shadcn/ui** for styling
- **React Router DOM** for routing
- **React Query** for state management
- **Axios** for API calls

### Backend
- **Node.js** + **Express.js**
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email services
- **Multer** for file uploads

## 📁 Project Structure

```
whizunik-portal/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # UI components and shadcn/ui
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   └── config/        # App configuration
│   ├── package.json       # Frontend dependencies
│   └── README.md          # Frontend documentation
├── backend/               # Node.js backend API
│   ├── server.cjs         # Main server file
│   ├── server/
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # Express route handlers
│   │   ├── middleware/    # Custom middleware
│   │   └── database.ts    # Database connection
│   ├── package.json       # Backend dependencies
│   └── README.md          # Backend documentation
├── uploads/               # File upload directory
├── package.json           # Root workspace management
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB
- Gmail account for SMTP (or other email service)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd whizunik-portal
```

### 2. Install All Dependencies
```bash
npm run install:all
```

### 3. Environment Configuration
Copy `.env.example` to `.env` in both `frontend/` and `backend/` directories and configure:

**Backend (.env)**:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whizunik-portal
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@whizunik.com
```

**Frontend (.env)**:
```bash
# Development
VITE_API_URL=http://localhost:5003/api

# Production
VITE_API_URL=https://portal.whizunikhub.com/api
```

### 4. Start Development
```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:5003`
- Frontend on `http://localhost:5173`

## 📜 Available Scripts

### Root Level (Workspace Management)
```bash
npm run install:all       # Install all dependencies
npm run dev               # Start both frontend and backend
npm run build:frontend    # Build frontend for production
npm run start:prod        # Build and start production server
npm run clean            # Clean all node_modules and dist folders
```

### Frontend Only
```bash
cd frontend
npm run dev              # Development server
npm run build            # Production build
npm run lint             # ESLint check
```

### Backend Only
```bash
cd backend
npm run dev              # Development with nodemon
npm start                # Production server
```

## 🔧 Production Deployment

### Option 1: Monorepo Deployment
```bash
npm run start:prod
```

### Option 2: Separate Deployment
Deploy frontend and backend to different services (recommended):

**Frontend** (Vercel, Netlify, etc.):
```bash
cd frontend && npm run build
```

**Backend** (Railway, Render, Heroku, etc.):
```bash
cd backend && npm start
```

## 📡 API Documentation

### Base URL
- Development: `http://localhost:5003/api`
- Production: `https://portal.whizunikhub.com/api`
- Production: Update `VITE_API_URL` in frontend

### Key Endpoints
- **Auth**: `/api/auth/*` - Authentication system
- **Admin**: `/api/admin/*` - Admin management
- **Applications**: `/api/applications/*` - Application CRUD
- **Clients**: `/api/potential-clients/*` - Client management

See individual README files in `frontend/` and `backend/` for detailed API documentation.

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- Role-based access control
- CORS protection
- Input validation and sanitization
- Email verification system

## 🎯 Key Features

### Admin Dashboard
- ✅ User registration approval system
- ✅ Application management and evaluation
- ✅ Potential client CRM functionality
- ✅ System analytics and reporting

### User Interface  
- ✅ Secure authentication with email verification
- ✅ Application creation and submission
- ✅ Personal dashboard with real-time status
- ✅ Fully responsive mobile-first design

### Production Ready
- ✅ Clean separation of frontend and backend
- ✅ Environment-based configuration
- ✅ Optimized build processes
- ✅ Comprehensive documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes in the appropriate directory (`frontend/` or `backend/`)
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary to WhizUnik.

---

For detailed setup and development information, see the README files in:
- [`frontend/README.md`](./frontend/README.md)
- [`backend/README.md`](./backend/README.md)