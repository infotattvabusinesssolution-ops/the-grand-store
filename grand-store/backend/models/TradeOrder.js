const mongoose = require('mongoose');

const tradeOrderSchema = new mongoose.Schema({
  orderCode: {
    type: String,
    required: true,
    unique: true,
    index: true // Formatted as TO-YYYY-XXXXX
  },
  exportEnquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExportEnquiry',
    required: true,
    index: true
  },
  parentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradeOrder',
    default: null
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendorName: {
    type: String,
    trim: true
  },
  buyer: {
    companyName: { type: String, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    buyerType: {
      type: String,
      enum: ['importer_distributor', 'hotel_resort_group', 'private_collector', 'retail_chain'],
      default: 'importer_distributor'
    }
  },
  destination: {
    country: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    destinationPort: { type: String, trim: true } // e.g., "London Gateway" or "Jebel Ali"
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    productCode: { type: String },
    vintage: { type: String },
    bottlesPerCase: { type: Number, default: 6 },
    caseQuantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true }, // price per bottle or case
    pricePerBottle: { type: Number },
    lineTotal: { type: Number, required: true }
  }],
  incoterms: {
    type: String,
    enum: ['EXW', 'FOB', 'CIF', 'DDP', 'DAP'],
    default: 'FOB'
  },
  currency: {
    type: String,
    enum: ['ZAR', 'USD', 'EUR', 'GBP', 'AED'],
    default: 'USD'
  },
  financials: {
    subtotalAmount: { type: Number, required: true },
    freightAmount: { type: Number, default: 0 },
    insuranceAmount: { type: Number, default: 0 },
    platformCommissionPct: { type: Number, default: 10 },
    platformCommissionAmount: { type: Number, default: 0 },
    grandTotalAmount: { type: Number, required: true }
  },
  paymentTerms: {
    type: String,
    default: '30% deposit upon proforma sign-off, 70% against Bill of Lading'
  },
  leadTimeDays: {
    type: Number,
    default: 14
  },
  status: {
    type: String,
    enum: [
      'proforma_issued',
      'deposit_received',
      'in_production',
      'packaging_ready',
      'dispatched_to_port',
      'in_transit',
      'customs_cleared',
      'delivered',
      'completed',
      'cancelled'
    ],
    default: 'proforma_issued',
    index: true
  },
  inventoryReserved: {
    type: Boolean,
    default: true
  },
  reservedCasesCount: {
    type: Number,
    default: 0
  },
  proformaPdfUrl: {
    type: String
  },
  buyerSignedAt: {
    type: Date
  },
  buyerSignatureNote: {
    type: String
  },
  milestones: [{
    title: { type: String, required: true },
    status: { type: String, default: 'pending' }, // 'pending' | 'completed' | 'in_progress'
    completedAt: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  settlement: {
    isSettled: { type: Boolean, default: false },
    settledAt: Date,
    payoutAmount: Number,
    platformRevenue: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TradeOrder', tradeOrderSchema);
