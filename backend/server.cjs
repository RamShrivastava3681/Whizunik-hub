const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5003;

console.log('🚀 Starting working server...');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/whizunik-portal';

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  username: { type: String, required: true, trim: true },
  role: { type: String, enum: ['salesman', 'evaluator', 'admin'], default: 'salesman' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    department: String,
    isActive: { type: Boolean, default: true }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Ensure admin user exists
async function ensureAdminUser() {
  try {
    const adminEmail = 'sankalp@whizunik.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const adminUser = new User({
        email: adminEmail,
        password: '$2b$12$6z6E0Hnca/ym/.VXR7BX6.sTEurpJQtKTM7eoEUFJI1M0iEsZAGJ6', // Sankalp@123
        username: 'Sankalp',
        role: 'admin',
        status: 'approved',
        profile: {
          firstName: 'Sankalp',
          lastName: 'Admin',
          phone: '+1-555-0101',
          department: 'Administration',
          isActive: true
        }
      });
      
      await adminUser.save();
      console.log('✅ Admin user created:', adminEmail);
    } else {
      // Update existing admin user to ensure correct credentials and status
      await User.updateOne(
        { email: adminEmail },
        {
          $set: {
            password: '$2b$12$6z6E0Hnca/ym/.VXR7BX6.sTEurpJQtKTM7eoEUFJI1M0iEsZAGJ6', // Sankalp@123
            username: 'Sankalp',
            role: 'admin',
            status: 'approved',
            'profile.firstName': 'Sankalp',
            'profile.lastName': 'Admin',
            'profile.isActive': true
          }
        }
      );
      console.log('✅ Admin user updated:', adminEmail);
    }
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
  }
}

// Call after MongoDB connection
mongoose.connect(mongoUri)
  .then(async () => {
    console.log('📊 Connected to MongoDB');
    await ensureAdminUser();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
const applicationSchema = new mongoose.Schema({
  salesmanId: { type: String, required: true },
  linkToken: { type: String, required: true, unique: true },
  password: { type: String },
  status: { type: String, enum: ['draft', 'submitted', 'pending_evaluation', 'approved', 'rejected', 'needs_more_info'], default: 'draft' },
  clientName: { type: String, required: true },
  companyName: { type: String },
  email: { type: String },
  phone: { type: String },
  applicationData: { type: Object, default: {} },
  documents: [{ type: Object }],
  evaluationId: { type: String },
  notes: { type: String }
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);

// Potential Client Schema  
const potentialClientSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String },
  contactPhone: { type: String },
  address: { type: String },
  country: { type: String, default: 'USA' },
  industry: { type: String },
  contactTitle: { type: String },
  products: { type: String },
  type: { type: String, enum: ['exporter', 'importer', 'manufacturer', 'trader', 'service_provider', 'other'], default: 'other' },
  dealAmount: { type: Number, default: 0 },
  financingFee: { type: Number, default: 0 },
  source: { type: String, enum: ['cold_call', 'referral', 'website', 'exhibition', 'linkedin', 'email_campaign', 'other'], default: 'other' },
  officer: { type: String },
  status: { type: String, enum: ['potential', 'contacted', 'interested', 'proposal_sent', 'negotiating', 'converted', 'rejected'], default: 'potential' },
  notes: { type: String },
  tags: [{ type: String }],
  lastContactDate: { type: Date },
  nextContactDate: { type: Date }
}, { timestamps: true });

const PotentialClient = mongoose.model('PotentialClient', potentialClientSchema);

// Evaluation Schema
const evaluationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true },
  evaluatorId: { type: String, required: true },
  evaluatorName: { type: String, required: true },
  decision: { type: String, enum: ['approved', 'rejected', 'needs_more_info'], required: true },
  score: { type: Number },
  comments: { type: String },
  riskAssessment: { type: String },
  recommendedAmount: { type: Number },
  conditions: [{ type: String }]
}, { timestamps: true });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

// Email Verification Schema
const emailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  otp: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 10 * 60 * 1000) }, // 10 minutes
  attempts: { type: Number, default: 0, max: 5 }
}, { timestamps: true });

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

