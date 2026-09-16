const mongoose = require('mongoose');

const partnerDestinationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a destination title'],
      trim: true
    },
    eyebrow: {
      type: String,
      default: 'The Smoking Room',
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true
    },
    href: {
      type: String,
      required: [true, 'Please provide a destination URL or path'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Please provide an image URL or asset path'],
      trim: true
    },
    label: {
      type: String,
      default: 'Explore the club',
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PartnerDestination', partnerDestinationSchema);
