const mongoose = require('mongoose');

const crmAudienceCategorySchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  complianceStatus: {
    type: String,
    default: 'Verified (100% Legal Age)'
  },
  channel: {
    type: String,
    default: 'Newsletter & Direct Email'
  },
  recommendedOffers: {
    type: String,
    default: ''
  },
  targetCriteria: {
    customerType: {
      type: String,
      enum: ['all_18plus', 'vip_collector', 'trade_buyer', 'event_attendees', 'optin_newsletter', 'auction_bidder', 'custom'],
      default: 'all_18plus'
    },
    tags: [{
      type: String,
      trim: true
    }],
    inactivityDays: {
      type: Number,
      default: 0
    }
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CrmAudienceCategory', crmAudienceCategorySchema);