// Pending Registration Schema
const pendingRegistrationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, enum: ['salesman', 'evaluator'], default: 'salesman' },
  isEmailVerified: { type: Boolean, default: true }, // Must be true to reach this stage
  status: { type: String, enum: ['pending_approval', 'approved', 'rejected'], default: 'pending_approval' }
}, { timestamps: true });

const PendingRegistration = mongoose.model('PendingRegistration', pendingRegistrationSchema);

// Email Configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Test email configuration on startup
console.log('📧 Email Configuration:');
console.log('  - Host:', process.env.EMAIL_HOST || 'smtp.gmail.com (default)');
console.log('  - Port:', parseInt(process.env.EMAIL_PORT) || 587);
console.log('  - User:', process.env.EMAIL_USER || 'NOT CONFIGURED');
console.log('  - Pass:', process.env.EMAIL_PASS ? '****** (configured)' : 'NOT CONFIGURED');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
    process.env.EMAIL_USER === 'your-email@gmail.com' || 
    process.env.EMAIL_PASS === 'your-app-password') {
  console.log('⚠️  WARNING: Email credentials not properly configured!');
  console.log('   Email verification will not work until you set up EMAIL_USER and EMAIL_PASS in .env file');
}

// Email Templates
const generateOTPEmail = (otp) => ({
  subject: 'WhizUnik Portal - Email Verification',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Email Verification Required</h2>
      <p>Thank you for registering with WhizUnik Portal!</p>
      <p>Please use the following OTP to verify your email address:</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p><strong>This OTP will expire in 10 minutes.</strong></p>
      <p>If you didn't request this verification, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px;">WhizUnik Portal Team</p>
    </div>
  `
});

const generateApprovalNotificationEmail = (username) => ({
  subject: 'WhizUnik Portal - Account Approved',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Account Approved!</h2>
      <p>Hello ${username},</p>
      <p>Great news! Your WhizUnik Portal account has been approved by our administrators.</p>
      <p>You can now log in to your account and start using the platform.</p>
      <p><a href="https://whizunikhub.com/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login Now</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px;">WhizUnik Portal Team</p>
    </div>
  `
});

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

// Always include whizunikhub.com domains
allowedOrigins.push('https://whizunikhub.com', 'http://whizunikhub.com');

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Database initialization will be handled by endpoints

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Working server is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health - Health check',
      'POST /api/auth/login - User login',
      'GET /api/auth/me - Get current user',
      'GET /api/potential-clients - Get potential clients',
      'POST /api/potential-clients - Create potential client',
      'PUT /api/potential-clients/:id - Update potential client',
      'DELETE /api/potential-clients/:id - Delete potential client',
      'GET /api/applications - Get applications',
      'POST /api/applications - Create application',
      'POST /api/applications/verify-password - Verify application password',
      'GET /api/applications/token/:token - Get application by token',
      'PUT /api/applications/:id - Update application',
      'POST /api/applications/:id/documents - Upload documents to application',
      'GET /api/documents/view/:documentId - View document details',
      'GET /api/documents/download/:documentId - Download document',
      'GET /api/evaluations/pending-applications - Get pending applications for evaluation',
      'GET /api/evaluations - Get evaluations',
      'POST /api/evaluations - Create evaluation',
      'GET /api/evaluations/application/:id - Get evaluation for application'
    ]
  });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-demo-secret-change-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth endpoints

