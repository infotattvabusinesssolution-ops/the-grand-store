require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
  // Ignore DNS override errors
}
const mongoose = require("mongoose");
const path = require("path");
const Product = require("../models/Product");

// Helper to generate dynamic clean barcode image URL
const getBarcodeImageUrl = (code) => `https://barcodeapi.org/api/128/${code.replace(/\s+/g, '')}`;

const roccoTorroProducts = [
  // =========================================================================
  // 1. ROCCO TORRO 100% AGAVE COLLECTION
  // =========================================================================
  {
    id: "rt-100-agave-blanco-750",
    slug: "rocco-torro-100-percent-agave-blanco-750ml",
    name: "Rocco Torro 100% Agave Blanco 750ml",
    brand: "Rocco Torro",
    category: "Spirits",
    subcategory: "Agave Spirits",
    type: "Spirits",
    country: "South Africa",
    price: "790.00",
    size: "750ml",
    stock: 36,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983280/grandstore-uploads/products/rocco-torro-blanco.jpg",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983280/grandstore-uploads/products/rocco-torro-blanco.jpg",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983280/grandstore-uploads/products/rocco-torro-blanco.jpg",
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983280/grandstore-uploads/products/rocco-torro-blanco.jpg"
    ],
    description: "Distilled from 100% Karoo Agave at our licensed, single-spirit distillery in Graaff-Reinet in the Great Karoo, crafted entirely on site from field to bottle. After distillation, the spirit rests for two weeks to soften and refine its edges while preserving its natural agave purity. Clean, vibrant and expressive, our Blanco showcases the true character of agave in its most authentic form.",
    tastingNotes: [
      "Natural Agave Purity",
      "Clean Citrus & Lime Zest",
      "Crisp Karoo Minerality",
      "Vibrant Herbaceous Freshness",
      "Smooth White Pepper Finish"
    ],
    flavorProfile: ["Clean & Vibrant", "Authentic Agave Expression", "Silky & Crisp"],
    foodPairing: ["Fresh Coastal Oysters", "Citrus Kingklip Ceviche", "Grilled Tiger Prawns", "Artisanal Mexican Tacos"],
    identity: {
      type: "100% Agave Spirit",
      style: "Blanco / Unaged Craft Agave",
      production: "Distilled from 100% Agave in Graaff-Reinet, Great Karoo, South Africa",
      origin: "Graaff-Reinet, Great Karoo, South Africa",
      age: "Rested 2 Weeks",
      bottleSize: "750ml",
      abv: "43.0%",
      barcode: "6009900475318",
      barcodeImage: getBarcodeImageUrl("6009900475318"),
      cartonBarcode: "16009900475315"
    },
    barcode: "6009900475318",
    barcodeImage: getBarcodeImageUrl("6009900475318"),
    cartonBarcode: "16009900475315",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.65,
      length_cm: 11.0,
      width_cm: 11.0,
      height_cm: 33.0,
      is_fragile: true,
      parcel_value: 790,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    },
    costing: {
      supplierPrice: 686.96,
      supplierDiscountPct: 0,
      netSupplierCost: 686.96,
      baseSellingPrice: 790.00,
      minimumSellingPrice: 750.00,
      rrp: 790.00,
      platformMarginPct: 15,
      targetMarginPct: 15,
      marginStatus: "healthy"
    },
    channelSettings: {
      retail: {
        enabled: true,
        minOrderQuantity: 1,
        maxOrderQuantity: 12
      },
      trade: {
        enabled: true,
        exportApprovalStatus: "approved",
        moqBottles: 12,
        bottlesPerCase: 1,
        casesPerPallet: 120,
        hsCode: "2208.90",
        supportedIncoterms: ["FOB", "EXW", "CIF"]
      }
    },
    featured: true,
    badges: ["2026_FB_GOLD", "AURORA_CHALLENGE_WINNER", "100_PERCENT_AGAVE", "KAROO_DISTILLED"],
    vendorId: null,
    catalogManaged: true,
    approvalStatus: "approved"
  },
  {
    id: "rt-100-agave-reposado-french-oak-750",
    slug: "rocco-torro-100-percent-agave-reposado-french-oak-750ml",
    name: "Rocco Torro 100% Agave Reposado French Oak 750ml",
    brand: "Rocco Torro",
    category: "Spirits",
    subcategory: "Agave Spirits",
    type: "Spirits",
    country: "South Africa",
    price: "790.00",
    size: "750ml",
    stock: 36,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983281/grandstore-uploads/products/rocco-torro-reposado-french-oak.jpg",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983281/grandstore-uploads/products/rocco-torro-reposado-french-oak.jpg",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983281/grandstore-uploads/products/rocco-torro-reposado-french-oak.jpg",
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983280/grandstore-uploads/products/rocco-torro-blanco.jpg"
    ],
    description: "Distilled from 100% Karoo Agave at our licensed single-spirit distillery in Graaff-Reinet. After distillation, the spirit rests for a minimum of three months in hand-selected French oak barrels, developing deeper spice and subtle fruit complexity. The result is a refined, dry Reposado with layered character and an elegant, lingering finish.",
    tastingNotes: [
      "Subtle Dried Fruit Complexity",
      "French Oak Warm Baking Spice",
      "Roasted Karoo Agave",
      "Toasted Brioche & Cedar",
      "Elegant Lingering Dry Finish"
    ],
    flavorProfile: ["Layered & Refined", "Dry & Elegant", "Deep French Oak Spice"],
    foodPairing: ["Slow-roasted Karoo Lamb Shank", "Aged Manchego Cheese", "Dark Chocolate Truffles", "Seared Duck Breast with Cherry Glaze"],
    identity: {
      type: "100% Agave Spirit",
      style: "Reposado / French Oak Barrel Matured",
      production: "Distilled from 100% Agave in Graaff-Reinet, Matured in French Oak Casks for 3+ Months",
      origin: "Graaff-Reinet, Great Karoo, South Africa",
      age: "Matured 3+ Months",
      bottleSize: "750ml",
      abv: "43.0%",
      barcode: "6009900542034",
      barcodeImage: getBarcodeImageUrl("6009900542034"),
      cartonBarcode: "16009900542031"
    },
    barcode: "6009900542034",
    barcodeImage: getBarcodeImageUrl("6009900542034"),
    cartonBarcode: "16009900542031",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.65,
      length_cm: 11.0,
      width_cm: 11.0,
      height_cm: 33.0,
      is_fragile: true,
      parcel_value: 790,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    },
    costing: {
      supplierPrice: 686.96,
      supplierDiscountPct: 0,
      netSupplierCost: 686.96,
      baseSellingPrice: 790.00,
      minimumSellingPrice: 750.00,
      rrp: 790.00,
      platformMarginPct: 15,
      targetMarginPct: 15,
      marginStatus: "healthy"
    },
    channelSettings: {
      retail: {
        enabled: true,
        minOrderQuantity: 1,
        maxOrderQuantity: 12
      },
      trade: {
        enabled: true,
        exportApprovalStatus: "approved",
        moqBottles: 12,
        bottlesPerCase: 1,
        casesPerPallet: 120,
        hsCode: "2208.90",
        supportedIncoterms: ["FOB", "EXW", "CIF"]
      }
    },
    featured: true,
    badges: ["2026_FB_DOUBLE_GOLD", "DOUBLE_GOLD_MEDAL", "BARREL_AGED", "FRENCH_OAK"],
    vendorId: null,
    catalogManaged: true,
    approvalStatus: "approved"
  },
  {
    id: "rt-100-agave-reposado-american-oak-750",
    slug: "rocco-torro-100-percent-agave-reposado-american-oak-750ml",
    name: "Rocco Torro 100% Agave Reposado American Oak 750ml",
    brand: "Rocco Torro",
    category: "Spirits",
    subcategory: "Agave Spirits",
    type: "Spirits",
    country: "South Africa",
    price: "790.00",
    size: "750ml",
    stock: 36,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983282/grandstore-uploads/products/rocco-torro-reposado-american-oak.jpg",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983282/grandstore-uploads/products/rocco-torro-reposado-american-oak.jpg",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983282/grandstore-uploads/products/rocco-torro-reposado-american-oak.jpg",
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983280/grandstore-uploads/products/rocco-torro-blanco.jpg"
    ],
    description: "Matured for a minimum of three months in charred American oak barrels at our Karoo distillery. This Reposado develops classic rich vanilla and golden caramel notes. Smooth, balanced and approachable, it offers a warm, rounded finish with distinctive sweet oak influence.",
    tastingNotes: [
      "Bourbon Vanilla Pod",
      "Golden Salted Caramel",
      "Sweet Roasted Karoo Agave",
      "Warm Toasted Oak",
      "Silky Rounded Honey Finish"
    ],
    flavorProfile: ["Smooth & Approachable", "Rich Vanilla & Caramel", "Warm Oak Finish"],
    foodPairing: ["Barbecue Glazed Beef Ribs", "Slow Cooked Pork Belly", "Classic Crème Brûlée", "Caramelized Pecan Tart"],
    identity: {
      type: "100% Agave Spirit",
      style: "Reposado / American Oak Barrel Matured",
      production: "Distilled from 100% Agave in Graaff-Reinet, Matured in Charred American Oak for 3+ Months",
      origin: "Graaff-Reinet, Great Karoo, South Africa",
      age: "Matured 3+ Months",
      bottleSize: "750ml",
      abv: "43.0%",
      barcode: "6009900542027",
      barcodeImage: getBarcodeImageUrl("6009900542027"),
      cartonBarcode: "16009900542024"
    },
    barcode: "6009900542027",
    barcodeImage: getBarcodeImageUrl("6009900542027"),
    cartonBarcode: "16009900542024",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.65,
      length_cm: 11.0,
      width_cm: 11.0,
      height_cm: 33.0,
      is_fragile: true,
      parcel_value: 790,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    },
    costing: {
      supplierPrice: 686.96,
      supplierDiscountPct: 0,
      netSupplierCost: 686.96,
      baseSellingPrice: 790.00,
      minimumSellingPrice: 750.00,
      rrp: 790.00,
      platformMarginPct: 15,
      targetMarginPct: 15,
      marginStatus: "healthy"
    },
    channelSettings: {
      retail: {
        enabled: true,
        minOrderQuantity: 1,
        maxOrderQuantity: 12
      },
      trade: {
        enabled: true,
        exportApprovalStatus: "approved",
        moqBottles: 12,
        bottlesPerCase: 1,
        casesPerPallet: 120,
        hsCode: "2208.90",
        supportedIncoterms: ["FOB", "EXW", "CIF"]
      }
    },
    featured: true,
    badges: ["2026_FB_GOLD", "GOLD_MEDAL", "BARREL_AGED", "AMERICAN_OAK"],
    vendorId: null,
    catalogManaged: true,
    approvalStatus: "approved"
  },

  // =========================================================================
  // 2. ROCCO TORRO CRAFTED BLEND COLLECTION
  // =========================================================================
  {
    id: "rt-crafted-blend-gold-750",
    slug: "rocco-torro-crafted-blend-gold-750ml",
    name: "Rocco Torro Crafted Blend Gold 750ml",
    brand: "Rocco Torro",
    category: "Spirits",
    subcategory: "Agave Spirits",
    type: "Spirits",
    country: "South Africa",
    price: "355.00",
    size: "750ml",
    stock: 48,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983283/grandstore-uploads/products/rocco-torro-gold.jpg",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983283/grandstore-uploads/products/rocco-torro-gold.jpg",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983283/grandstore-uploads/products/rocco-torro-gold.jpg",
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983280/grandstore-uploads/products/rocco-torro-blanco.jpg"
    ],
    description: "Rocco Torro Crafted Blend Gold is an artisanal spirit expertly blended from fine Karoo agave distillate and barrel-aged accents. Smooth, golden, and rich with hints of toasted oak, amber honey, and sweet agave nectar, perfect for classic cocktails, neat sipping, or premium shots.",
    tastingNotes: [
      "Golden Caramel",
      "Amber Wild Honey",
      "Light Oak Warmth",
      "Sweet Agave Nectar",
      "Mellow Rounded Finish"
    ],
    flavorProfile: ["Smooth & Rich", "Balanced Sweetness", "Golden Warmth"],
    foodPairing: ["Spicy Mexican Tacos", "Grilled Chicken Quesadillas", "Mature Cheddar Board", "Loaded Nachos"],
    identity: {
      type: "Crafted Blend Agave Spirit",
      style: "Gold Crafted Agave Blend",
      production: "Artisanal Agave Blend, Winelands Park, Stellenbosch & Great Karoo",
      origin: "Stellenbosch & Great Karoo, South Africa",
      bottleSize: "750ml",
      abv: "38.0%",
      barcode: "6001651238334",
      barcodeImage: getBarcodeImageUrl("6001651238334"),
      cartonBarcode: "16001651238331"
    },
    barcode: "6001651238334",
    barcodeImage: getBarcodeImageUrl("6001651238334"),
    cartonBarcode: "16001651238331",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.55,
      length_cm: 10.0,
      width_cm: 10.0,
      height_cm: 32.0,
      is_fragile: true,
      parcel_value: 355,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    },
    costing: {
      supplierPrice: 308.71,
      supplierDiscountPct: 0,
      netSupplierCost: 308.71,
      baseSellingPrice: 355.00,
      minimumSellingPrice: 330.00,
      rrp: 355.00,
      platformMarginPct: 15,
      targetMarginPct: 15,
      marginStatus: "healthy"
    },
    channelSettings: {
      retail: {
        enabled: true,
        minOrderQuantity: 1,
        maxOrderQuantity: 24,
        casePrice: 2130.10,
        caseSize: 6
      },
      trade: {
        enabled: true,
        exportApprovalStatus: "approved",
        moqBottles: 60,
        bottlesPerCase: 6,
        casesPerPallet: 80,
        hsCode: "2208.90",
        supportedIncoterms: ["FOB", "EXW", "CIF"]
      }
    },
    featured: false,
    badges: ["CRAFTED_BLEND", "GOLD_SELECTION", "BEST_VALUE"],
    vendorId: null,
    catalogManaged: true,
    approvalStatus: "approved"
  },
  {
    id: "rt-crafted-blend-silver-750",
    slug: "rocco-torro-crafted-blend-silver-750ml",
    name: "Rocco Torro Crafted Blend Silver 750ml",
    brand: "Rocco Torro",
    category: "Spirits",
    subcategory: "Agave Spirits",
    type: "Spirits",
    country: "South Africa",
    price: "355.00",
    size: "750ml",
    stock: 48,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983284/grandstore-uploads/products/rocco-torro-silver.jpg",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983284/grandstore-uploads/products/rocco-torro-silver.jpg",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983284/grandstore-uploads/products/rocco-torro-silver.jpg",
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983280/grandstore-uploads/products/rocco-torro-blanco.jpg"
    ],
    description: "Rocco Torro Crafted Blend Silver is a crisp, crystal-clear crafted agave spirit. Energetic and ultra-smooth on the palate with vibrant floral agave notes, clean lime zest, and subtle cracked pepper, making it the supreme choice for refreshing Margaritas, Palomas, and signature craft cocktails.",
    tastingNotes: [
      "Fresh Highland Agave",
      "Bright Lime Zest",
      "Mild White Pepper",
      "Subtle Floral Blossom",
      "Ultra-Clean Crisp Finish"
    ],
    flavorProfile: ["Crisp & Energetic", "Ultra-Smooth", "Citrus & Agave"],
    foodPairing: ["Baja Fish Tacos", "Authentic Guacamole & Chips", "Snapper Ceviche", "Classic Margaritas"],
    identity: {
      type: "Crafted Blend Agave Spirit",
      style: "Silver Crafted Agave Blend",
      production: "Artisanal Agave Blend, Winelands Park, Stellenbosch & Great Karoo",
      origin: "Stellenbosch & Great Karoo, South Africa",
      bottleSize: "750ml",
      abv: "38.0%",
      barcode: "6001651130089",
      barcodeImage: getBarcodeImageUrl("6001651130089"),
      cartonBarcode: "16001651130086"
    },
    barcode: "6001651130089",
    barcodeImage: getBarcodeImageUrl("6001651130089"),
    cartonBarcode: "16001651130086",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.55,
      length_cm: 10.0,
      width_cm: 10.0,
      height_cm: 32.0,
      is_fragile: true,
      parcel_value: 355,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    },
    costing: {
      supplierPrice: 308.71,
      supplierDiscountPct: 0,
      netSupplierCost: 308.71,
      baseSellingPrice: 355.00,
      minimumSellingPrice: 330.00,
      rrp: 355.00,
      platformMarginPct: 15,
      targetMarginPct: 15,
      marginStatus: "healthy"
    },
    channelSettings: {
      retail: {
        enabled: true,
        minOrderQuantity: 1,
        maxOrderQuantity: 24,
        casePrice: 2130.10,
        caseSize: 6
      },
      trade: {
        enabled: true,
        exportApprovalStatus: "approved",
        moqBottles: 60,
        bottlesPerCase: 6,
        casesPerPallet: 80,
        hsCode: "2208.90",
        supportedIncoterms: ["FOB", "EXW", "CIF"]
      }
    },
    featured: false,
    badges: ["CRAFTED_BLEND", "SILVER_SELECTION", "COCKTAIL_HERO"],
    vendorId: null,
    catalogManaged: true,
    approvalStatus: "approved"
  },
  {
    id: "rt-crafted-blend-white-chocolate-750",
    slug: "rocco-torro-crafted-blend-white-chocolate-750ml",
    name: "Rocco Torro Crafted Blend White Chocolate 750ml",
    brand: "Rocco Torro",
    category: "Spirits",
    subcategory: "Cream & Liqueur",
    type: "Spirits",
    country: "South Africa",
    price: "365.00",
    size: "750ml",
    stock: 48,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983285/grandstore-uploads/products/rocco-torro-white-chocolate.jpg",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983285/grandstore-uploads/products/rocco-torro-white-chocolate.jpg",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983285/grandstore-uploads/products/rocco-torro-white-chocolate.jpg",
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1791983280/grandstore-uploads/products/rocco-torro-blanco.jpg"
    ],
    description: "An indulgent craft spirit creation blending velvety white chocolate cream with the distinctive warmth of Karoo agave. Luxurious, decadent, and delightfully smooth on the palate, it delivers luscious notes of Belgian white chocolate, sweet Bourbon vanilla, and rich cream.",
    tastingNotes: [
      "Belgian White Chocolate",
      "Sweet Madagascar Vanilla Pod",
      "Luscious Silky Cream",
      "Subtle Roasted Agave Warmth",
      "Velvety Decadent Dessert Finish"
    ],
    flavorProfile: ["Rich & Velvety", "Decadent Sweetness", "Creamy Indulgence"],
    foodPairing: ["Espresso & Coffee Cocktails", "Classic Tiramisu", "Berry Pavlova", "Poured Over Artisan Ice Cream"],
    identity: {
      type: "Agave Cream Liqueur",
      style: "Crafted White Chocolate Cream",
      production: "Velvety White Chocolate Cream Blended with Karoo Agave, Winelands Park, Stellenbosch",
      origin: "Stellenbosch & Great Karoo, South Africa",
      bottleSize: "750ml",
      abv: "17.0%",
      barcode: "6009900475301",
      barcodeImage: getBarcodeImageUrl("6009900475301"),
      cartonBarcode: "16009900475308"
    },
    barcode: "6009900475301",
    barcodeImage: getBarcodeImageUrl("6009900475301"),
    cartonBarcode: "16009900475308",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.55,
      length_cm: 10.0,
      width_cm: 10.0,
      height_cm: 32.0,
      is_fragile: true,
      parcel_value: 365,
      hs_code: "2208.70",
      aramexServiceType: "ONP"
    },
    costing: {
      supplierPrice: 317.51,
      supplierDiscountPct: 0,
      netSupplierCost: 317.51,
      baseSellingPrice: 365.00,
      minimumSellingPrice: 340.00,
      rrp: 365.00,
      platformMarginPct: 15,
      targetMarginPct: 15,
      marginStatus: "healthy"
    },
    channelSettings: {
      retail: {
        enabled: true,
        minOrderQuantity: 1,
        maxOrderQuantity: 24,
        casePrice: 2190.82,
        caseSize: 6
      },
      trade: {
        enabled: true,
        exportApprovalStatus: "approved",
        moqBottles: 60,
        bottlesPerCase: 6,
        casesPerPallet: 80,
        hsCode: "2208.70",
        supportedIncoterms: ["FOB", "EXW", "CIF"]
      }
    },
    featured: true,
    badges: ["WHITE_CHOCOLATE", "CREAM_LIQUEUR", "DESSERT_LUXURY", "INDULGENT_CRAFT"],
    vendorId: null,
    catalogManaged: true,
    approvalStatus: "approved"
  }
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log("Connected to MongoDB successfully.");

    let inserted = 0;
    let updated = 0;

    for (const prod of roccoTorroProducts) {
      const existing = await Product.findOne({
        $or: [
          { id: prod.id },
          { slug: prod.slug },
          { barcode: prod.barcode }
        ]
      });

      if (existing) {
        Object.assign(existing, prod);
        await existing.save();
        console.log(`[UPDATED] ${prod.name} (Barcode: ${prod.barcode})`);
        updated++;
      } else {
        await Product.create(prod);
        console.log(`[INSERTED] ${prod.name} (Barcode: ${prod.barcode})`);
        inserted++;
      }
    }

    console.log(`\n========================================`);
    console.log(`Rocco Torro Seeding Finished Successfully!`);
    console.log(`Total Products: ${roccoTorroProducts.length}`);
    console.log(`  - Newly Inserted: ${inserted}`);
    console.log(`  - Updated Existing: ${updated}`);
    console.log(`All 6 products seeded as ADMIN retail products (vendorId: null).`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
}

seed();
