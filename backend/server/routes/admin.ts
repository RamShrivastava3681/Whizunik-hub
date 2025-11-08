import express from 'express';
import { User } from '../models/User.js';
import { Application } from '../models/Application.js';
import { authenticateToken } from '../middleware/auth.js';

interface AuthRequest extends express.Request {
  user?: any;
}

const router = express.Router();

// Middleware to check admin role
const adminMiddleware = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Get all users
router.get('/users', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
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

// Get pending users (for admin approval)
router.get('/pending-users', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }, '-password').sort({ createdAt: -1 });
    
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

// Approve user registration
router.patch('/users/:userId/approve', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'approved' },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User approved successfully',
      data: user
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving user'
    });
  }
});

// Reject user registration
router.patch('/users/:userId/reject', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'rejected' },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User registration rejected',
      data: user
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting user'
    });
  }
});



// Get all applications
router.get('/applications', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const applications = await Application.find({})
      .populate('salesmanId', 'username email')
      .populate('evaluation.evaluatorId', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
});

// Get dashboard statistics
router.get('/stats', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    // Get user counts
    const totalUsers = await User.countDocuments();
    const totalSalesmen = await User.countDocuments({ role: 'salesman' });
    const totalEvaluators = await User.countDocuments({ role: 'evaluator' });
    const activeUsers = await User.countDocuments({ 'profile.isActive': true });
    const pendingUsers = await User.countDocuments({ status: 'pending' });

    // Get application counts
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });

    // Calculate revenue (mock data for now)
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

// Toggle user active status
router.patch('/users/:userId/toggle-status', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 'profile.isActive': isActive },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

// Update user details
router.put('/users/:userId', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { username, email, role, profile } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        username, 
        email, 
        role, 
        profile: { ...profile }
      },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Delete user
router.delete('/users/:userId', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting the current admin
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// Get application details
router.get('/applications/:applicationId', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate('salesmanId', 'username email profile')
      .populate('evaluation.evaluatorId', 'username email profile');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application'
    });
  }
});

// Get user activity logs
router.get('/users/:userId/activity', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    // Get applications created by this user (if salesman)
    const applications = await Application.find({ salesmanId: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get applications evaluated by this user (if evaluator)
    const evaluations = await Application.find({ 'evaluation.evaluatorId': userId })
      .sort({ 'evaluation.evaluatedAt': -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        applications,
        evaluations
      }
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity'
    });
  }
});

// Get system analytics
router.get('/analytics', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    // Applications over time
    const applicationsOverTime = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // User registration over time
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: daysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Application status distribution
    const statusDistribution = await Application.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Top performing salesmen
    const topSalesmen = await Application.aggregate([
      {
        $group: {
          _id: "$salesmanId",
          applicationCount: { $sum: 1 },
          approvedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "salesman"
        }
      },
      {
        $unwind: "$salesman"
      },
      {
        $project: {
          salesmanId: "$_id",
          salesmanName: "$salesman.username",
          applicationCount: 1,
          approvedCount: 1,
          successRate: {
            $multiply: [
              { $divide: ["$approvedCount", "$applicationCount"] },
              100
            ]
          }
        }
      },
      {
        $sort: { applicationCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        applicationsOverTime,
        userRegistrations,
        statusDistribution,
        topSalesmen
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// Create new user (admin only)
router.post('/users', authenticateToken, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { email, password, username, role = 'salesman', profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      password, // This will be hashed by the pre-save middleware
      username,
      role,
      profile
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

export default router;