// Step 1: Request Email Verification
app.post('/api/auth/request-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if there's already a pending registration
    const existingPending = await PendingRegistration.findOne({ email });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'Registration request already pending for this email'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing verification record for this email
    await EmailVerification.deleteOne({ email });

    // Create new verification record
    const verification = new EmailVerification({
      email,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    await verification.save();

    // Send OTP email
    try {
      const emailContent = generateOTPEmail(otp);
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@whizunik.com',
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      res.status(200).json({
        success: true,
        message: 'Verification code sent to your email. Please check your inbox.',
        data: { email }
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // In development, provide more details; in production, just indicate success
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Development OTP:', otp); // Log to console only
        res.status(200).json({
          success: true,
          message: 'Email service unavailable in development. Check server console for OTP.',
          data: { email }
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Verification code sent to your email. Please check your inbox.',
          data: { email }
        });
      }
    }
  } catch (error) {
    console.error('Request verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Step 2: Verify Email OTP
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Find verification record
    const verification = await EmailVerification.findOne({ email });
    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'No verification request found for this email'
      });
    }

    // Check if expired
    if (verification.expiresAt < new Date()) {
      await EmailVerification.deleteOne({ email });
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Check attempts
    if (verification.attempts >= 5) {
      await EmailVerification.deleteOne({ email });
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new verification code.'
      });
    }

    // Verify OTP
    if (verification.otp !== otp) {
      verification.attempts += 1;
      await verification.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
        attemptsLeft: 5 - verification.attempts
      });
    }

    // Mark as verified
    verification.isVerified = true;
    await verification.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now complete your registration.',
      data: { email, isVerified: true }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Step 3: Complete Registration (after email verification)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, role = 'salesman' } = req.body;

    // Check if email is verified
    const verification = await EmailVerification.findOne({ email, isVerified: true });
    if (!verification) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified. Please verify your email first.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with pending status (needs admin approval)
    const user = new User({
      email,
      password: hashedPassword,
      username,
      role,
      status: 'pending' // User needs admin approval
    });

    await user.save();

    // Clean up verification record
    await EmailVerification.deleteOne({ email });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval. You will be notified once approved.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: user.status === 'pending' 
          ? 'Your account is pending admin approval. Please wait for approval before logging in.'
          : 'Your account has been rejected. Please contact an administrator.'
      });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { 
        id: user._id,
        userId: user._id, 
        email: user.email, 
        role: user.role,
        username: user.username
      },
      process.env.JWT_SECRET || 'fallback-demo-secret-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user endpoint
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Potential Clients endpoints
app.get('/api/potential-clients', authenticateToken, async (req, res) => {
  try {
    const potentialClients = await PotentialClient.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: potentialClients,
      count: potentialClients.length
    });
  } catch (error) {
    console.error('Error fetching potential clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch potential clients'
    });
  }
});

app.post('/api/potential-clients', authenticateToken, async (req, res) => {
  try {
    const newClient = new PotentialClient({
      ...req.body,
      createdBy: req.user.userId
    });

    const savedClient = await newClient.save();

    console.log('Created potential client:', savedClient.companyName);

    res.status(201).json({
      success: true,
      message: 'Potential client created successfully',
      data: savedClient
    });
  } catch (error) {
    console.error('Error creating potential client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create potential client'
    });
  }
});

app.put('/api/potential-clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedClient = await PotentialClient.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({
        success: false,
        message: 'Potential client not found'
      });
    }

    console.log('Updated potential client:', updatedClient.companyName);

    res.json({
      success: true,
      message: 'Potential client updated successfully',
      data: updatedClient
    });
  } catch (error) {
    console.error('Error updating potential client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update potential client'
    });
  }
});

app.delete('/api/potential-clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedClient = await PotentialClient.findByIdAndDelete(id);

    if (!deletedClient) {
      return res.status(404).json({
        success: false,
        message: 'Potential client not found'
      });
    }

    console.log('Deleted potential client:', deletedClient.companyName);

    res.json({
      success: true,
      message: 'Potential client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting potential client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete potential client'
    });
  }
});

// Applications endpoints (basic CRUD)
app.get('/api/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications'
    });
  }
});

app.post('/api/applications', authenticateToken, async (req, res) => {
  try {
    const newApplication = new Application({
      ...req.body,
      salesmanId: req.user.userId,
      linkToken: `link-${Date.now()}`,
      status: 'draft'
    });

    const savedApplication = await newApplication.save();

    console.log('Created application:', savedApplication.clientName);

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: savedApplication
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application'
    });
  }
});

// Verify password for application access
app.post('/api/applications/verify-password', async (req, res) => {
  try {
    const { linkToken, password } = req.body;
    
    if (!linkToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Link token and password are required'
      });
    }

    // Find application by linkToken
    const application = await Application.findOne({ linkToken: linkToken });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if password matches (in a real app, you'd hash and compare)
    // For now, we'll assume the password is stored in the application object
    const isPasswordValid = application.password === password || 
                           application.accessPassword === password ||
                           password === 'defaultpassword'; // fallback for demo

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Return the application data
    res.json({
      success: true,
      message: 'Password verified successfully',
      data: {
        application: application
      }
    });

  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify password'
    });
  }
});

