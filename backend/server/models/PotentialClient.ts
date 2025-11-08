import mongoose from 'mongoose';

const potentialClientSchema = new mongoose.Schema({
  // Company Information
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  
  // Contact Information
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  contactTitle: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Business Information
  product: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['exporter', 'importer', 'manufacturer', 'trader', 'service_provider', 'other'],
    trim: true
  },
  dealAmount: {
    type: Number,
    required: true,
    min: 0
  },
  financingFee: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Sales Information
  source: {
    type: String,
    required: true,
    enum: ['cold_call', 'referral', 'website', 'exhibition', 'linkedin', 'email_campaign', 'other'],
    trim: true
  },
  nextContactDate: {
    type: Date,
    required: true
  },
  officer: {
    type: String,
    required: true,
    trim: true
  },
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status and Notes
  status: {
    type: String,
    enum: ['potential', 'contacted', 'interested', 'proposal_sent', 'negotiating', 'converted', 'rejected'],
    default: 'potential'
  },
  observations: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastContactDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
potentialClientSchema.index({ salesmanId: 1 });
potentialClientSchema.index({ email: 1 });
potentialClientSchema.index({ status: 1 });
potentialClientSchema.index({ companyName: 1 });
potentialClientSchema.index({ country: 1 });
potentialClientSchema.index({ industry: 1 });
potentialClientSchema.index({ nextContactDate: 1 });

export const PotentialClient = mongoose.model('PotentialClient', potentialClientSchema);
