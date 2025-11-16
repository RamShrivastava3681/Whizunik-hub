const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 80;

// MongoDB Connection
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finlink-hub';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, enum: ['salesman', 'evaluator', 'admin'], default: 'salesman' },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    department: String
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Application Schema
const applicationSchema = new mongoose.Schema({
  salesmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String, required: true },
  companyName: { type: String, required: true },
  linkToken: { type: String, required: true, unique: true },
  applicationPasswordHash: String,
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'in-progress', 'submitted', 'approved', 'rejected'],
    default: 'pending'
  },
  applicationData: mongoose.Schema.Types.Mixed,
  documents: [{
    fileName: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadDate: { type: Date, default: Date.now },
    documentType: String,
    filePath: String
  }],
  timeline: [{
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    notes: String
  }]
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);

// Potential Client Schema
const potentialClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  salesmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['potential', 'contacted', 'interested', 'converted', 'rejected'],
    default: 'potential'
  },
  notes: String,
  tags: [String]
}, { timestamps: true });

const PotentialClient = mongoose.model('PotentialClient', potentialClientSchema);

// Evaluation Schema
const evaluationSchema = new mongoose.Schema({
  evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  creditScoring: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String, default: '' },
    score: { type: Number, default: 0 },
    factors: {
      currentAssets: { type: Number, default: 0 },
      currentLiabilities: { type: Number, default: 0 },
      nonCurrentLiabilities: { type: Number, default: 0 },
      inventory: { type: Number, default: 0 },
      equity: { type: Number, default: 0 },
      netProfit: { type: Number, default: 0 },
      revenueCurrentYear: { type: Number, default: 0 },
      revenuePreviousYear: { type: Number, default: 0 },
      onTimePayments: { type: Number, default: 0 },
      topClientDependency: { type: Number, default: 0 },
      dilution: { type: Boolean, default: false }
    }
  },
  kyc: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String, default: '' },
    documents: {
      identityVerified: { type: Boolean, default: false },
      addressVerified: { type: Boolean, default: false },
      businessRegistration: { type: Boolean, default: false },
      financialStatements: { type: Boolean, default: false }
    }
  },
  aml: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String, default: '' },
    checks: {
      sanctionsList: { type: Boolean, default: false },
      pepCheck: { type: Boolean, default: false },
      adverseMedia: { type: Boolean, default: false },
      sourceOfFunds: { type: Boolean, default: false }
    }
  },
  riskAssessment: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    notes: { type: String, default: '' },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    factors: {
      country: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      industry: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      transactionAmount: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      clientProfile: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    },
    checklist: mongoose.Schema.Types.Mixed
  },
  financialHealth: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    score: { type: Number, default: 0 },
    analysis: { type: String, default: '' }
  },
  overallStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  completedSteps: { type: Number, default: 0 },
  finalNotes: { type: String, default: '' },
  finalRecommendation: { type: String, default: '' }
}, { timestamps: true });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

// Middleware - CORS Configuration
let allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

// Always include whizunikhub.com and portal.whizunikhub.com domains
const productionOrigins = [
  'https://whizunikhub.com', 
  'http://whizunikhub.com', 
  'https://portal.whizunikhub.com', 
  'http://portal.whizunikhub.com',
  'https://www.whizunikhub.com',
  'http://www.portal.whizunikhub.com'
];

allowedOrigins = [...new Set([...allowedOrigins, ...productionOrigins])];

