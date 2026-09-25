const express = require("express");
const router = express.Router();
const LuxuryShowcase = require("../models/LuxuryShowcase");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const seedBrutReserve = require("../scripts/seedBrutReserve");

const DEFAULT_SHOWCASE = {
  isEnabled: true,
  badge: "HAUTE CUVÉE • MÉTHODE CAP CLASSIQUE",
  heading: "M Collection",
  edition: "The Brut Reserve",
  tagline: "Born for the Grandest Moments.",
  story:
    "The “M” stands for Millionaire—a symbol of status, select taste, and timeless sophistication. Hand-selected Chardonnay and Pinot Noir undergo 36 months of patient cellar maturation on the lees in silent French oak cellars. An African masterpiece in every bead.",
  estateQuote:
    "“Harvested selectively at peak ripeness to capture tension, purity, and magnificent crystalline length from vine to flute.”",
  cellarMaster: "Private Cellar Master Reserve",
  specs: {
    leesAgeing: "36 Months on Lees",
    blend: "60% Chardonnay, 40% Pinot Noir",
    press: "0.4 Bar Whole-Bunch Press",
    dosage: "Brut Nature • Hand Disgorged",
    abv: "12.0% ABV",
    origin: "Western Cape, South Africa",
    bottleSize: "750ml",
  },
  tastingNotes: {
    nose: "Crisp Green Apple, White Truffle, Citrus Blossom",
    palate: "Toasted Brioche, Creamy Lemon Curd, Roasted Hazelnut",
    finish: "Enduring Crystalline Minerality & Fine Persistent Bead",
  },
  price: 850,
  offerPrice: 795,
  stock: 50,
  bottleImage: "/assets/mcollection/mcollection-brut.png",
  productRefId: "mcollection-brut-reserve",
  ctaText: "Reserve Allocation",
};

// @route   GET /api/luxury-showcase/public
// @desc    Get public luxury showcase data for Web and Mobile
// @access  Public
router.get("/public", async (req, res) => {
  try {
    let showcase = await LuxuryShowcase.findOne().lean();

    if (!showcase) {
      // Auto seed in background or return default
      try {
        const seeded = await seedBrutReserve(true);
        showcase = seeded.showcase.toObject();
      } catch (err) {
        showcase = DEFAULT_SHOWCASE;
      }
    }

    // Try to link live retail product data
    let product = null;
    if (showcase.productId) {
      product = await Product.findById(showcase.productId).lean();
    }
    if (!product && showcase.productRefId) {
      product = await Product.findOne({ id: showcase.productRefId }).lean();
    }

    if (product) {
      showcase.liveProduct = {
        _id: product._id,
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: Number(product.price) || showcase.price,
        offer_price: Number(product.offer_price) || showcase.offerPrice,
        offer_active: product.offer_active !== false,
        stock: product.stock !== undefined ? product.stock : showcase.stock,
        image: product.image || showcase.bottleImage,
        category: product.category,
        brand: product.brand,
      };
    }

    res.json(showcase);
  } catch (error) {
    console.error("Error fetching public luxury showcase:", error);
    res.json(DEFAULT_SHOWCASE);
  }
});

// @route   GET /api/luxury-showcase
// @desc    Get luxury showcase configuration for Admin
// @access  Private/Admin
router.get("/", protect, async (req, res) => {
  try {
    let showcase = await LuxuryShowcase.findOne();
    if (!showcase) {
      showcase = await LuxuryShowcase.create(DEFAULT_SHOWCASE);
    }
    const product = await Product.findOne({
      id: showcase.productRefId || "mcollection-brut-reserve",
    }).lean();

    res.json({ showcase, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/luxury-showcase
// @desc    Update luxury showcase configuration
// @access  Private/Admin
router.put("/", protect, async (req, res) => {
  try {
    let showcase = await LuxuryShowcase.findOne();
    if (!showcase) {
      showcase = new LuxuryShowcase();
    }

    const updatable = [
      "isEnabled",
      "badge",
      "heading",
      "edition",
      "tagline",
      "story",
      "estateQuote",
      "cellarMaster",
      "specs",
      "tastingNotes",
      "price",
      "offerPrice",
      "bottleImage",
      "ctaText",
    ];

    updatable.forEach((key) => {
      if (req.body[key] !== undefined) {
        showcase[key] = req.body[key];
      }
    });

    const saved = await showcase.save();
    res.json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/luxury-showcase/seed
// @desc    Trigger seed of Brut Reserve Retail Product and Showcase Config
// @access  Private/Admin
router.post("/seed", protect, async (req, res) => {
  try {
    const result = await seedBrutReserve(true);
    res.json({
      message: "M Collection The Brut Reserve successfully seeded as Retail Product!",
      product: result.product,
      showcase: result.showcase,
    });
  } catch (error) {
    console.error("Manual seed error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