// Get application by token (public access for application viewing)
app.get('/api/applications/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Find application by linkToken
    const application = await Application.findOne({ linkToken: token });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Return the application data
    res.json({
      success: true,
      data: {
        application: application
      }
    });

  } catch (error) {
    console.error('Error fetching application by token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application'
    });
  }
});

// Get application by ID (for evaluations)
app.get('/api/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    // Find application by ID
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    console.log('📋 Application fetched by ID:', id);
    console.log('📊 Application data:', {
      clientName: application.clientName,
      companyName: application.companyName,
      status: application.status
    });

    // Return the application data
    res.json(application);

  } catch (error) {
    console.error('Error fetching application by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application'
    });
  }
});

// Update application by ID
app.put('/api/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    // Find and update application by ID
    const updatedApplication = await Application.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: {
        application: updatedApplication
      }
    });

  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application'
    });
  }
});

// Document upload endpoint for applications
app.post('/api/applications/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }

    // Find application by ID
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Since we're not actually storing files in this demo, 
    // we'll just simulate successful upload
    const documentInfo = {
      uploadedAt: new Date(),
      documentCount: req.files ? req.files.length : 1,
      status: 'uploaded'
    };

    // Update application with document info
    if (!application.documents) {
      application.documents = [];
    }
    
    application.documents.push(documentInfo);
    await application.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        documents: documentInfo,
        application: application
      }
    });

  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents'
    });
  }
});

// Document viewing endpoint
app.get('/api/documents/view/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log('📄 Document view request for ID:', documentId);
    
    // Find application that contains this document
    const application = await Application.findOne({
      'documents._id': documentId
    });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const document = application.documents.find(doc => doc._id.toString() === documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    console.log('📄 Found document:', document.fileName);
    
    // For demo purposes, generate a simple PDF content
    const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/ProcSet [/PDF /Text]
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 120
>>
stream
BT
/F1 24 Tf
100 700 Td
(${document.fileName}) Tj
0 -50 Td
(Demo Document for Evaluation) Tj
0 -30 Td
(Client: ${application.clientName}) Tj
0 -30 Td
(Company: ${application.companyName}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000251 00000 n 
0000000421 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
490
%%EOF`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
    res.send(pdfContent);
    
  } catch (error) {
    console.error('Error viewing document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to view document'
    });
  }
});

// Document download endpoint
app.get('/api/documents/download/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log('⬇️ Document download request for ID:', documentId);
    
    // Find application that contains this document
    const application = await Application.findOne({
      'documents._id': documentId
    });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    const document = application.documents.find(doc => doc._id.toString() === documentId);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    console.log('⬇️ Downloading document:', document.fileName);
    
    // For demo purposes, generate a simple PDF content
    const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/ProcSet [/PDF /Text]
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 150
>>
stream
BT
/F1 24 Tf
100 700 Td
(${document.fileName}) Tj
0 -50 Td
(Demo Document for Download) Tj
0 -30 Td
(Client: ${application.clientName}) Tj
0 -30 Td
(Company: ${application.companyName}) Tj
0 -30 Td
(Type: ${document.documentType}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000251 00000 n 
0000000451 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
520
%%EOF`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.send(pdfContent);
    
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
});

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Admin routes
app.get('/api/admin/pending-users', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }, '-password').sort({ createdAt: -1 });
    
    console.log('📋 Admin requesting pending users. Found:', pendingUsers.length);
    
    res.json({
      success: true,
      data: pendingUsers
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending users'
    });
  }
});

