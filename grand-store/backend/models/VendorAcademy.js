const mongoose = require('mongoose');

const vendorAcademyLessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Getting Started',
        'Selling & Growth',
        'Photography & Presentation',
        'Payouts & Finance',
        'Fulfillment & Packaging',
        'Trade & B2B',
        'Auctions & Allocation',
        'General'
      ],
      default: 'Selling & Growth',
    },
    videoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      type: String,
      trim: true,
      default: '5:00',
    },
    thumbnail: {
      type: String,
      trim: true,
      default: '',
    },
    articleContent: {
      type: String,
      default: '',
    },
    badge: {
      type: String,
      trim: true,
      default: '', // e.g. 'Essential', 'Featured', 'New'
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const vendorAcademyConfigSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: 'Vendor Academy',
    },
    heroSubtitle: {
      type: String,
      default: 'Master the marketplace. Learn how to optimize your store, photograph your products, and grow your sales.',
    },
    sidebarLabel: {
      type: String,
      default: 'Vendor Academy',
    },
    sidebarBadge: {
      type: String,
      default: '',
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    whatsappNumber: {
      type: String,
      default: '+27 82 000 0000',
    },
    whatsappMessage: {
      type: String,
      default: 'Hello Grand Store Partner Support, I am an active vendor and need guidance with...',
    },
    ticketUrl: {
      type: String,
      default: 'mailto:partners@grandstoreglobal.com?subject=Vendor%20Academy%20Support%20Ticket',
    },
    helpCentreUrl: {
      type: String,
      default: '/glossary',
    },
    requestCallPhone: {
      type: String,
      default: '+27 11 000 0000',
    },
  },
  { timestamps: true }
);

const VendorAcademyLesson = mongoose.model('VendorAcademyLesson', vendorAcademyLessonSchema);
const VendorAcademyConfig = mongoose.model('VendorAcademyConfig', vendorAcademyConfigSchema);

module.exports = {
  VendorAcademyLesson,
  VendorAcademyConfig,
};
