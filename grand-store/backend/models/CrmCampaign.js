const mongoose = require('mongoose');

const crmCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  audienceSegment: {
    type: String,
    required: true
  },
  audienceSegmentLabel: {
    type: String,
    default: 'Curated Patrons'
  },
  subject: {
    type: String,
    required: true
  },
  contentBrief: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'review_pending', 'approved', 'scheduled', 'sent'],
    default: 'draft'
  },
  scheduledDate: {
    type: Date
  },
  sentDate: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedByName: {
    type: String
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  deliveryResults: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 }
  },
  unsubscribes: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  attributedSalesZar: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('CrmCampaign', crmCampaignSchema);
