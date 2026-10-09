const mongoose = require("mongoose");

const luxuryShowcaseSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: true,
    },
    badge: {
      type: String,
      default: "HAUTE CUVÉE • MÉTHODE CAP CLASSIQUE",
    },
    heading: {
      type: String,
      default: "M Collection",
    },
    edition: {
      type: String,
      default: "The Brut Reserve",
    },
    tagline: {
      type: String,
      default: "Born for the Grandest Moments.",
    },
    story: {
      type: String,
      default:
        "The “M” stands for Millionaire—a symbol of status, select taste, and timeless sophistication. Hand-selected Chardonnay and Pinot Noir undergo 36 months of patient cellar maturation on the lees in silent French oak cellars. An African masterpiece in every bead.",
    },
    estateQuote: {
      type: String,
      default:
        "“Harvested selectively at peak ripeness to capture tension, purity, and magnificent crystalline length from vine to flute.”",
    },
    cellarMaster: {
      type: String,
      default: "Private Cellar Master Selection",
    },
    specs: {
      leesAgeing: { type: String, default: "36 Months on Lees" },
      blend: { type: String, default: "60% Chardonnay, 40% Pinot Noir" },
      press: { type: String, default: "0.4 Bar Whole-Bunch Press" },
      dosage: { type: String, default: "Brut Nature • Hand Disgorged" },
      abv: { type: String, default: "12.0% ABV" },
      origin: { type: String, default: "Western Cape, South Africa" },
      bottleSize: { type: String, default: "750ml" },
    },
    tastingNotes: {
      nose: {
        type: String,
        default: "Crisp Green Apple, White Truffle, Citrus Blossom",
      },
      palate: {
        type: String,
        default: "Toasted Brioche, Creamy Lemon Curd, Roasted Hazelnut",
      },
      finish: {
        type: String,
        default: "Enduring Crystalline Minerality & Fine Persistent Bead",
      },
    },
    price: {
      type: Number,
      default: 850,
    },
    offerPrice: {
      type: Number,
      default: 795,
    },
    stock: {
      type: Number,
      default: 50,
    },
    bottleImage: {
      type: String,
      default: "/assets/mcollection/mcollection-brut.png",
    },
    productRefId: {
      type: String,
      default: "mcollection-brut-reserve",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    ctaText: {
      type: String,
      default: "Reserve Allocation",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LuxuryShowcase", luxuryShowcaseSchema);
