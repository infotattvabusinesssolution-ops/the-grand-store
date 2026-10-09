const mongoose = require('mongoose');

const bidderDepositSchema = new mongoose.Schema({
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuctionLot'
  },
  amount: {
    type: Number,
    required: true,
    default: 10000 // Standard refundable deposit
  },
  paymentMethod: {
    type: String,
    enum: ['payfast', 'eft', 'wallet'],
    default: 'payfast'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'forfeited', 'cancelled'],
    default: 'pending'
  },
  paymentReference: {
    type: String
  },
  proofOfPayment: {
    type: String // URL of uploaded deposit proof
  },
  refundStatus: {
    type: String,
    enum: ['not_requested', 'pending', 'refunded'],
    default: 'not_requested'
  },
  refundRequestedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  },
  bankAccountDetails: {
    bankName: { type: String },
    accountHolder: { type: String },
    accountNumber: { type: String },
    branchCode: { type: String }
  },
  tier: {
    type: String,
    enum: ['standard', 'premium'],
    default: 'premium'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  adminNotes: {
    type: String
  },
  failureEmailDispatched: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('BidderDeposit', bidderDepositSchema);
