const mongoose = require('mongoose');

const CompetitorPriceTrackSchema = new mongoose.Schema({
  competitor: { 
    type: String, 
    default: 'Norman Goodfellows',
    index: true 
  },
  externalId: { 
    type: Number, 
    required: true, 
    unique: true, 
    index: true 
  }, // NGF WooCommerce Product ID
  sku: { 
    type: String, 
    index: true, 
    trim: true,
    default: ''
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  cleanName: { 
    type: String, 
    index: true 
  }, // Normalized lowercase token string for matching
  permalink: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  isInStock: { 
    type: Boolean, 
    default: true 
  },

  // Live NGF Pricing (in ZAR)
  currentPrice: { 
    type: Number, 
    required: true,
    default: 0
  },
  regularPrice: {
    type: Number,
    default: 0
  },
  salePrice: {
    type: Number,
    default: 0
  },
  isOnSale: { 
    type: Boolean, 
    default: false 
  },
  
  // Previous Scan Data (for drift detection)
  previousPrice: {
    type: Number,
    default: 0
  },
  lastPriceChangeAmount: {
    type: Number,
    default: 0
  },
  lastPriceChangePercent: {
    type: Number,
    default: 0
  },
  lastPriceChangedAt: Date,

  // Linkage to Grand Store Admin Product
  matchedProduct: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    index: true 
  },
  matchedProductName: {
    type: String,
    default: ''
  },
  matchConfidence: { 
    type: String, 
    enum: ['exact_sku', 'high_text', 'manual_verified', 'unmatched'],
    default: 'unmatched' 
  },

  // Grand Store vs. NGF Metrics (Computed)
  grandStorePrice: {
    type: Number,
    default: 0
  },
  varianceAmountZar: {
    type: Number,
    default: 0
  }, // grandStorePrice - currentPrice
  variancePercent: {
    type: Number,
    default: 0
  }, // ((grandStorePrice - currentPrice) / currentPrice) * 100
  marketPosition: {
    type: String,
    enum: [
      'gs_cheaper',               // Grand Store is cheaper (competitive advantage)
      'gs_expensive',             // Grand Store is more expensive (risk of losing sale)
      'price_matched',            // Within 1% parity
      'competitor_out_of_stock',  // Opportunity for Grand Store
      'unmatched'
    ],
    default: 'unmatched'
  },

  // Daily Snapshot Log (Last 90 Days)
  priceHistory: [
    {
      price: Number,
      regularPrice: Number,
      salePrice: Number,
      isInStock: Boolean,
      recordedAt: { type: Date, default: Date.now }
    }
  ],

  lastScrapedAt: { type: Date, default: Date.now }
}, { timestamps: true });

CompetitorPriceTrackSchema.index({ cleanName: 'text', name: 'text', sku: 'text' });

module.exports = mongoose.models.CompetitorPriceTrack || mongoose.model('CompetitorPriceTrack', CompetitorPriceTrackSchema);
