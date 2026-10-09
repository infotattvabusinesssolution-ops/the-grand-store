const mongoose = require('mongoose');

const vendorSettlementSchema = new mongoose.Schema({
  settlementReference: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    index: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  vendorName: {
    type: String,
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'
  },
  deliveredAt: {
    type: Date,
    required: true
  },
  payoutDueDate: {
    type: Date,
    required: true,
    index: true
  },
  orderTotal: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRatePct: {
    type: Number,
    default: 15
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  payoutAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'ZAR'
  },
  orderType: {
    type: String,
    enum: ['local', 'global_export'],
    default: 'local',
    index: true
  },
  destinationCountry: {
    type: String,
    default: 'South Africa'
  },
  vatRatePct: {
    type: Number,
    default: 15
  },
  payoutMethod: {
    type: String,
    enum: ['domestic_eft', 'swift_wire', 'international_iban', 'direct_treasury'],
    default: 'domestic_eft'
  },
  customsDeclarationRef: {
    type: String,
    default: ''
  },
  fxRate: {
    type: Number,
    default: 1.0
  },
  status: {
    type: String,
    enum: ['pending_30day_window', 'due_for_payment', 'processing', 'settled', 'disputed', 'held'],
    default: 'pending_30day_window',
    index: true
  },
  bankDetailsSnapshot: {
    bankName: { type: String },
    accountHolder: { type: String },
    accountNumber: { type: String },
    branchCode: { type: String },
    accountType: { type: String },
    swiftCode: { type: String },
    iban: { type: String },
    country: { type: String }
  },
  disputeReason: {
    type: String,
    trim: true
  },
  proofOfPaymentUrl: {
    type: String,
    trim: true
  },
  paymentReference: {
    type: String,
    trim: true
  },
  settledAt: {
    type: Date
  },
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  auditTrail: [{
    action: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String },
    timestamp: { type: Date, default: Date.now },
    details: { type: String }
  }]
}, {
  timestamps: true
});

// Compound unique index to strictly prevent duplicate payouts for the same order and vendor
vendorSettlementSchema.index({ order: 1, vendor: 1 }, { unique: true });
vendorSettlementSchema.index({ status: 1, payoutDueDate: 1 });

module.exports = mongoose.model('VendorSettlement', vendorSettlementSchema);
