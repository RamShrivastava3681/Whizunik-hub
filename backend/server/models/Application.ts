import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  salesmanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  linkToken: {
    type: String,
    required: true,
    unique: true
  },
  applicationPasswordHash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'submitted', 'under-review', 'approved', 'rejected'],
    default: 'pending'
  },
  applicationData: {
    // Step 1: Business Information
    businessInfo: {
      companyName: String,
      establishedDate: Date,
      businessType: String,
      address: String,
      website: String,
      country: String,
      state: String,
      city: String,
      zipCode: String,
      telephone: String,
      cellPhone: String,
      contactName: String,
      ceoName: String
    },
    
    // Step 2: Information about the Partners
    partnersInfo: {
      partners: [{
        name: String,
        percentage: Number,
        idNumber: String
      }]
    },
    
    // Step 3: Director's details
    principalsInfo: {
      principals: [{
        name: String,
        birthDate: Date,
        din: String
      }]
    },
    
    // Step 4: Financial Request Information
    financialRequestInfo: {
      currency: String,
      yearlySales: Number,
      grossMargin: Number,
      financingRequired: Number,
      creditUseDestination: String,
      numberOfClientsToFinance: Number,
      documentTypes: {
        PO: Boolean,
        Invoice: Boolean,
        LC: Boolean
      },
      factoredReceivables: String,
      factoredDetails: String,
      creditInsurancePolicy: String,
      creditInsuranceDetails: String,
      uccFilingOrLiens: String,
      uccFilingDetails: String,
      declaredBankruptcy: String,
      pastDueTaxes: String,
      pendingLawsuit: String
    },
    
    // Step 5: Bank Details
    bankDetailsInfo: {
      bankAccounts: [{
        accountNumber: String,
        accountName: String,
        bankName: String,
        bankAddress: String,
        abaRouting: String,
        ifscCode: String,
        swiftCode: String
      }]
    },
    
    // Step 6: Document Submission and Authorization
    documentSubmissionInfo: {
      termsAccepted: Boolean,
      termsAcceptedDate: Date,
      signatureName: String,
      signatureDate: Date,
      signatureImagePath: String,
      requiredDocuments: [{
        documentType: {
          type: String,
          enum: [
            'company-profile',
            'license-copy',
            'kyc-ubo',
            'audited-financial',
            'projections',
            'suppliers-list',
            'sample-documents',
            'creditor-aging',
            'buyers-list',
            'sample-documents-2',
            'debtor-aging',
            'company-presentation' // 12th document type
          ]
        },
        fileName: String,
        originalName: String,
        filePath: String,
        uploadDate: Date,
        fileSize: Number,
        mimeType: String
      }]
    },
    
    // Step 2: Financial Information
    financialInfo: {
      annualRevenue: Number,
      creditRating: String,
      bankName: String,
      accountNumber: String,
      existingCredits: [{
        lenderName: String,
        amount: Number,
        purpose: String,
        status: String
      }]
    },
    
    // Step 3: Trade Finance Requirements
    tradeFinanceInfo: {
      facilityType: {
        type: String,
        enum: ['letter-of-credit', 'bank-guarantee', 'trade-loan', 'export-finance', 'import-finance']
      },
      amount: Number,
      currency: String,
      tenure: Number,
      purpose: String,
      beneficiaryDetails: {
        name: String,
        address: String,
        country: String
      }
    },
    
    // Step 4: Contact Information
    contactInfo: {
      primaryContact: {
        name: String,
        designation: String,
        email: String,
        phone: String
      },
      financialContact: {
        name: String,
        designation: String,
        email: String,
        phone: String
      }
    },
    
    // Step 5: Additional Information
    additionalInfo: {
      experienceInTrade: Number,
      mainMarkets: [String],
      keyProducts: [String],
      specialRequirements: String,
      urgency: {
        type: String,
        enum: ['immediate', 'within-week', 'within-month', 'flexible']
      }
    }
  },
  
  // Step 6: Documents
  documents: [{
    fileName: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadDate: Date,
    documentType: {
      type: String,
      enum: [
        'incorporation-certificate',
        'financial-statements',
        'bank-statements',
        'trade-license',
        'audited-accounts',
        'board-resolution',
        'kyc-documents',
        'other'
      ]
    },
    filePath: String,
    uploadedBy: String
  }],
  
  // Evaluation fields (for evaluators)
  evaluation: {
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    riskAssessment: {
      creditScore: Number,
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      riskFactors: [String]
    },
    recommendation: {
      type: String,
      enum: ['approve', 'reject', 'conditional-approve']
    },
    conditions: [String],
    comments: String,
    evaluatedAt: Date
  },
  
  // Timeline tracking
  timeline: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Indexes for better performance
applicationSchema.index({ salesmanId: 1 });
applicationSchema.index({ linkToken: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ 'evaluation.evaluatorId': 1 });
applicationSchema.index({ createdAt: -1 });

export const Application = mongoose.model('Application', applicationSchema);
