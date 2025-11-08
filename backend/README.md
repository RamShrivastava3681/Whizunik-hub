# WhizUnik Portal - Backend

This is the Node.js/Express backend API for the WhizUnik Portal application.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer with Gmail SMTP
- **File Uploads**: Multer middleware
- **Environment**: dotenv for configuration

## Development

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Gmail account for SMTP (or other email service)

### Installation

```bash
npm install
```

### Environment Variables

Create `.env` file with the following variables:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whizunik-portal

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# Admin Configuration
ADMIN_EMAIL=admin@whizunik.com
ADMIN_PASSWORD=secure-admin-password

# CORS
FRONTEND_URL=http://localhost:5173
```

### Running Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Running Production Server

```bash
npm start
```

## Project Structure

```
backend/
├── server.cjs           # Main server file
├── server/
│   ├── models/         # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Application.ts
│   │   └── PotentialClient.ts
│   ├── routes/         # Express route handlers
│   │   ├── auth.ts
│   │   ├── admin.ts
│   │   ├── applications.ts
│   │   └── potentialClients.ts
│   ├── middleware/     # Custom middleware
│   │   ├── auth.ts
│   │   └── upload.ts
│   └── database.ts     # Database connection
└── package.json
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /me` - Get current user
- `POST /verify-email` - Email verification

### Admin (`/api/admin`)
- `GET /users` - Get all users
- `GET /pending-registrations` - Get pending user registrations
- `PUT /users/:id/approve` - Approve user registration
- `PUT /users/:id/reject` - Reject user registration
- `GET /applications` - Get all applications
- `DELETE /users/:id` - Delete user

### Applications (`/api/applications`)
- `GET /` - Get user's applications
- `POST /` - Create new application
- `GET /:id` - Get specific application
- `PUT /:id` - Update application

### Potential Clients (`/api/potential-clients`)
- `GET /` - Get all potential clients
- `POST /` - Create new potential client
- `PUT /:id` - Update potential client
- `DELETE /:id` - Delete potential client

## Database Models

### User Model
- Basic user information and authentication
- Role-based access control (admin, user)
- Email verification status
- Registration approval workflow

### Application Model
- User applications with detailed information
- File attachments support
- Status tracking and evaluation

### PotentialClient Model
- Client lead management
- Company information and contact details
- Status tracking and notes

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Protection**: Configured for frontend domain
- **Input Validation**: Request validation middleware
- **Admin Protection**: Role-based route protection

## Email Integration

- **SMTP Configuration**: Gmail SMTP for email delivery
- **Email Verification**: Automatic verification email sending
- **Admin Notifications**: Email alerts for admin actions

## Production Considerations

- Environment variables properly configured
- Database connection pooling
- Error handling and logging
- CORS configured for production domain
- JWT secrets properly secured