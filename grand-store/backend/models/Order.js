const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  isGuest: { type: Boolean, default: false },
  guestInfo: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  isAgeConfirmed: { type: Boolean, default: false },
  guestAccessToken: { type: String },
  guestKyc: {
    idType: { type: String, enum: ['national_id', 'passport', 'drivers_license', 'other', ''], default: '' },
    idNumber: { type: String, default: '' },
    dateOfBirth: { type: Date },
    documentUrl: { type: String, default: '' },
    documentType: { type: String, default: '' },
    status: { type: String, enum: ['not_required', 'pending_review', 'verified', 'rejected'], default: 'not_required' },
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, default: '' }
  },
  ageVerification: {
    isVerified: { type: Boolean, default: false },
    verifiedVia: { type: String, enum: ['account_kyc', 'guest_document', 'self_declaration'], default: 'self_declaration' },
    confirmedAt: { type: Date }
  },
  // GS Reference IDs
  transactionId: { type: String, unique: true },
  orderId: { type: String, unique: true },
  paymentId: { type: String, unique: true },
  invoiceNumber: { type: String, unique: true },

  orderItems: [
    {
      product: { type: String, required: true },
      vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, required: true },
      category: { type: String, default: 'Uncategorised' },
      subcategory: { type: String, default: '' },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      option: { type: String },
      image: { type: String }
    }
  ],
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
  },
  
  isGift: { type: Boolean, default: false },
  giftRecipientName: { type: String, default: "" },
  giftMessage: { type: String, default: "" },

  paymentMethod: { type: String, required: true },
  proofUrl: { type: String },

  // === ACCOUNTING BREAKDOWN ===
  subTotal: { type: Number, default: 0 },          // Products total before any fees
  shippingCost: { type: Number, default: 0 },       // Sum of all courier quotes
  vatPct: { type: Number, default: 0 },             // 15% (Domestic) or 0% (Export)
  vatAmount: { type: Number, default: 0 },          // Calculated VAT on subTotal
  
  // International Charges (DDP)
  importDuties: { type: Number, default: 0 },
  importTaxes: { type: Number, default: 0 },
  customsFees: { type: Number, default: 0 },
  
  commissionPct: { type: Number, default: 15 },     // Commission % snapshot
  commissionAmount: { type: Number, default: 0 },   // Grand Store commission on subTotal
  gatewayFeePct: { type: Number, default: 2.5 },
  gatewayFeeAmount: { type: Number, default: 0 },   // Payment gateway fee

  appliedWelcomeDiscount: { type: Number, default: 0 },
  appliedRewards: { type: Number, default: 0 },
  superCoinsUsed: { type: Number, default: 0 },
  superCoinsDiscount: { type: Number, default: 0 },
  superCoinsEarned: { type: Number, default: 0 },
  deliveryPreference: { type: String, enum: ['home', 'postnet'], default: 'home' },
  selectedPostnetStore: {
    id: { type: String },
    name: { type: String },
    address: { type: String },
    city: { type: String },
    telephone: { type: String },
    postalCode: { type: String },
    distance: { type: Number }
  },
  totalPrice: { type: Number, required: true, default: 0 }, // = subTotal + shipping + VAT + duties - discounts

  shipments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  }],

  // Per-vendor payable breakdown
  vendorPayables: [{
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    grossAmount: { type: Number },     // vendor's product total
    commission: { type: Number },      // GS commission on their items
    vatDeducted: { type: Number },     // VAT deducted from vendor
    netPayable: { type: Number },      // What vendor actually receives
    paid: { type: Boolean, default: false },
    paidAt: { type: Date }
  }],

  // Payment status
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Awaiting_Approval', 'Authorised', 'Paid', 'Allocated', 'Settled', 'Failed', 'Cancelled', 'Refunded', 'Disputed'],
    default: 'Pending'
  },
  isPaid: { type: Boolean, required: true, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, required: true, default: false },
  deliveredAt: { type: Date },

  // Admin custom & emergency communications
  adminMessages: [{
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'emergency', 'stock_issue'], default: 'info' },
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentByName: { type: String, default: 'The Grand Store Concierge' }
  }],
  latestAdminMessage: {
    message: { type: String },
    type: { type: String, default: 'info' },
    sentAt: { type: Date },
    sentByName: { type: String, default: 'The Grand Store Concierge' }
  },
  deliveryStatusText: { type: String, default: '' },

  // Immutable Order Financial Snapshot (Costing GS Understanding Section 14 & 251)
  financialSnapshot: {
    subTotal: { type: Number },
    totalPrice: { type: Number },
    grossPlatformCommission: { type: Number },
    totalVendorPayouts: { type: Number },
    gatewayFeeTotal: { type: Number },
    gatewayFeeAbsorbedByGS: { type: Number },
    superCoinsDiscountTotal: { type: Number },
    superCoinsAbsorbedByGS: { type: Number },
    referralDiscountTotal: { type: Number },
    referralAbsorbedByGS: { type: Number },
    netPlatformContribution: { type: Number },
    netMarginPct: { type: Number },
    marginStatus: { type: String },
    fundingSourceSnapshot: {
      whoPaysGateway: { type: String },
      whoPaysPromo: { type: String },
      whoPaysReferral: { type: String },
      whoPaysCoins: { type: String }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
