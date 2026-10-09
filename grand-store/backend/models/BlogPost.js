const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Please provide a blog slug'],
      unique: true,
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      required: [true, 'Please provide an article title'],
      trim: true
    },
    titleBefore: {
      type: String,
      default: '',
      trim: true
    },
    titleAccent: {
      type: String,
      default: '',
      trim: true
    },
    titleAfter: {
      type: String,
      default: '',
      trim: true
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    readTime: {
      type: String,
      default: '5 min read',
      trim: true
    },
    category: {
      type: String,
      default: 'The Grand Edit',
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Please provide a header/thumbnail image URL'],
      trim: true
    },
    excerpt: {
      type: String,
      required: [true, 'Please provide a summary excerpt'],
      trim: true
    },
    content: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    },
    isVisible: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlogPost', blogPostSchema);