app.patch('/api/admin/pending-users/:registrationId/approve', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Find the pending registration
    const pendingRegistration = await PendingRegistration.findById(registrationId);
    if (!pendingRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Pending registration not found'
      });
    }

    // Check if user already exists (safety check)
    const existingUser = await User.findOne({ email: pendingRegistration.email });
    if (existingUser) {
      // Clean up the pending registration
      await PendingRegistration.findByIdAndDelete(registrationId);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create the actual user account
    const user = new User({
      email: pendingRegistration.email,
      password: pendingRegistration.password, // Already hashed
      username: pendingRegistration.username,
      role: pendingRegistration.role,
      status: 'approved'
    });

    await user.save();

    // Update pending registration status
    pendingRegistration.status = 'approved';
    await pendingRegistration.save();

    // Send approval notification email
    try {
      const emailContent = generateApprovalNotificationEmail(pendingRegistration.username);
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@whizunik.com',
        to: pendingRegistration.email,
        subject: emailContent.subject,
        html: emailContent.html
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'User approved successfully and notification sent',
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving user'
    });
  }
});

app.patch('/api/admin/pending-users/:registrationId/reject', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;

    const pendingRegistration = await PendingRegistration.findByIdAndUpdate(
      registrationId,
      { status: 'rejected' },
      { new: true, select: '-password' }
    );

    if (!pendingRegistration) {
      return res.status(404).json({
        success: false,
        message: 'Pending registration not found'
      });
    }

    // Send rejection email (optional)
    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER || 'noreply@whizunik.com',
        to: pendingRegistration.email,
        subject: 'WhizUnik Portal - Registration Request Rejected',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Registration Request Rejected</h2>
            <p>Hello ${pendingRegistration.username},</p>
            <p>We regret to inform you that your registration request for WhizUnik Portal has been rejected.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>If you have any questions, please contact our support team.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">WhizUnik Portal Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'User registration rejected',
      data: pendingRegistration
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting user'
    });
  }
});

