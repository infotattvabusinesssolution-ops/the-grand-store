const mongoose = require('mongoose');

const crmTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'customer_enquiry',      // Incoming lead, sourcing, or question
      'order_fulfilment',      // Packing, dispatch, courier booking
      'shipment_delay',        // Exception investigation, courier liaison
      'vendor_verification',   // Reviewing KYC, licence, bank details
      'vendor_product_review', // Listing quality check, image approval
      'export_quote',          // B2B international quotation follow-up
      'auction_followup',      // Unpaid lots, winning bidder concierge
      'tasting_event',         // Attendee confirmation, VIP pass dispatch
      'scheduled_call',        // Outbound phone call
      'vip_clients',           // VIP private client concierge & sourcing
      'logistics',             // Courier & delivery operations
      'auctions',              // Auction desk operations
      'compliance',            // KYC & liquor act compliance
      'settlements',           // 30-day payout milestones
      'general'
    ],
    default: 'general',
    index: true
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'medium', 'low'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open',
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    index: true
  },
  reminderDate: {
    type: Date
  },
  isOverdue: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Golden Staff Rule: Must record why task is closed
  completionReason: {
    type: String,
    trim: true
  },
  resolutionOutcome: {
    type: String,
    enum: [
      'quote_accepted',
      'alternative_chosen',
      'out_of_stock',
      'unresponsive',
      'resolved_in_full',
      'resolved_successfully',
      'cancelled_by_customer',
      'other'
    ]
  },
  linkedEntity: {
    entityType: {
      type: String,
      enum: ['Order', 'User', 'Vendor', 'TradeEnquiry', 'WineEnquiry', 'CigarEnquiry', 'AuctionLot', 'Booking']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    },
    referenceCode: {
      type: String // e.g. "GS-1004", "EXP-0021", "LOT-99"
    }
  },
  internalNotes: [{
    note: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

crmTaskSchema.index({ status: 1, dueDate: 1 });
crmTaskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('CrmTask', crmTaskSchema);
