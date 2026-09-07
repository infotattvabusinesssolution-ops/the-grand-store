const mongoose = require('mongoose');

const superCoinLedgerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true // Positive for earned/credited, negative for redeemed/deducted
    },
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired', 'reversed', 'admin_adjustment'],
      required: true
    },
    activity: {
      type: String,
      enum: [
        'registration',
        'profile_completion',
        'first_purchase',
        'purchase',
        'review',
        'referral',
        'birthday',
        'order_discount',
        'refund_reversal',
        'admin_manual'
      ],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'available', 'completed', 'expired', 'cancelled'],
      default: 'available',
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    orderRef: {
      type: String
    },
    expiryDate: {
      type: Date
    },
    description: {
      type: String,
      default: ''
    },
    balanceSnapshot: {
      type: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SuperCoinLedger', superCoinLedgerSchema);
