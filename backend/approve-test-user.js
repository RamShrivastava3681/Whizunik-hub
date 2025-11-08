// Test script to approve a pending user so it appears in the main users list
const mongoose = require('mongoose');

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

async function approveTestUser() {
  try {
    await mongoose.connect(mongoUri);
    console.log('📊 Connected to MongoDB');

    // Approve the test user
    const updatedUser = await User.findOneAndUpdate(
      { email: 'testuser@example.com' },
      { status: 'approved', 'profile.isActive': true },
      { new: true }
    );

    if (updatedUser) {
      console.log('✅ Test user approved successfully!');
      console.log('📧 Email:', updatedUser.email);
      console.log('👤 Username:', updatedUser.username);
      console.log('📋 Role:', updatedUser.role);
      console.log('⏳ Status:', updatedUser.status);
      console.log('🔄 Active:', updatedUser.profile.isActive);
      console.log('🆔 User ID:', updatedUser._id);
    } else {
      console.log('❌ Test user not found');
    }

  } catch (error) {
    console.error('❌ Error approving test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

approveTestUser();