app.get('/api/admin/stats', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    // Get user counts
    const totalUsers = await User.countDocuments({ status: 'approved' });
    const totalSalesmen = await User.countDocuments({ role: 'salesman', status: 'approved' });
    const totalEvaluators = await User.countDocuments({ role: 'evaluator', status: 'approved' });
    const activeUsers = await User.countDocuments({ 'profile.isActive': true, status: 'approved' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });

    // Mock application data for now
    const totalApplications = 0;
    const pendingApplications = 0;
    const approvedApplications = 0;
    const rejectedApplications = 0;
    const totalRevenue = 2500000;
    const monthlyRevenue = 425000;

    const stats = {
      totalUsers,
      totalSalesmen,
      totalEvaluators,
      activeUsers,
      pendingUsers,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalRevenue,
      monthlyRevenue
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

app.get('/api/admin/users', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    console.log('📋 Admin requesting users list. Found', users.length, 'users:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user._id} - ${user.email} (${user.role}) - Status: ${user.status}`);
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Admin applications endpoint
app.get('/api/admin/applications', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    console.log('📋 Admin requesting applications list...');
    
    const applications = await Application.find({})
      .populate('salesmanId', 'username email role')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Found ${applications.length} applications for admin`);
    
    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('❌ Error fetching applications for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
});

// Admin user management endpoints
app.patch('/api/admin/users/:userId/approve', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('👤 Admin approving user:', userId);
    console.log('🔍 Searching for user with ID:', userId);
    
    // First check if user exists
    const existingUser = await User.findById(userId);
    console.log('🔍 User lookup result:', existingUser ? 'Found' : 'Not found');
    
    if (!existingUser) {
      console.log('❌ User not found in database:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
        debug: { userId, searchResult: 'not_found' }
      });
    }
    
    console.log('👤 Found user:', existingUser.email, 'Current status:', existingUser.status);
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status: 'approved',
        'profile.isActive': true 
      },
      { new: true, select: '-password' }
    );
    
    console.log('✅ User approved successfully:', user.email);
    
    res.json({
      success: true,
      message: 'User approved successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ Error approving user:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving user',
      error: error.message
    });
  }
});

app.patch('/api/admin/users/:userId/reject', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('👤 Admin rejecting user:', userId);
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        status: 'rejected',
        'profile.isActive': false 
      },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('❌ User rejected:', user.email);
    
    res.json({
      success: true,
      message: 'User rejected successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ Error rejecting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting user'
    });
  }
});

app.delete('/api/admin/users/:userId', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('👤 Admin deleting user:', userId);
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deletion of admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }
    
    await User.findByIdAndDelete(userId);
    
    console.log('🗑️ User deleted:', user.email);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

app.patch('/api/admin/users/:userId/toggle-active', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('👤 Admin toggling user active status:', userId);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const newActiveStatus = !user.profile.isActive;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 'profile.isActive': newActiveStatus },
      { new: true, select: '-password' }
    );
    
    console.log(`🔄 User ${newActiveStatus ? 'activated' : 'deactivated'}:`, updatedUser.email);
    
    res.json({
      success: true,
      message: `User ${newActiveStatus ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    console.error('❌ Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

app.patch('/api/admin/users/:userId/role', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['salesman', 'evaluator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    console.log('👤 Admin changing user role:', userId, 'to', role);
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('🔄 User role updated:', user.email, 'is now', role);
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role'
    });
  }
});

// Database initialization will be handled by endpoints

// Evaluation endpoints
app.get('/api/evaluations/pending-applications', authenticateToken, async (req, res) => {
  try {
    // Get all applications for now to debug - we can filter later
    console.log('🔍 EvaluatorDashboard: Fetching all applications for debugging...');
    const allApps = await Application.find().sort({ createdAt: -1 });
    console.log(`📊 Found ${allApps.length} total applications`);
    
    allApps.forEach((app, index) => {
      console.log(`${index + 1}. ${app._id} - ${app.clientName} (${app.companyName}) - Status: ${app.status}`);
    });
    
    // For now, return all applications so evaluators can see them
    res.json({
      success: true,
      data: allApps,
      count: allApps.length
    });
  } catch (error) {
    console.error('Error fetching pending applications for evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending applications'
    });
  }
});

app.get('/api/evaluations', authenticateToken, async (req, res) => {
  try {
    const evaluations = await Evaluation.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: evaluations,
      count: evaluations.length
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluations'
    });
  }
});

app.post('/api/evaluations', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Received evaluation data:', JSON.stringify(req.body, null, 2));
    console.log('👤 Evaluator info:', { id: req.user.id, username: req.user.username });
    
    const evaluation = new Evaluation({
      applicationId: req.body.applicationId,
      evaluatorId: req.user.id,
      evaluatorName: req.user.username,
      decision: req.body.decision,
      score: req.body.score,
      comments: req.body.comments,
      riskAssessment: req.body.riskAssessment,
      recommendedAmount: req.body.recommendedAmount,
      conditions: req.body.conditions
    });

    const savedEvaluation = await evaluation.save();

    // Update the application status based on evaluation
    const application = await Application.findOne({ _id: req.body.applicationId });
    if (application) {
      application.status = req.body.decision === 'approved' ? 'approved' : 
                          req.body.decision === 'rejected' ? 'rejected' : 
                          'needs_more_info';
      application.evaluationId = savedEvaluation._id;
      await application.save();
    }

    res.json({
      success: true,
      data: evaluation,
      message: 'Evaluation submitted successfully'
    });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create evaluation'
    });
  }
});

app.get('/api/evaluations/application/:applicationId', authenticateToken, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const evaluation = await Evaluation.findOne({ applicationId: applicationId });
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found for this application'
      });
    }

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error fetching evaluation for application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch evaluation'
    });
  }
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  try {
    const testOTP = '123456';
    const emailContent = generateOTPEmail(testOTP);
    
    console.log('📧 Testing email to:', email);
    console.log('📧 Using credentials:', {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      user: process.env.EMAIL_USER || 'NOT SET',
      hasPassword: !!(process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password')
    });

    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@whizunik.com',
      to: email,
      subject: 'WhizUnik Portal - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Test Successful!</h2>
          <p>If you receive this email, your email configuration is working correctly.</p>
          <p>Test OTP: <strong>${testOTP}</strong></p>
          <p style="color: #6b7280; font-size: 14px;">WhizUnik Portal Team</p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully');
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully! Check your inbox.'
    });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Email test failed: ' + error.message,
      details: error.code || 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 ==========================================');
  console.log('🚀 WhizUnik Portal Server Started!');
  console.log('🚀 ==========================================');
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: http://localhost:5173`);
  console.log('🚀 ==========================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
