const mongoose = require('mongoose');

const auctionLotSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  lotNumber: { type: String },
  startingBid: { type: Number, required: true },
  reservePrice: { type: Number, required: true },
  bidIncrement: { type: Number, default: 500 },
  currentBid: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  condition: { type: String },
  provenance: { type: String },
  images: [{ type: String }],
  videoUrl: { type: String },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: [
      'pending_approval', 
      'documents_verified', 
      'physical_inspection_required', 
      'in_custody', 
      'authenticated', 
      'rejected', 
      'upcoming', 
      'live', 
      'extended', 
      'closed', 
      'sold', 
      'unsold'
    ],
    default: 'pending_approval'
  },

  // === BOTTLE SPECIFICATIONS ===
  distillery: { type: String },
  expression: { type: String },
  vintage: { type: String },
  bottlingYear: { type: String },
  ageStatement: { type: String },
  bottleNumber: { type: String },
  caskNumber: { type: String },
  bottleSizeMl: { type: Number, default: 750 },
  abv: { type: Number },
  countryOfOrigin: { type: String, default: 'Scotland' },

  // === CONDITION & PROVENANCE ===
  fillLevel: { 
    type: String, 
    enum: ['High Fill', 'Into Neck', 'Top Shoulder', 'Upper Mid Shoulder', 'Mid Shoulder', 'Low Shoulder', 'Below Shoulder', 'Unknown'],
    default: 'Into Neck' 
  },
  boxCondition: { 
    type: String, 
    enum: ['Original Box / Case Pristine', 'Original Box / Minor Wear', 'Damaged Packaging', 'No Original Box', 'Tube Packaging'],
    default: 'Original Box / Case Pristine' 
  },
  sealCondition: { 
    type: String, 
    enum: ['Intact & Pristine', 'Wax Seal Intact', 'Minor Cracking / Aged', 'Seal Damaged'],
    default: 'Intact & Pristine' 
  },
  provenanceHistory: { type: String },
  documentationImages: [{ type: String }], // Receipts, certificates, provenance scans

  // === VALUATION & RESERVE ===
  estimatedValueMin: { type: Number },
  estimatedValueMax: { type: Number },
  reserveType: { type: String, enum: ['none', 'confidential'], default: 'confidential' },
  reserveMet: { type: Boolean, default: false },

  // === AUTHENTICATION & CUSTODY PIPELINE ===
  authenticationStatus: {
    type: String,
    enum: [
      'Pending', 'Documents Verified', 'Physical Inspection Required', 'Authenticated', 'Rejected', 'Suspicious',
      'pending_custody', 'in_inspection', 'documents_verified', 'authenticated', 'rejected'
    ],
    default: 'Pending'
  },
  authenticationNotes: { type: String },
  authenticatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authenticatedAt: { type: Date },
  custodyLocation: {
    type: String,
    enum: ['Seller Custody', 'Grand Store Bonded Vault', 'Third-Party Custody'],
    default: 'Seller Custody'
  },

  // === LIVE BIDDING ENGINE & ANTI-SNIPING ===
  bidCount: { type: Number, default: 0 },
  extensionCount: { type: Number, default: 0 },
  lastBidTime: { type: Date },
  isExtended: { type: Boolean, default: false },
  originalEndDate: { type: Date },
  highBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // === FULFILMENT & TRACKING ===
  fulfilmentStatus: {
    type: String,
    enum: ['Awaiting Payment', 'Payment Cleared', 'Vault Packing', 'Dispatched', 'Delivered & Signed', 'Defaulted'],
    default: 'Awaiting Payment'
  },
  trackingNumber: { type: String },
  courierPartner: { type: String },
  vaultReleaseSignedBy: { type: String },

  // === ACCOUNTING BREAKDOWN (populated when auction closes) ===
  winningBid: { type: Number, default: 0 },

  // Buyer-side charges (added ON TOP of winning bid - paid by buyer)
  buyerPremiumPct: { type: Number, default: 5 },       // % snapshot from PlatformSettings
  buyerPremiumAmount: { type: Number, default: 0 },    // winningBid × buyerPremiumPct

  barChargePct: { type: Number, default: 2 },          // Buyer Administration Reserve %
  barChargeAmount: { type: Number, default: 0 },       // winningBid × barChargePct

  shippingCost: { type: Number, default: 0 },          // From PlatformSettings
  vatPct: { type: Number, default: 15 },               // VAT % snapshot
  vatAmount: { type: Number, default: 0 },             // VAT on winningBid

  totalPaidByBuyer: { type: Number, default: 0 },      // winningBid + buyerPremium + BAR + shipping + VAT

  // Vendor-side deductions
  commissionPct: { type: Number, default: 15 },        // % snapshot from PlatformSettings
  commissionAmount: { type: Number, default: 0 },      // winningBid × commissionPct
  vendorPayable: { type: Number, default: 0 },         // winningBid - commission - VAT

  // GS Reference
  gsReference: { type: String },                      // e.g. GS-26-AUC-PAY-000001

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Awaiting_Approval', 'Paid', 'Refunded', 'Failed', 'Disputed'],
    default: 'Pending'
  },
  proofUrl: { type: String },
  isPaid: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },

}, { timestamps: true });

auctionLotSchema.pre('save', async function() {
  if (!this.lotNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('AuctionLot').countDocuments();
    const sequence = String(count + 101).padStart(5, '0');
    this.lotNumber = `GS-${year}-${sequence}`;
  }
  if (this.endDate && !this.originalEndDate) {
    this.originalEndDate = this.endDate;
  }
});

module.exports = mongoose.model('AuctionLot', auctionLotSchema);

