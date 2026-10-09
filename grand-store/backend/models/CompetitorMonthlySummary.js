const mongoose = require('mongoose');

const CompetitorMonthlySummarySchema = new mongoose.Schema({
  competitorTrackId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CompetitorPriceTrack', 
    required: true,
    index: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    index: true 
  },
  productName: {
    type: String,
    required: true
  },
  competitorName: { 
    type: String, 
    default: 'Norman Goodfellows' 
  },
  month: { 
    type: String, 
    required: true, 
    index: true 
  }, // Format: 'YYYY-MM' (e.g. '2026-09')

  // Pricing Metrics Over the Month
  monthStartPrice: {
    type: Number,
    default: 0
  },
  monthEndPrice: {
    type: Number,
    default: 0
  },
  averagePrice: {
    type: Number,
    default: 0
  },
  minPrice: {
    type: Number,
    default: 0
  },
  maxPrice: {
    type: Number,
    default: 0
  },
  priceChangeCount: { 
    type: Number, 
    default: 0 
  },
  netMonthlyDriftZar: {
    type: Number,
    default: 0
  },
  netMonthlyDriftPercent: {
    type: Number,
    default: 0
  },
  
  // Stock Availability
  daysInStock: {
    type: Number,
    default: 1
  },
  daysOutOfStock: {
    type: Number,
    default: 0
  },
  stockAvailabilityPercent: {
    type: Number,
    default: 100
  },

  // Grand Store Average Comparison
  grandStoreMonthlyAvg: {
    type: Number,
    default: 0
  },
  avgVarianceZar: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

CompetitorMonthlySummarySchema.index({ competitorTrackId: 1, month: 1 }, { unique: true });

module.exports = mongoose.models.CompetitorMonthlySummary || mongoose.model('CompetitorMonthlySummary', CompetitorMonthlySummarySchema);
