const mongoose = require('mongoose');

const wineEnquirySchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    referral: { type: String, trim: true, maxlength: 240, default: '' },
    message: { type: String, trim: true, maxlength: 3000, default: '' },
    quantity: { type: Number, min: 1, max: 10000, default: 1 },
    preferredContact: {
      type: String,
      enum: ['email', 'phone', 'whatsapp'],
      default: 'email',
    },
    product: {
      name: { type: String, trim: true, maxlength: 240, default: 'Millionaires Collection — 2021 Limited Edition' },
      expression: { type: String, trim: true, maxlength: 180, default: 'The 2021 Limited Edition' },
      image: { type: String, trim: true, maxlength: 1000, default: '/assets/footer-bottle.png' },
      pageUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    },
    status: {
      type: String,
      enum: ['new', 'open', 'replied', 'closed'],
      default: 'new',
      index: true,
    },
    acknowledgement: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: { type: String, maxlength: 500 },
    },
    firstViewedAt: Date,
    lastResponseAt: Date,
    closedAt: Date,
    replies: [{
      subject: { type: String, required: true, trim: true, maxlength: 180 },
      message: { type: String, required: true, trim: true, maxlength: 5000 },
      sentAt: { type: Date, default: Date.now },
      sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      sentByName: { type: String, trim: true, maxlength: 120 },
      deliveryStatus: { type: String, enum: ['sent', 'failed'], default: 'sent' },
      error: { type: String, maxlength: 500 },
    }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('WineEnquiry', wineEnquirySchema);
