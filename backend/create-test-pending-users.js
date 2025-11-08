// Test script to create a pending user directly in the database
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/whizunik-portal';

// User Schema (simplified for testing)
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
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestPendingUser() {
  try {
    await mongoose.connect(mongoUri);
    console.log('📊 Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'testuser@example.com' });
    if (existingUser) {
      console.log('❌ Test user already exists, deleting first...');
      await User.deleteOne({ email: 'testuser@example.com' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('testpassword123', 12);

    // Create test user with pending status
    const testUser = new User({
      email: 'testuser@example.com',
      password: hashedPassword,
      username: 'Test User',
      role: 'salesman',
      status: 'pending',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        department: 'Sales',
        isActive: true
      }
    });

    await testUser.save();

    console.log('✅ Test pending user created successfully!');
    console.log('📧 Email:', testUser.email);
    console.log('👤 Username:', testUser.username);
    console.log('📋 Role:', testUser.role);
    console.log('⏳ Status:', testUser.status);
    console.log('🆔 User ID:', testUser._id);
    
    // Also create another test user
    const testUser2 = new User({
      email: 'john.doe@example.com',
      password: await bcrypt.hash('password123', 12),
      username: 'John Doe',
      role: 'evaluator',
      status: 'pending',
      profile: {
        firstName: 'John',
        lastName: 'Doe', 
        department: 'Evaluation',
        isActive: true
      }
    });

    await testUser2.save();
    console.log('✅ Second test pending user created!');
    console.log('📧 Email:', testUser2.email);
    console.log('👤 Username:', testUser2.username);
    console.log('🆔 User ID:', testUser2._id);

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

createTestPendingUser();