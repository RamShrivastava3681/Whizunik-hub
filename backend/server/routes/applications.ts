import express from 'express';
import { Application } from '../models/Application.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload, handleMulterError } from '../middleware/upload.js';
import crypto from 'crypto';

const router = express.Router();

// Get all applications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req as any;
    let query = {};

    // Filter based on user role
    if (user.role === 'salesman') {
      query = { salesmanId: user.id };
    } else if (user.role === 'evaluator') {
      query = { status: { $in: ['submitted', 'under-review'] } };
    }

    const applications = await Application.find(query)
      .populate('salesmanId', 'username email')
      .populate('evaluation.evaluatorId', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { applications }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new application
router.post('/', authenticateToken, requireRole(['salesman']), async (req, res) => {
  try {
    const { user } = req as any;
    const { clientName, companyName, applicationPassword } = req.body;

    // Generate unique link token
    const linkToken = crypto.randomBytes(32).toString('hex');

    // Hash application password (basic hashing for demo)
    const applicationPasswordHash = crypto
      .createHash('sha256')
      .update(applicationPassword)
      .digest('hex');

    const application = new Application({
      salesmanId: user.id,
      clientName,
      companyName,
      linkToken,
      applicationPasswordHash,
      timeline: [{
        action: 'Application created',
        performedBy: user.id,
        notes: 'Application created by salesman'
      }]
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: { 
        application,
        clientLink: `${process.env.FRONTEND_URL}/application/${linkToken}`
      }
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get application by token (for client access)
router.get('/token/:token', async (req, res) => {
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
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update application data
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const application = await Application.findByIdAndUpdate(
      id,
      { 
        $set: updateData,
        $push: {
          timeline: {
            action: 'Application updated',
            performedBy: req.body.updatedBy || null,
            notes: 'Application data updated'
          }
        }
      },
      { new: true, runValidators: true }
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
      data: { application }
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload documents
router.post('/:id/documents', upload.array('documents', 10), handleMulterError, async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Process uploaded files
    const uploadedDocuments = files.map(file => ({
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
      documentType: req.body.documentType || 'other',
      filePath: file.path,
      uploadedBy: req.body.uploadedBy || 'client'
    }));

    // Add documents to application
    application.documents.push(...uploadedDocuments);
    
    // Update timeline
    application.timeline.push({
      action: 'Documents uploaded',
      performedBy: req.body.uploadedBy || null,
      timestamp: new Date(),
      notes: `${files.length} document(s) uploaded`
    });

    await application.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: { 
        uploadedDocuments,
        totalDocuments: application.documents.length
      }
    });
  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get application statistics
router.get('/stats/dashboard', authenticateToken, async (req, res) => {
  try {
    const { user } = req as any;
    let matchQuery = {};

    if (user.role === 'salesman') {
      matchQuery = { salesmanId: user.id };
    }

    const stats = await Application.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
          underReview: { $sum: { $cond: [{ $eq: ['$status', 'under-review'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0
    };

    res.json({
      success: true,
      data: { stats: result }
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify application password
router.post('/verify-password', async (req, res) => {
  try {
    const { linkToken, password } = req.body;

    if (!linkToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Link token and password are required'
      });
    }

    // Find application by link token
    const application = await Application.findOne({ linkToken })
      .populate('salesmanId', 'username email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Hash the provided password and compare with stored hash
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    if (hashedPassword !== application.applicationPasswordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    res.json({
      success: true,
      data: { application }
    });
  } catch (error) {
    console.error('Error verifying application password:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
