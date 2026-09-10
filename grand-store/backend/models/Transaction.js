const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Unique system reference (e.g. GS-26-SHP-PAY-000001)
  gsReference: { type: String, required: true, unique: true },
  
  // High-level categorization
  type: {
    type: String,
    enum: ['payment', 'refund', 'commission', 'payout', 'vat'],
    required: true
  },
  
  // Sub-module originating the transaction
  module: {
    type: String,
    enum: ['shop', 'auction', 'events', 'vendor', 'global'],
    required: true
  },
  
  // Financial amounts
  amount: { type: Number, required: true },
  netAmount: { type: Number, required: true }, // After any deductions like gateway fees
  currency: { type: String, default: 'ZAR' },
  
  // Linked Entities
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  
  // External gateway info
  gateway: { type: String, default: 'PayFast' },
  gatewayTransactionId: { type: String },
  
  // Tracking status
  status: {
    type: String,
    enum: ['pending', 'cleared', 'paid', 'delayed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  description: { type: String },
  
  // Specific metadata for vendor/host payouts and redemptions
  payoutDetails: {
    bankName: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    branchCode: { type: String },
    accountType: { type: String },
    swiftCode: { type: String },
    bankConfirmationUrl: { type: String },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    clearedAt: { type: Date },
    adminReference: { type: String },
    adminNotes: { type: String },
    customMessage: { type: String },
    rejectionReason: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