console.log('🌐 CORS Configuration:');
console.log('  - Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      return callback(null, true);
    } else {
      console.log('❌ CORS: Origin rejected:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'WhizUnik Hub API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    cors: allowedOrigins
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'WhizUnik Hub API /api endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    cors_origins: allowedOrigins,
    endpoints: {
      health: '/health',
      api_health: '/api/health',
      auth_login: '/api/auth/login',
      applications: '/api/applications'
    }
  });
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt for:', email, 'with password:', password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    console.log('🔍 Looking for user with email:', email);
    const user = await User.findOne({ email });
    console.log('🔍 User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'User not found: ' + email
      });
    }

    console.log('🔍 User details:', {
      id: user._id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password
    });

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔍 Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRY || '1h' }
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
          profile: user.profile
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

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Application Routes
app.get('/api/applications/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const application = await Application.findOne({ linkToken: token })
      .populate('salesmanId', 'username email');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: { application }
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update application
app.put('/api/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { applicationData, status } = req.body;

    const application = await Application.findByIdAndUpdate(
      id,
      { 
        applicationData,
        status,
        $push: {
          timeline: {
            action: status === 'submitted' ? 'Application submitted' : 'Application updated',
            notes: status === 'submitted' ? 'Client submitted application' : 'Application data updated'
          }
        }
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word, Excel, and image files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    files: 10
  },
  fileFilter: fileFilter
});

// Document upload endpoint
app.post('/api/applications/:id/documents', upload.array('documents', 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const documents = req.files.map(file => ({
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      filePath: file.path,
      documentType: 'general'
    }));

    const application = await Application.findByIdAndUpdate(
      id,
      { 
        $push: { 
          documents: { $each: documents },
          timeline: {
            action: 'Documents uploaded',
            notes: `${documents.length} document(s) uploaded`
          }
        }
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: { documents }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all applications (for admin/evaluator dashboard)
app.get('/api/applications', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'evaluator' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Evaluator or admin role required.'
      });
    }

    const applications = await Application.find({})
      .populate('salesmanId', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('❌ Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all potential clients
app.get('/api/potential-clients', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user;
    
    let query = {};
    if (role === 'salesman') {
      // Salesmen can only see their own potential clients
      query.salesmanId = userId;
    }
    // Evaluators and admins can see all potential clients

    const potentialClients = await PotentialClient.find(query)
      .populate('salesmanId', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: potentialClients
    });
  } catch (error) {
    console.error('❌ Get potential clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Evaluation Routes

// Get pending applications for evaluation
app.get('/api/evaluations/pending-applications', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    
    if (role !== 'evaluator' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Evaluator role required.'
      });
    }

    // Find applications that are submitted but don't have evaluations yet
    const applicationsWithEvaluations = await Evaluation.distinct('applicationId');
    
    const pendingApplications = await Application.find({
      _id: { $nin: applicationsWithEvaluations },
      status: { $in: ['submitted', 'in-progress'] }
    })
    .populate('salesmanId', 'username email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pendingApplications
    });
  } catch (error) {
    console.error('❌ Get pending applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Evaluation Routes

// Get or create evaluation by application ID
app.get('/api/evaluations/application/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { applicationId } = req.params;

    if (role !== 'evaluator' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Evaluator role required.'
      });
    }

    // First try to find existing evaluation
    let evaluation = await Evaluation.findOne({ applicationId })
      .populate('applicationId', 'clientName companyName status linkToken applicationData documents createdAt')
      .populate('evaluatorId', 'username email');

    if (!evaluation) {
      // Create a new evaluation if none exists
      const newEvaluation = new Evaluation({
        evaluatorId: userId,
        applicationId
      });
      await newEvaluation.save();

      evaluation = await Evaluation.findById(newEvaluation._id)
        .populate('applicationId', 'clientName companyName status linkToken applicationData documents createdAt')
        .populate('evaluatorId', 'username email');
    }

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('❌ Get evaluation by application error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update evaluation
app.put('/api/evaluations/:id', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const evaluationId = req.params.id;
    const updateData = req.body;

    if (role !== 'evaluator' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Evaluator role required.'
      });
    }

    const evaluation = await Evaluation.findByIdAndUpdate(
      evaluationId,
      updateData,
      { new: true, runValidators: true }
    ).populate('applicationId', 'clientName companyName status linkToken applicationData documents')
      .populate('evaluatorId', 'username email');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('❌ Update evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Generate and download evaluation memo as PDF
app.get('/api/evaluations/memo/:applicationId', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { applicationId } = req.params;

    if (role !== 'evaluator' && role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Evaluator role required.'
      });
    }

    console.log('📄 Generating evaluation memo for application:', applicationId);

    // Get evaluation data
    const evaluation = await Evaluation.findOne({ applicationId })
      .populate('applicationId', 'clientName companyName status linkToken applicationData documents createdAt')
      .populate('evaluatorId', 'username email');

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation not found'
      });
    }

    const application = evaluation.applicationId;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const getRiskLevelText = (riskLevel) => {
      switch(riskLevel) {
        case 'low': return 'LOW RISK';
        case 'medium': return 'MEDIUM RISK';
        case 'high': return 'HIGH RISK';
        default: return 'PENDING ASSESSMENT';
      }
    };

    const getChecklistSummary = (checklist) => {
      if (!checklist) return 'No checklist data available';
      const items = Object.entries(checklist);
      const completed = items.filter(([key, value]) => value === true).length;
      const total = items.length;
      return `${completed}/${total} items completed`;
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'approved': return 'APPROVED';
        case 'rejected': return 'REJECTED';
        default: return 'PENDING REVIEW';
      }
    };

    // Generate HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Credit Memorandum</title>
        <style>
          @page {
            margin: 0.75in;
            size: A4;
          }
          
          body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            color: #000;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #000;
          }
          
          .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #000;
            margin-bottom: 8px;
            letter-spacing: 3px;
          }
          
          .company-address {
            font-size: 10px;
            color: #333;
            margin-bottom: 15px;
            line-height: 1.2;
          }
          
          .memo-title {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-top: 15px;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-decoration: underline;
          }
          
          .memo-header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            border: 2px solid #000;
          }
          
          .memo-header-table td {
            padding: 8px 12px;
            border: 1px solid #000;
            font-size: 11px;
            vertical-align: top;
          }
          
          .memo-header-label {
            font-weight: bold;
            background: #f5f5f5;
            width: 25%;
          }
          
          .memo-header-value {
            width: 25%;
          }
          
          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            margin-bottom: 12px;
            text-transform: uppercase;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
          }
          
          .content-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            border: 1px solid #000;
          }
          
          .content-table th {
            background: #e8e8e8;
            padding: 8px;
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            border: 1px solid #000;
          }
          
          .content-table td {
            padding: 6px 8px;
            border: 1px solid #000;
            font-size: 11px;
            vertical-align: top;
          }
          
          .amount-cell {
            text-align: right;
            font-weight: bold;
          }
          
          .recommendation-section {
            background: #f0f0f0;
            border: 2px solid #000;
            padding: 20px;
            margin: 25px 0;
            page-break-inside: avoid;
          }
          
          .recommendation-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            text-transform: uppercase;
            text-decoration: underline;
          }
          
          .decision-box {
            border: 3px solid #000;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
            background: #ffffff;
          }
          
          .decision-text {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
          }
          
          .signature-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
          }
          
          .signature-table td {
            padding: 20px;
            border: 1px solid #000;
            text-align: center;
            vertical-align: bottom;
            height: 80px;
          }
          
          .signature-label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            border-top: 2px solid #000;
            padding-top: 5px;
            margin-top: 40px;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #000;
            text-align: center;
            font-size: 9px;
            color: #333;
          }
          
          .confidential-stamp {
            position: absolute;
            top: 100px;
            right: 50px;
            transform: rotate(15deg);
            border: 3px solid #ff0000;
            color: #ff0000;
            padding: 10px 20px;
            font-weight: bold;
            font-size: 14px;
            background: rgba(255, 255, 255, 0.9);
          }
          
          .bold { font-weight: bold; }
          .center { text-align: center; }
          .right { text-align: right; }
          .underline { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="confidential-stamp">CONFIDENTIAL</div>
        
        <div class="header">
          <div class="company-logo">WHIZUNIK FINANCIAL SERVICES</div>
          <div class="company-address">
            Trade Finance & Credit Solutions<br>
            123 Financial District, Business Tower<br>
            Phone: +1 (555) 123-4567 | Email: credit@whizunik.com
          </div>
          <div class="memo-title">Credit Memorandum</div>
        </div>

        <table class="memo-header-table">
          <tr>
            <td class="memo-header-label">TO:</td>
            <td class="memo-header-value">Credit Committee</td>
            <td class="memo-header-label">DATE:</td>
            <td class="memo-header-value">${currentDate}</td>
          </tr>
          <tr>
            <td class="memo-header-label">FROM:</td>
            <td class="memo-header-value">${evaluation.evaluatorId.username} - Credit Analyst</td>
            <td class="memo-header-label">REF NO:</td>
            <td class="memo-header-value">CM-${application._id.toString().substring(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td class="memo-header-label">SUBJECT:</td>
            <td class="memo-header-value" colspan="3">Credit Application Assessment - ${application.companyName}</td>
          </tr>
        </table>

        <div class="section">
          <div class="section-title">I. Executive Summary</div>
          <p>This memorandum presents the credit analysis and recommendation for <strong>${application.companyName}</strong> 
          (the "Applicant"), submitted on ${new Date(application.createdAt).toLocaleDateString()}. 
          Based on our comprehensive evaluation of the applicant's financial position, business operations, 
          and proposed transaction structure, we recommend <strong>${getStatusText(evaluation.overallStatus)}</strong> 
          for this credit facility.</p>
        </div>

        <div class="section">
          <div class="section-title">II. Applicant Information</div>
          <table class="content-table">
            <tr>
              <td class="bold" style="width: 30%">Company Name:</td>
              <td>Apollo International Limited</td>
              <td class="bold" style="width: 30%">Channel:</td>
              <td>VOLOFIN</td>
            </tr>
            <tr>
              <td class="bold">Country:</td>
              <td>India</td>
              <td class="bold">Industry:</td>
              <td>Leather/skin</td>
            </tr>
            <tr>
              <td class="bold">Total Limit Requested:</td>
              <td class="amount-cell">300,000 USD</td>
              <td class="bold">Total Limit Approved:</td>
              <td class="amount-cell">100,000 USD</td>
            </tr>
            <tr>
              <td class="bold">Discount Fee:</td>
              <td>5.90%</td>
              <td class="bold">Supplier Rating:</td>
              <td>N/A</td>
            </tr>
            <tr>
              <td class="bold">Factoring Fee:</td>
              <td>0.78% (60 days)</td>
              <td class="bold">Advance Ratio:</td>
              <td>85%</td>
            </tr>
            <tr>
              <td class="bold">Additional Fee:</td>
              <td>N/A</td>
              <td class="bold">Polytrade SSR:</td>
              <td>5</td>
            </tr>
            <tr>
              <td class="bold">Facility Approved by:</td>
              <td>THIERRY LASSY TATY</td>
              <td class="bold">Date of Approval:</td>
              <td>09/02/2022</td>
            </tr>
            <tr>
              <td class="bold">Next Review:</td>
              <td colspan="3">08/02/2023</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">III. Credit Assessment & MTF Scoring Results</div>
          <table class="content-table">
            <thead>
              <tr>
                <th>Assessment Category</th>
                <th>Status</th>
                <th>Score/Result</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Credit Scoring Analysis</strong></td>
                <td class="center">${getStatusText(evaluation.creditScoring.status)}</td>
                <td class="center">${evaluation.creditScoring.score}/100</td>
                <td>${evaluation.creditScoring.notes || 'Standard MTF assessment completed'}</td>
              </tr>
              <tr>
                <td><strong>KYC Compliance</strong></td>
                <td class="center">${getStatusText(evaluation.kyc.status)}</td>
                <td class="center">Documents: ${Object.values(evaluation.kyc.documents).filter(Boolean).length}/4 Verified</td>
                <td>${evaluation.kyc.notes || 'KYC documentation review completed'}</td>
              </tr>
              <tr>
                <td><strong>AML Screening</strong></td>
                <td class="center">${getStatusText(evaluation.aml.status)}</td>
                <td class="center">Checks: ${Object.values(evaluation.aml.checks).filter(Boolean).length}/4 Passed</td>
                <td>${evaluation.aml.notes || 'AML screening process completed'}</td>
              </tr>
              <tr>
                <td><strong>Risk Assessment</strong></td>
                <td class="center">${getStatusText(evaluation.riskAssessment.status)}</td>
                <td class="center">${getRiskLevelText(evaluation.riskAssessment.riskLevel)}</td>
                <td>Comprehensive risk evaluation completed</td>
              </tr>
              <tr>
                <td><strong>Financial Health Assessment</strong></td>
                <td class="center">${getStatusText(evaluation.financialHealth?.status || 'pending')}</td>
                <td class="center">${evaluation.financialHealth?.score || 'N/A'}/100</td>
                <td>${evaluation.financialHealth?.analysis || 'Financial analysis completed'}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 5px;">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #374151;"><strong>MTF Scoring Breakdown:</strong></h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 10px;">
              <div><strong>Current Assets:</strong> $${evaluation.creditScoring.factors.currentAssets?.toLocaleString() || 'N/A'}</div>
              <div><strong>Current Liabilities:</strong> $${evaluation.creditScoring.factors.currentLiabilities?.toLocaleString() || 'N/A'}</div>
              <div><strong>Net Profit:</strong> $${evaluation.creditScoring.factors.netProfit?.toLocaleString() || 'N/A'}</div>
              <div><strong>Revenue (Current):</strong> $${evaluation.creditScoring.factors.revenueCurrentYear?.toLocaleString() || 'N/A'}</div>
              <div><strong>Revenue (Previous):</strong> $${evaluation.creditScoring.factors.revenuePreviousYear?.toLocaleString() || 'N/A'}</div>
              <div><strong>On-time Payments:</strong> ${evaluation.creditScoring.factors.onTimePayments || 'N/A'}%</div>
              <div><strong>Top Client Dependency:</strong> ${evaluation.creditScoring.factors.topClientDependency || 'N/A'}%</div>
              <div><strong>Dilution Risk:</strong> ${evaluation.creditScoring.factors.dilution ? 'YES' : 'NO'}</div>
            </div>
          </div>

          ${evaluation.riskAssessment.checklist ? `
          <div style="margin-top: 15px; padding: 15px; background: #f9fafb; border-radius: 5px;">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #374151;"><strong>Risk Assessment Checklist Summary:</strong></h4>
            <div style="font-size: 10px; line-height: 1.4;">
              ${getChecklistSummary ? getChecklistSummary(evaluation.riskAssessment.checklist) : 'Checklist completed'}
            </div>
          </div>
          ` : ''}

          <div style="margin-top: 15px; padding: 15px; background: #e6f3ff; border-left: 4px solid #1e40af;">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #1e40af;"><strong>Overall Assessment Summary:</strong></h4>
            <p style="margin: 0; font-size: 11px; line-height: 1.4;">
              <strong>Status:</strong> ${getStatusText(evaluation.overallStatus)} | 
              <strong>Completed Steps:</strong> ${evaluation.completedSteps}/4 | 
              <strong>Final Score:</strong> ${evaluation.creditScoring.score}/100
            </p>
            ${evaluation.finalNotes ? `
            <p style="margin: 8px 0 0 0; font-size: 10px; line-height: 1.4;">
              <strong>Evaluator Notes:</strong> ${evaluation.finalNotes}
            </p>
            ` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">IV. Client - Due Diligence</div>
          <table class="content-table">
            <thead>
              <tr>
                <th>Checks</th>
                <th>Results</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>AML - Anti-Money Laundering</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>n/a</td>
              </tr>
              <tr>
                <td>KYC</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>n/a</td>
              </tr>
              <tr>
                <td>PEP - Politically Exposed Person</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>n/a</td>
              </tr>
              <tr>
                <td>Adverse Media</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>n/a</td>
              </tr>
              <tr>
                <td>Client website verification</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>n/a</td>
              </tr>
              <tr>
                <td>Bank account verification</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>n/a</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7;">
            <strong>Observations:</strong> Alerts were identified on KARZA, but all are out to date. Last alerts were from 2017.
          </div>
        </div>

        <div class="section">
          <div class="section-title">V. Client - Organisation Information</div>
          
          <div class="subsection-title">Shareholding Structure:</div>
          <table class="content-table">
            <thead>
              <tr>
                <th>Shareholder Name</th>
                <th>Percentage of Shares</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OSK Holdings (AIL) Pvt Ltd</td>
                <td class="center">32.05%</td>
              </tr>
              <tr>
                <td>AIL Consultants Pvt Ltd</td>
                <td class="center">21.37%</td>
              </tr>
              <tr>
                <td>MR. RAAJA KANWAR</td>
                <td class="center">18.23%</td>
              </tr>
            </tbody>
          </table>

          <div class="subsection-title">Board of Directors:</div>
          <table class="content-table">
            <thead>
              <tr>
                <th>Director Name</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>RAAJA KANWAR</td>
                <td>Mr KANWAR owned 99.67% of OSK Holding.</td>
              </tr>
              <tr>
                <td>VIVEK BHARATI</td>
                <td>-</td>
              </tr>
              <tr>
                <td>UGAR SAIN ANAND</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">VI. Client – Financials (mm USD)</div>
          <table class="content-table">
            <thead>
              <tr>
                <th>Financial Metrics</th>
                <th>FY 2020</th>
                <th>FY 2021</th>
                <th>FY 2022</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Revenue</strong></td>
                <td class="amount-cell">3.617418</td>
                <td class="amount-cell">4.520934</td>
                <td class="amount-cell">5.320218</td>
              </tr>
              <tr>
                <td><strong>Revenue Growth (%)</strong></td>
                <td class="center">-19.99%</td>
                <td class="center">-15.02%</td>
                <td class="center">-</td>
              </tr>
              <tr>
                <td><strong>EBITDA</strong></td>
                <td class="amount-cell">0.325</td>
                <td class="amount-cell">0.171</td>
                <td class="amount-cell">0.244</td>
              </tr>
              <tr>
                <td><strong>EBITDA Margin</strong></td>
                <td class="center">8.98%</td>
                <td class="center">3.78%</td>
                <td class="center">4.58%</td>
              </tr>
              <tr>
                <td><strong>Profit / Loss</strong></td>
                <td class="amount-cell">0.089</td>
                <td class="amount-cell">0.132</td>
                <td class="amount-cell">0.098</td>
              </tr>
              <tr>
                <td><strong>Profit Margin</strong></td>
                <td class="center">2.45%</td>
                <td class="center">2.92%</td>
                <td class="center">1.84%</td>
              </tr>
              <tr>
                <td><strong>Total Asset</strong></td>
                <td class="amount-cell">6.310</td>
                <td class="amount-cell">6.122</td>
                <td class="amount-cell">5.472</td>
              </tr>
              <tr>
                <td><strong>Total ST Debt</strong></td>
                <td class="amount-cell">0.956</td>
                <td class="amount-cell">1.347</td>
                <td class="amount-cell">1.039</td>
              </tr>
              <tr>
                <td><strong>Total Debt</strong></td>
                <td class="amount-cell">0.933</td>
                <td class="amount-cell">1.216</td>
                <td class="amount-cell">1.518</td>
              </tr>
              <tr>
                <td><strong>Quick Ratio</strong></td>
                <td class="center">0.92</td>
                <td class="center">0.87</td>
                <td class="center">0.86</td>
              </tr>
              <tr>
                <td><strong>Leverage Ratio</strong></td>
                <td class="center">2.87</td>
                <td class="center">7.11</td>
                <td class="center">6.23</td>
              </tr>
              <tr>
                <td><strong>Interest Coverage Ratio</strong></td>
                <td class="center">1.04</td>
                <td class="center">0.31</td>
                <td class="center">0.67</td>
              </tr>
            </tbody>
          </table>
          
          <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 5px;">
            <h4 style="margin: 0 0 8px 0; font-size: 11px; color: #374151;"><strong>Financial Observations:</strong></h4>
            <p style="margin: 0; font-size: 10px; color: #6b7280; line-height: 1.4;">
              Over the last 3 years, Apollo have seen its activity significantly reduced, essentially due to Covid break impact. However, they also got benefits from this period by improving their profitability, having a far better use of their assets (a few investments have been done) and reducing their expenses as well. Despite the revenue decreased, the company financial structure has largely been strengthened by reducing the level of debt, increasing the assets. KARZA scores show a medium risk.
            </p>
            <p style="margin: 5px 0 0 0; font-size: 9px; color: #9ca3af; font-style: italic;">*Source: financials available on KARZA.</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">VII. Buyer Information</div>
          <table class="content-table">
            <tr>
              <td class="bold" style="width: 30%">Company Name:</td>
              <td>Andiamo international Ltd</td>
              <td class="bold" style="width: 30%">Polytrade BRR:</td>
              <td>5</td>
            </tr>
            <tr>
              <td class="bold">Country:</td>
              <td>UK</td>
              <td class="bold">Country Risk:</td>
              <td>AA - stable</td>
            </tr>
            <tr>
              <td class="bold">Point of Contact:</td>
              <td>Dawn Di Mambro</td>
              <td class="bold">Designation:</td>
              <td>-</td>
            </tr>
            <tr>
              <td class="bold">Contact Details:</td>
              <td colspan="3">dawn@andiamo-shoes.co.uk, +441256898692</td>
            </tr>
            <tr>
              <td class="bold">Full Address:</td>
              <td colspan="3">DEVONSHIRE HOUSE AVIARY COURT, WADE ROAD, BASINGSTOKE RG24 8PE, United Kingdom</td>
            </tr>
          </table>

          <div class="subsection-title">Buyer - Due Diligence:</div>
          <table class="content-table">
            <thead>
              <tr>
                <th>Checks</th>
                <th>Results</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>AML - Anti-Money Laundering</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>KYC</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>PEP - Politically Exposed Person</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Adverse Media</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>N/A</td>
              </tr>
              <tr>
                <td>Buyer website verification</td>
                <td class="center"><span style="color: green; font-weight: bold;">OK</span></td>
                <td>N/A</td>
              </tr>
            </tbody>
          </table>
          <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7;">
            <strong>Observations:</strong> No alert Creditsafe, Coface, Worldcheck.
          </div>
        </div>

        <div class="section">
          <div class="section-title">VIII. Supplier – Buyer Trade Relationship (in mnUSD)</div>
          <table class="content-table">
            <tr>
              <td class="bold" style="width: 40%">Timeline relationship:</td>
              <td>>3 years</td>
              <td class="bold" style="width: 40%">Part of Buyer in total Supplier's Portfolio:</td>
              <td>78%</td>
            </tr>
            <tr>
              <td class="bold">Total business over the last 12 months:</td>
              <td>0.93</td>
              <td class="bold">Usual Payment Terms:</td>
              <td>BL + 60 days</td>
            </tr>
            <tr>
              <td class="bold">Expected business for next 12 months:</td>
              <td>1.1</td>
              <td class="bold">Average Invoice Tenor:</td>
              <td>93 days</td>
            </tr>
            <tr>
              <td class="bold">Average invoice size:</td>
              <td>0.021</td>
              <td class="bold">Max. Invoice Tenor:</td>
              <td>103 days</td>
            </tr>
            <tr>
              <td class="bold">Max Invoice Amount:</td>
              <td>0.074</td>
              <td class="bold">Min. Invoice Tenor:</td>
              <td>74 days</td>
            </tr>
            <tr>
              <td class="bold">Min Invoice Amount:</td>
              <td colspan="3">0.011</td>
            </tr>
          </table>
          <div style="margin-top: 10px; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb;">
            <strong>Observations:</strong> Good payment experience, payments use to be received from the buyer on average 5-days before the due date. No dilution showed.
          </div>
        </div>

        <div class="section">
          <div class="section-title">IX. Buyer Limits</div>
          <table class="content-table">
            <tr>
              <td class="bold" style="width: 30%">CreditSafe Score:</td>
              <td>62</td>
              <td class="bold" style="width: 30%">Coface Score:</td>
              <td>8/10</td>
            </tr>
            <tr>
              <td class="bold">CreditSafe Limit:</td>
              <td>75,000 USD</td>
              <td class="bold">Coface Limit:</td>
              <td>75,000 EUR</td>
            </tr>
            <tr>
              <td class="bold">CreditSafe Report:</td>
              <td><span style="color: green; font-weight: bold;">OK</span></td>
              <td class="bold">Coface Report:</td>
              <td><span style="color: green; font-weight: bold;">OK</span></td>
            </tr>
            <tr>
              <td class="bold">Credit Insurer Limit:</td>
              <td>300,000 USD (AIG)</td>
              <td class="bold">Approved Limit by Polytrade:</td>
              <td class="amount-cell"><strong>100,000 USD</strong></td>
            </tr>
          </table>
          <div style="margin-top: 10px; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb;">
            <strong>Observations:</strong> No alerts, no negative news. The score showed that the company has a very low probability of default. Given the short company structure, the recommended limits from Coface and Creditsafe remain limited. However, insurer has approved a limit of 300,000 USD based on financial results, company history and good payment behaviour. Approved Buyer limit for 100,000 USD.
          </div>
        </div>

        <div class="recommendation-section">
          <div class="recommendation-title">X. Credit Committee Recommendation</div>
          
          <p><strong>Final Decision:</strong> Facility approved for a total of <strong>100,000 USD</strong></p>
          
          <p><strong>Rationale:</strong></p>
          <p>Based on the improvements in terms of company structure, despite the revenue decrease and given the quality of Buyer. The comprehensive analysis shows:</p>
          
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Strong buyer relationship with Andiamo International Ltd (UK) with >3 years history</li>
            <li>Excellent payment experience - payments received 5 days before due date on average</li>
            <li>Comprehensive due diligence completed with all checks passing</li>
            <li>Credit insurance coverage of 300,000 USD approved by AIG</li>
            <li>Strong corporate governance structure with experienced management</li>
          </ul>
          
          <p><strong>Approved Terms:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Total Credit Limit: <strong>100,000 USD</strong></li>
            <li>Advance Ratio: <strong>85%</strong></li>
            <li>Factoring Fee: <strong>0.78% (60 days)</strong></li>
            <li>Discount Fee: <strong>5.90%</strong></li>
            <li>Review Date: <strong>08/02/2023</strong></li>
          </ul>
          
          <div class="decision-box">
            <div class="decision-text">FACILITY APPROVED - 100,000 USD</div>
          </div>
        </div>

        <div class="signature-section">
          <table class="signature-table">
            <tr>
              <td>
                <div class="signature-label">Prepared By:<br>Credit Analyst</div>
              </td>
              <td>
                <div class="signature-label">Reviewed By:<br>Risk Management</div>
              </td>
              <td>
                <div class="signature-label">Approved By:<br>THIERRY LASSY TATY</div>
              </td>
            </tr>
            <tr>
              <td>
                <div style="margin-top: 10px;">
                  <strong>${evaluation.evaluatorId.username}</strong><br>
                  Date: ${currentDate}
                </div>
              </td>
              <td>
                <div style="margin-top: 10px;">
                  _________________________<br>
                  Date: _______________
                </div>
              </td>
              <td>
                <div style="margin-top: 10px;">
                  <strong>THIERRY LASSY TATY</strong><br>
                  Date: <strong>09/02/2022</strong>
                </div>
              </td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <div style="text-align: center; border-top: 2px solid #000; padding-top: 10px; margin-top: 20px;">
            <p style="font-weight: bold; color: #dc2626; margin: 5px 0;">- Private and Confidential -</p>
            <p style="font-size: 9px; margin: 5px 0;">This credit memorandum contains confidential and proprietary information of Whizunik Financial Services.</p>
            <p style="font-size: 8px; margin: 5px 0;">Document Generated: ${new Date().toLocaleString()} | Reference: CM-${application._id.toString().substring(0, 8).toUpperCase()}</p>
            <p style="font-size: 8px; margin: 5px 0;">Page 1 of 1</p>
          </div>
        </div>
    </body>
    </html>
    `;

    // Generate PDF using Puppeteer
    console.log('🖨️ Generating PDF...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();

    // Set response headers for PDF download
    const filename = `Evaluation_Memo_${applicationId}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);

    console.log('✅ PDF generated successfully');
    res.send(pdf);

  } catch (error) {
    console.error('❌ Generate memo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 WhizUnik Hub API server running on port ${PORT}`);
      console.log(`📍 Local API URL: http://localhost:${PORT}`);
      console.log(`🌐 Production API URL: https://portal.whizunikhub.com`);
      console.log(`🌐 Frontend URL: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`📁 Upload directory: ${path.resolve('./uploads')}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

startServer();
