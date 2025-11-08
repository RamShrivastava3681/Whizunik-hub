import express from 'express';
import { PotentialClient } from '../models/PotentialClient.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all potential clients for a salesman
router.get('/', authenticateToken, requireRole(['salesman', 'admin']), async (req, res) => {
  try {
    const { user } = req as any;
    const query = user.role === 'admin' ? {} : { salesmanId: user.id };
    
    const clients = await PotentialClient.find(query)
      .populate('salesmanId', 'username email')
      .sort({ createdAt: -1 });

    res.json(clients);
  } catch (error) {
    console.error('Error fetching potential clients:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new potential client
router.post('/', authenticateToken, requireRole(['salesman', 'admin']), async (req, res) => {
  try {
    const { user } = req as any;
    const clientData = {
      ...req.body,
      salesmanId: user.id
    };

    // Check if client already exists for this salesman
    const existingClient = await PotentialClient.findOne({
      email: clientData.email,
      salesmanId: user.id
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Potential client with this email already exists'
      });
    }

    const potentialClient = new PotentialClient(clientData);
    await potentialClient.save();

    res.status(201).json(potentialClient);
  } catch (error) {
    console.error('Error creating potential client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update potential client
router.put('/:id', authenticateToken, requireRole(['salesman', 'admin']), async (req, res) => {
  try {
    const { user } = req as any;
    const { id } = req.params;
    const updates = req.body;

    const query = user.role === 'admin' ? { _id: id } : { _id: id, salesmanId: user.id };
    
    const client = await PotentialClient.findOneAndUpdate(
      query,
      updates,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Potential client not found'
      });
    }

    res.json(client);
  } catch (error) {
    console.error('Error updating potential client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete potential client
router.delete('/:id', authenticateToken, requireRole(['salesman', 'admin']), async (req, res) => {
  try {
    const { user } = req as any;
    const { id } = req.params;

    const query = user.role === 'admin' ? { _id: id } : { _id: id, salesmanId: user.id };
    
    const client = await PotentialClient.findOneAndDelete(query);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Potential client not found'
      });
    }

    res.json({
      success: true,
      message: 'Potential client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting potential client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single potential client
router.get('/:id', authenticateToken, requireRole(['salesman', 'admin']), async (req, res) => {
  try {
    const { user } = req as any;
    const { id } = req.params;

    const query = user.role === 'admin' ? { _id: id } : { _id: id, salesmanId: user.id };
    
    const client = await PotentialClient.findOne(query)
      .populate('salesmanId', 'username email');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Potential client not found'
      });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching potential client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
