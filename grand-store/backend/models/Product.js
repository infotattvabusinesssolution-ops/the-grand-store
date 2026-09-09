const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
    },
    category: {
      type: String,
    },
    country: {
      type: String,
    },
    brand: {
      type: String,
    },
    size: {
      type: String,
    },
    subcategory: {
      type: String,
    },
    description: String,
    price: {
      type: String,
    },
    image: String,
    imageSource: String,
    imageSourceUrl: String,
    imageSyncedAt: Date,
    originalImage: String,
    backgroundRemovalStatus: {
      type: String,
      enum: ["not_requested", "pending", "complete", "failed", "skipped"],
      default: "not_requested",
    },
    backgroundRemovalError: String,
    backgroundRemovedAt: Date,
    cloudinaryPublicId: String,
    gallery: [String],
    factSheetPdf: String,
    featured: {
      type: Boolean,
      default: false,
    },
    options: [String],
    tags: [String],
    tastingNotes: [String],
    flavorProfile: [String],
    foodPairing: [String],
    identity: {
      type: { type: String, default: "" },
      style: { type: String, default: "" },
      production: { type: String, default: "" },
      origin: { type: String, default: "" },
      age: { type: String, default: "" },
      bottleSize: { type: String, default: "" },
      abv: { type: String, default: "" },
    },
    stock: {
      type: Number,
      default: 0,
    },
    // Social Proof Engine Metrics
    badges: [
      {
        type: String, // e.g., 'GRAND_STORE_CHOICE', 'MOST_LOVED', 'TRENDING'
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    purchaseCount: {
      type: Number,
      default: 0,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // Default to approved for the seeded products
    },
    catalogManaged: {
      type: Boolean,
      default: false,
    },
    sourceWorkbooks: [String],
    sourceUrl: String,
    importedAt: Date,
    isCatalogDuplicate: {
      type: Boolean,
      default: false,
    },
    catalogDuplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    // Costing & Pricing Engine Fields (Costing GS Understanding Section 13)
    costing: {
      supplierPrice: { type: Number, default: 0 },
      supplierDiscountPct: { type: Number, default: 0 },
      netSupplierCost: { type: Number, default: 0 },
      freightCost: { type: Number, default: 0 },
      insuranceCost: { type: Number, default: 0 },
      dutiesCost: { type: Number, default: 0 },
      otherLandedCost: { type: Number, default: 0 },
      trueCost: { type: Number, default: 0 },
      vendorProfitPct: { type: Number, default: 0 },
      vendorPriceToPlatform: { type: Number, default: 0 },
      platformMarginPct: { type: Number, default: 15 },
      targetMarginPct: { type: Number, default: 30 },
      baseSellingPrice: { type: Number, default: 0 },
      minimumSellingPrice: { type: Number, default: 0 },
      rrp: { type: Number, default: 0 },
      marginStatus: { type: String, enum: ['healthy', 'warning', 'blocked'], default: 'healthy' }
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
