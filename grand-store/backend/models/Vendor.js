const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Step 1: Progress Tracking
  vendorType: {
    type: String,
    enum: ['local', 'international'],
    default: 'local'
  },
  onboardingStep: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'suspended'],
    default: 'draft'
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'awaiting_verification'],
    default: 'unpaid'
  },
  paidAt: {
    type: Date,
    default: null
  },
  proofOfPaymentUrl: {
    type: String,
    default: null
  },
  paymentReminderSent: {
    type: Boolean,
    default: false
  },
  verificationScore: {
    businessVerified: { type: Boolean, default: false },
    identityVerified: { type: Boolean, default: false },
    licenceVerified: { type: Boolean, default: false },
    taxVerified: { type: Boolean, default: false },
    bankVerified: { type: Boolean, default: false },
  },
  
  // Step 2: Business
  businessInfo: {
    legalName: String,
    tradingName: String,
    registrationNumber: String,
    businessType: String,
    address: String,
    logoUrl: String,
    bannerUrl: String,
  },
  
  // Step 3: KYC
  kycInfo: {
    directorName: String,
    idNumber: String,
    contactNumber: String,
    idDocumentUrl: String,
  },
  
  // Step 4: Tax
  taxInfo: {
    taxNumber: String,
    vatNumber: String,
    taxClearanceUrl: String,
  },
  
  // Step 5: Licence
  licenceInfo: {
    licenceNumber: String,
    licenceType: String,
    expiryDate: Date,
    licenceDocumentUrl: String,
  },
  
  // Step 6: Customs
  customsInfo: {
    exportCode: String,
    exportDocumentUrl: String,
  },
  
  // Step 7: Banking
  bankingInfo: {
    bankName: String,
    accountName: String,
    accountNumber: String,
    branchCode: String,
    accountType: {
      type: String,
      default: 'Cheque / Current'
    },
    swiftCode: String,
    bankConfirmationUrl: String,
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    updatedAt: Date,
    payoutPreference: {
      type: String,
      enum: ['Weekly', 'Fortnightly', 'Monthly'],
      default: 'Monthly'
    }
  },
  
  // Step 8: Products
  productCategories: [String],
  
  // Step 9: Delivery
  deliveryInfo: {
    fulfillmentMethod: String,
    dispatchLocation: String,
    dispatchDays: String,
    cutoffTime: String,
    processingTime: String,
  },
  
  // International specific fields
  credentialsInfo: {
    exportLicenceNumber: String,
    homeCountryLicence: String,
    certificates: String,
  },
  marketInfo: {
    targetRegions: [String],
  },
  logisticsInfo: {
    currentImporter: String,
    freightForwarder: String,
  },
  storyInfo: {
    winemakerBio: String,
    brandStory: String,
    wineryPhotosUrl: String,
  },

  // Detailed Shipping Profile (from GS Checkout flow document)
  shippingProfile: {
    pickupAddress: {
      street: String,
      city: String,
      postalCode: String,
      country: { type: String, default: 'South Africa' },
      lat: Number,
      lng: Number
    },
    defaultDimensions: {
      length: { type: Number, default: 35 },
      width: { type: Number, default: 25 },
      height: { type: Number, default: 30 },
      unit: { type: String, default: 'cm' }
    },
    defaultWeight: {
      value: { type: Number, default: 9 }, // e.g. 9kg for 6 bottles
      unit: { type: String, default: 'kg' }
    },
    shippingZones: [{
      name: String,
      rate: Number, // Flat rate for this zone
    }],
    freeDeliveryThreshold: { type: Number, default: null }, // e.g., free above R1500
    handlingTimeDays: { type: Number, default: 2 }
  },
  
  // Social Proof Engine Metrics
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null // Null means not yet calculated
  },
  badges: [{
    type: String // e.g., 'GRAND_STORE_VERIFIED', 'BEST_WINE_VENDOR'
  }],
  performanceMetrics: {
    ordersFulfilledPercent: { type: Number, default: 0 },
    averageResponseHours: { type: Number, default: 0 },
    positiveExperiencePercent: { type: Number, default: 0 }
  },

  // Step 10: Agreement
  agreements: {
    termsAccepted: { type: Boolean, default: false },
    informationAccurate: { type: Boolean, default: false },
    acceptedAt: Date,
  },
  
  // Trial & Coupon System
  couponUsed: {
    type: String,
    default: null
  },
  couponRedeemedAt: {
    type: Date,
    default: null
  },
  freeTrialExpiry: {
    type: Date,
    default: null
  },
  trialStatus: {
    type: String,
    enum: ['none', 'active', 'expired'],
    default: 'none'
  },

  // Recurring Monthly Maintenance Fee
  maintenanceFee: {
    amount: { type: Number, default: 500 },
    status: {
      type: String,
      enum: ['paid', 'due', 'overdue', 'grace_period', 'awaiting_verification'],
      default: 'paid'
    },
    proofOfPaymentUrl: { type: String, default: null },
    lastPaidAt: { type: Date, default: null },
    nextDueAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    paymentHistory: [{
      amount: Number,
      paidAt: { type: Date, default: Date.now },
      paymentMethod: { type: String, default: 'card' },
      reference: String,
      gsReference: String,
      status: { type: String, default: 'cleared' },
      proofUrl: String
    }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
