const mongoose = require('mongoose');

const crmCommunicationSchema = new mongoose.Schema({
  channel: {
    type: String,
    enum: ['email', 'whatsapp', 'phone_call', 'internal_note', 'sms'],
    required: true,
    index: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound', 'internal'],
    default: 'inbound'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  linkedEntity: {
    entityType: { type: String, enum: ['Order', 'ExportEnquiry', 'AuctionLot', 'Event'] },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    referenceCode: { type: String }
  },
  subject: { type: String, trim: true },
  messageBody: { type: String, required: true },
  sender: {
    name: String,
    email: String,
    phone: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  recipient: {
    name: String,
    email: String,
    phone: String
  },
  phoneCallDetails: {
    durationSeconds: { type: Number, default: 0 },
    outcome: {
      type: String,
      enum: ['reached_and_discussed', 'left_voicemail', 'no_answer', 'callback_scheduled', 'wrong_number'],
      default: 'reached_and_discussed'
    }
  },
  whatsappDetails: {
    messageId: String,
    businessAccountId: String,
    status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'delivered' }
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isResolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

crmCommunicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CrmCommunication', crmCommunicationSchema);
