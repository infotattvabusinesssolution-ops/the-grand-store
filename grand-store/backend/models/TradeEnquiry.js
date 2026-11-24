const mongoose = require('mongoose');

const tradeEnquirySchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    companyname: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      default: 'enquiry',
      trim: true
    },
    tradeAgreementAccepted: {
      type: Boolean,
      default: false,
    },
    signatoryTitle: {
      type: String,
      trim: true,
    },
    electronicSignature: {
      type: String,
      trim: true,
    },
    signedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'contacted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TradeEnquiry', tradeEnquirySchema);
