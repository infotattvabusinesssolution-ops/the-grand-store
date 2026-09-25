const mongoose = require('mongoose');

const exportEnquirySchema = new mongoose.Schema({
  enquiryCode: {
    type: String,
    unique: true,
    required: true,
    index: true // Formatted as EXP-YYYY-XXXXX
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
    destinationPort: { type: String, trim: true }, // e.g. "Jebel Ali, Dubai" or "Rotterdam"
    customsRequirementsNotes: { type: String }
  },
  itemsRequested: [{
    productName: { type: String, required: true },
    vintage: { type: String },
    bottlesPerCase: { type: Number, default: 6 },
    caseQuantity: { type: Number, required: true, min: 1 },
    targetPricePerCase: { type: Number }
  }],
  incoterms: {
    type: String,
    enum: ['EXW', 'FOB', 'CIF', 'DDP', 'DAP'],
    default: 'CIF'
  },
  currency: {
    type: String,
    enum: ['ZAR', 'USD', 'EUR', 'GBP', 'AED'],
    default: 'USD'
  },
  documentationChecklist: {
    commercialInvoice: { verified: { type: Boolean, default: false }, fileUrl: String },
    certificateOfOrigin: { verified: { type: Boolean, default: false }, fileUrl: String },
    phytosanitaryCertificate: { verified: { type: Boolean, default: false }, fileUrl: String },
    billOfLading: { verified: { type: Boolean, default: false }, fileUrl: String }
  },
  quotation: {
    quoteNumber: { type: String },
    subtotalAmount: { type: Number, default: 0 },
    freightAmount: { type: Number, default: 0 },
    insuranceAmount: { type: Number, default: 0 },
    totalQuoteAmount: { type: Number, default: 0 },
    validUntil: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'prepared', 'sent_to_buyer', 'accepted', 'declined', 'expired'],
      default: 'draft'
    }
  },
  stage: {
    type: String,
    enum: [
      'enquiry_received',
      'requirements_verified',
      'availability_checked',
      'quote_prepared',
      'negotiation',
      'confirmed_order',
      'in_transit',
      'delivered_cleared',
      'closed_lost'
    ],
    default: 'enquiry_received',
    index: true
  },
  assignedTradeManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  nextFollowUpDate: {
    type: Date,
    default: () => new Date(Date.now() + 48 * 60 * 60 * 1000)
  },
  internalNotes: [{
    note: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ExportEnquiry', exportEnquirySchema);
