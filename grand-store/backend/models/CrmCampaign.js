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
  // Featured Admin Products specifically chosen for this marketing campaign
  featuredProducts: [{
    productId: {
      type: String,
      required: true
    },
    productRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: ''
    },
    slug: {
      type: String,
      default: ''
    }
  }],
  // Attached Customer Voucher Coupon created for this campaign
  attachedCoupon: {
    code: {
      type: String,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed_amount'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      default: 0
    },
    expiryDate: {
      type: Date
    },
    couponRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCoupon'
    }
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
  // Delivery metrics from actual mailer
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
  // Window in days to track purchases by campaign recipients
  attributionWindowDays: {
    type: Number,
    default: 30
  },
  // Real sales dynamically aggregated from matching orders
  attributedSalesZar: {
    type: Number,
    default: 0
  },
  attributedOrdersCount: {
    type: Number,
    default: 0
  },
  // Itemized audit log of real orders matching this campaign
  attributedOrders: [{
    orderId: { type: String },
    orderRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    customerName: { type: String },
    customerEmail: { type: String },
    amount: { type: Number, default: 0 },
    matchingProducts: [{ type: String }],
    orderDate: { type: Date },
    couponUsed: { type: String, default: '' }
  }],
  // Detailed log of recipients dispatched to
  recipientLogs: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String, required: true },
    name: { type: String, default: '' },
    status: { type: String, enum: ['sent', 'delivered', 'failed'], default: 'sent' },
    sentAt: { type: Date, default: Date.now },
    error: { type: String }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('CrmCampaign', crmCampaignSchema);
