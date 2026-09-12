const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  ticketType: { type: String, required: true },
  ticketTierId: { type: mongoose.Schema.Types.ObjectId, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },

  // === ACCOUNTING BREAKDOWN ===
  subTotal: { type: Number, required: true },         // quantity × ticket price
  commissionPct: { type: Number, default: 10 },       // % snapshot from PlatformSettings
  commissionAmount: { type: Number, default: 0 },     // GS commission on subTotal
  vatPct: { type: Number, default: 15 },              // VAT % snapshot
  vatAmount: { type: Number, default: 0 },            // VAT on subTotal
  organizerPayable: { type: Number, default: 0 },     // subTotal - commission - VAT
  totalPrice: { type: Number, required: true },       // What customer pays = subTotal + VAT

  // GS Reference
  gsReference: { type: String },                     // e.g. GS-26-EVT-BKG-000001

  paymentMethod: {
    type: String,
    enum: ['PayFast', 'Bank Transfer'],
    default: 'PayFast'
  },
  proofUrl: { type: String },
  bankTransferStatus: {
    type: String,
    enum: ['Awaiting_Proof', 'Awaiting_Approval', 'Approved', 'Rejected']
  },
  paymentRejectionReason: { type: String },
  proofSubmittedAt: { type: Date },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Completed', 'Refunded', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  ticketStatus: {
    type: String,
    enum: ['Pending', 'Valid', 'Used', 'Cancelled'],
    default: 'Pending'
  },
  inventoryStatus: {
    type: String,
    enum: ['reserved', 'sold', 'released'],
    default: 'reserved'
  },
  reservationExpiresAt: { type: Date, index: true },
  paymentProcessedAt: { type: Date },
  gatewayTransactionId: { type: String },
  ticketId: { type: String, required: true, unique: true },
  qrCodeData: { type: String }, // Base64 data URL for QR pass
  emailDispatched: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },
  bookingDate: { type: Date, default: Date.now }
});

bookingSchema.index({ event: 1, paymentStatus: 1, reminderSent: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
