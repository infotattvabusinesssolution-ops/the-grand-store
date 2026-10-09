const mongoose = require('mongoose');

const productCouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    trim: true,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  // Strictly Admin Products only (where vendorId is null or not set)
  applicableProducts: [{
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
    image: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      default: ''
    }
  }],
  // Minimum order spend in ZAR before coupon can apply
  minSpendZar: {
    type: Number,
    default: 0
  },
  // Optional linkage to a CRM Marketing Campaign
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CrmCampaign'
  },
  campaignName: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perCustomerLimit: {
    type: Number,
    default: 1
  },
  redeemedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    orderId: {
      type: String
    },
    orderRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    discountApplied: {
      type: Number,
      default: 0
    },
    redeemedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: {
    type: String,
    default: 'Grand Store Administrator'
  }
}, { timestamps: true });

// Helper method to check if coupon is currently valid
productCouponSchema.methods.isValid = function() {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startDate && now < this.startDate) return false;
  if (this.expiryDate && now > this.expiryDate) return false;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  return true;
};

module.exports = mongoose.model('ProductCoupon', productCouponSchema);
