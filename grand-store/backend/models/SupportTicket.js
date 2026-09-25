const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true, // e.g. TICK-26-8042
    index: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  customerName: {
    type: String,
  },
  customerEmail: {
    type: String,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true,
  },
  orderId: {
    type: String, // e.g. GS-26-SHP-ORD-000277
    required: true,
  },
  orderItem: {
    product: { type: String }, // Product ID or SKU
    name: { type: String, required: true },
    image: { type: String },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    option: { type: String },
  },
  issueType: {
    type: String,
    enum: [
      'delivery_delayed',
      'damaged_bottle',
      'wrong_item',
      'tracking_stuck',
      'postnet_pin_issue',
      'general_inquiry'
    ],
    default: 'delivery_delayed',
    index: true,
  },
  subject: {
    type: String,
    default: 'Delivery & Item Support Request',
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'courier_traced', 'reshipped', 'refunded', 'resolved', 'closed'],
    default: 'open',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'high',
  },
  conversation: [{
    sender: {
      type: String,
      enum: ['customer', 'concierge', 'system', 'admin'],
      required: true,
    },
    senderName: { type: String },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  }],
  resolution: {
    actionTaken: { type: String }, // e.g. "courier_trace", "free_replacement", "wallet_refund"
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedByName: { type: String },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String },
    refundAmount: { type: Number },
    replacementOrderId: { type: String }
  }
}, { timestamps: true });

// Optimize search queries
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
