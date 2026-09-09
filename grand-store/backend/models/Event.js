const mongoose = require("mongoose");

const ticketTierSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "General", "VIP"
  price: { type: Number, required: true },
  benefits: [String],
  quantity: { type: Number, required: true },
  sold: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
});

const eventSchema = new mongoose.Schema(
  {
    title: {
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
      enum: [
        "Wine Tasting",
        "Whisky Experience",
        "Masterclass",
        "Winemaker Dinner",
        "Festival",
        "Virtual Tasting",
        "Other",
      ],
      required: true,
    },
    format: {
      type: String,
      enum: ["Physical", "Virtual", "Hybrid"],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    location: {
      type: String, // Venue or virtual link
      required: true,
    },
    city: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    hostName: {
      type: String,
    },
    hostTitle: {
      type: String,
    },
    image: {
      type: String,
    },
    capacity: {
      type: Number,
      required: true,
    },
    ticketTiers: [ticketTierSchema],
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    tastingJourney: [String], // Array of string descriptions (Legacy/Fallback)
    tastingProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ], // Links directly to sellable products
    approvalStatus: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "pending_approval",
    },
    approvalNote: { type: String, default: "" },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    waitlist: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      dateAdded: { type: Date, default: Date.now },
      notified: { type: Boolean, default: false }
    }]
  },
  { timestamps: true },
);

eventSchema.index({ approvalStatus: 1, status: 1, date: 1 });
eventSchema.index({ vendorId: 1, createdAt: -1 });

module.exports = mongoose.model("Event", eventSchema);
