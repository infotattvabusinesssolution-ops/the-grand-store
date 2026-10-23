require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
  // Ignore if DNS override fails
}
const mongoose = require("mongoose");
const path = require("path");
const Product = require("../models/Product");

// Helper to generate dynamic clean barcode image URL
const getBarcodeImageUrl = (code) => `https://barcodeapi.org/api/128/${code}`;

const retailProducts = [
  // =========================================================================
  // 1. BALLANTINE'S
  // =========================================================================
  {
    id: "ws-ballantines-21",
    slug: "ballantines-21-year-old-blended-scotch-whisky",
    name: "Ballantine's 21 Year Old Blended Scotch Whisky 750ml",
    brand: "Ballantine's",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    type: "Whisky",
    country: "Scotland",
    price: "3990",
    size: "750ml",
    stock: 24,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792675134/grand-store/catalog-originals/whisky/ballantines/ballantines-21-year-old-blended-scotch-whisky-750ml.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792675134/grand-store/catalog-originals/whisky/ballantines/ballantines-21-year-old-blended-scotch-whisky-750ml.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1792675134/grand-store/catalog-originals/whisky/ballantines/ballantines-21-year-old-blended-scotch-whisky-750ml.png"
    ],
    description: "A rich, luxurious blended Scotch whisky aged for a minimum of 21 years. Crafted with a high proportion of rare single malts from Speyside and the Highlands, it displays extraordinary balance, velvety texture, and a long, warming finish with honeyed oak and sweet heather smoke.",
    tastingNotes: [
      "Wild Heather Honey",
      "Rich Dried Fruit",
      "Warm Cinnamon & Nutmeg",
      "Toasted Oak",
      "Velvety Speyside Apple"
    ],
    flavorProfile: ["Smooth & Rich", "Spicy & Floral", "Sweet Honey Finish"],
    foodPairing: ["Dark Chocolate Truffles", "Roast Duck with Plum Sauce", "Aged Stilton", "Smoked Salmon"],
    identity: {
      type: "Blended Scotch Whisky",
      style: "21 Year Old De Luxe Blend",
      production: "Aged 21 Years in European & American Oak Casks",
      origin: "Dumbarton, Speyside & Highlands, Scotland",
      age: "21 Years",
      bottleSize: "750ml",
      abv: "40.0%",
      barcode: "5000299223017",
      barcodeImage: getBarcodeImageUrl("5000299223017"),
      cartonBarcode: "15000299223014"
    },
    barcode: "5000299223017",
    barcodeImage: getBarcodeImageUrl("5000299223017"),
    cartonBarcode: "15000299223014",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.85,
      length_cm: 12.0,
      width_cm: 12.0,
      height_cm: 34.0,
      is_fragile: true,
      parcel_value: 3990,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    },
    featured: true,
    badges: ["GRAND_STORE_CHOICE", "RETAIL_SELECTION", "PREMIUM_AGE_STATEMENT"],
    vendorId: null, // Admin retail product
    approvalStatus: "approved"
  },
  {
    id: "ws-ballantines-hardfired",
    slug: "ballantines-hard-fired-blended-scotch-whisky-1l",
    name: "Ballantine's Hard Fired Blended Scotch Whisky 1L",
    brand: "Ballantine's",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    type: "Whisky",
    country: "Scotland",
    price: "490",
    size: "1000ml",
    stock: 40,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792675133/grand-store/catalog-originals/whisky/ballantines/ballantines-hard-fired-blended-scotch-whisky-1l.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792675133/grand-store/catalog-originals/whisky/ballantines/ballantines-hard-fired-blended-scotch-whisky-1l.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1792675133/grand-store/catalog-originals/whisky/ballantines/ballantines-hard-fired-blended-scotch-whisky-1l.png"
    ],
    description: "Ballantine's Hard Fired undergoes a bespoke double-charring process in bespoke American white oak casks. The intense heat unlocks deep vanilla sweetness, crisp orchard green apples, and delicate campfire smoke.",
    tastingNotes: [
      "Charred American Oak",
      "Vanilla Cream",
      "Crisp Green Apple",
      "Toasted Coconut",
      "Gentle Sweet Smoke"
    ],
    flavorProfile: ["Smoky Sweetness", "Rich Vanilla", "Toasted Oak"],
    foodPairing: ["Glazed Pork Ribs", "Cured Charcuterie", "Pecan Pie", "Smoked Cheddar"],
    identity: {
      type: "Blended Scotch Whisky",
      style: "Hard-Fired Double Charred",
      production: "Charred White Oak Cask Finishing",
      origin: "Scotland",
      age: "NAS Reserve",
      bottleSize: "1000ml",
      abv: "40.0%",
      barcode: "5000299607145",
      barcodeImage: getBarcodeImageUrl("5000299607145"),
      cartonBarcode: "15000299607142"
    },
    barcode: "5000299607145",
    barcodeImage: getBarcodeImageUrl("5000299607145"),
    cartonBarcode: "15000299607142",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 2.1,
      length_cm: 12.0,
      width_cm: 12.0,
      height_cm: 35.0,
      is_fragile: true,
      parcel_value: 490,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    },
    featured: false,
    badges: ["RETAIL_SELECTION", "BEST_VALUE"],
    vendorId: null,
    approvalStatus: "approved"
  },
  {
    id: "ws-ballantines-finest",
    slug: "ballantines-finest-blended-scotch-whisky-750ml",
    name: "Ballantine's Finest Blended Scotch Whisky 750ml",
    brand: "Ballantine's",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    type: "Whisky",
    country: "Scotland",
    price: "340",
    size: "750ml",
    stock: 60,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792675131/grand-store/catalog-originals/whisky/ballantines/ballantines-finest-blended-scotch-whisky-750ml.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792675131/grand-store/catalog-originals/whisky/ballantines/ballantines-finest-blended-scotch-whisky-750ml.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1792675131/grand-store/catalog-originals/whisky/ballantines/ballantines-finest-blended-scotch-whisky-750ml.png"
    ],
    description: "The world-famous flagship blend created in 1910. Composed of over 40 distinct single malts and grain whiskies, delivering an unmistakably smooth, rounded, and subtle character celebrated across generations.",
    tastingNotes: [
      "Red Apple",
      "Milk Chocolate",
      "Heather Blossom",
      "Subtle Vanilla",
      "Soft Peat Echo"
    ],
    flavorProfile: ["Sweet & Balanced", "Mellow Floral", "Crisp Finish"],
    foodPairing: ["Sharp White Cheddar", "Grilled Sirloin", "Apple Tart Tatin"],
    identity: {
      type: "Blended Scotch Whisky",
      style: "Classic Blended Scotch",
      production: "Traditional Master Blend of 40+ Single Malts",
      origin: "Scotland",
      age: "Finest Signature",
      bottleSize: "750ml",
      abv: "43.0%",
      barcode: "5000299211014",
      barcodeImage: getBarcodeImageUrl("5000299211014"),
      cartonBarcode: "15000299211011"
    },
    barcode: "5000299211014",
    barcodeImage: getBarcodeImageUrl("5000299211014"),
    cartonBarcode: "15000299211011",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.75,
      length_cm: 11.0,
      width_cm: 11.0,
      height_cm: 32.0,
      is_fragile: true,
      parcel_value: 340,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    },
    featured: false,
    badges: ["HERITAGE_CLASSIC", "MOST_LOVED"],
    vendorId: null,
    approvalStatus: "approved"
  },

  // =========================================================================
  // 2. SAKE AND BAIJIU
  // =========================================================================
  {
    id: "ws-guizhou-xijiu-blue",
    slug: "guizhou-xijiu-friends-series-baijiu-blue-bottle-500ml",
    name: "Guizhou XIJIU Friends Series Baijiu (Blue Bottle) 500ml",
    brand: "Guizhou XIJIU",
    category: "Baijiu",
    subcategory: "Sauce-Aroma (Jiangxiang) Baijiu",
    type: "Baijiu",
    country: "China",
    price: "890",
    size: "500ml",
    stock: 30,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658967/grand-store/catalog-originals/baijiu/guizhou-xijiu-friends-series-blue-bottle.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658967/grand-store/catalog-originals/baijiu/guizhou-xijiu-friends-series-blue-bottle.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658967/grand-store/catalog-originals/baijiu/guizhou-xijiu-friends-series-blue-bottle.png"
    ],
    description: "Hailing from the Chishui River valley in Guizhou Province, this prestigious Chinese Baijiu is produced via authentic solid-state sorghum fermentation. Packaged in a stunning cobalt-blue ceramic flagon, it exudes the classic Jiangxiang (Sauce Aroma) character—savory roasted grains, soy umami, dried Chinese dates, and an astonishingly long, fragrant palate.",
    tastingNotes: [
      "Jiangxiang (Sauce Aroma)",
      "Toasted Sorghum Grain",
      "Dried Red Jujube Dates",
      "Roasted Sesame",
      "Rich Umami Finish"
    ],
    flavorProfile: ["Savory & Umami", "Complex Grain", "Persistent Finish"],
    foodPairing: ["Peking Roast Duck", "Sichuan Peppercorn Hotpot", "Dongpo Braised Pork", "Kung Pao Chicken"],
    identity: {
      type: "Chinese Baijiu",
      style: "Sauce Aroma (Jiangxiang)",
      production: "Traditional Solid-State Double Fermentation & Distillation",
      origin: "Chishui River Valley, Guizhou, China",
      age: "Cellar Aged Reserve",
      bottleSize: "500ml",
      abv: "53.0%",
      barcode: "6901382103567",
      barcodeImage: getBarcodeImageUrl("6901382103567"),
      cartonBarcode: "16901382103564"
    },
    barcode: "6901382103567",
    barcodeImage: getBarcodeImageUrl("6901382103567"),
    cartonBarcode: "16901382103564",
    shipping: {
      box_type: "Reinforced Ceramic Spirit Box",
      weight_kg: 1.6,
      length_cm: 11.0,
      width_cm: 11.0,
      height_cm: 28.0,
      is_fragile: true,
      parcel_value: 890,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    },
    featured: true,
    badges: ["GRAND_STORE_CHOICE", "ASIAN_SPIRIT_SELECTION", "AUTHENTIC_IMPORT"],
    vendorId: null,
    approvalStatus: "approved"
  },
  {
    id: "ws-fenjiu-blue-flower-20",
    slug: "fenjiu-qinghua-20-year-old-baijiu-500ml",
    name: "Fenjiu Qinghua 20 Year Old Baijiu 500ml",
    brand: "Fenjiu",
    category: "Baijiu",
    subcategory: "Light-Aroma (Qingxiang) Baijiu",
    type: "Baijiu",
    country: "China",
    price: "2450",
    size: "500ml",
    stock: 18,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658955/grand-store/catalog-originals/baijiu/fenjiu-qinghua-20-year-old.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658955/grand-store/catalog-originals/baijiu/fenjiu-qinghua-20-year-old.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658955/grand-store/catalog-originals/baijiu/fenjiu-qinghua-20-year-old.png"
    ],
    description: "The crown jewel of Light Aroma Baijiu from Xinghuacun, Shanxi Province with over 6,000 years of brewing lineage. Aged 20 years in earthen ceramic vessels, Fenjiu Qinghua presents a clean, crystal-clear purity, with delicate aromas of green pear, white blossom, and sweet barley sweetness.",
    tastingNotes: [
      "White Orchid Blossom",
      "Crisp Asian Pear",
      "Sweet Sorghum Dew",
      "Fresh Mint",
      "Silky Clean Mineral Finish"
    ],
    flavorProfile: ["Clean & Floral", "Crisp Fruit", "Pure Grain"],
    foodPairing: ["Dim Sum Platter", "Steamed Chilean Sea Bass", "Cantonese Roast Goose", "Jasmine Rice Cakes"],
    identity: {
      type: "Chinese Baijiu",
      style: "Light Aroma (Qingxiang)",
      production: "Buried Clay Jar Fermentation & 20 Years Cellar Maturation",
      origin: "Xinghuacun, Fenyang, Shanxi, China",
      age: "20 Years Old",
      bottleSize: "500ml",
      abv: "53.0%",
      barcode: "6903562080018",
      barcodeImage: getBarcodeImageUrl("6903562080018"),
      cartonBarcode: "16903562080015"
    },
    barcode: "6903562080018",
    barcodeImage: getBarcodeImageUrl("6903562080018"),
    cartonBarcode: "16903562080015",
    shipping: {
      box_type: "Porcelain Collector Box",
      weight_kg: 1.7,
      length_cm: 12.0,
      width_cm: 12.0,
      height_cm: 30.0,
      is_fragile: true,
      parcel_value: 2450,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    },
    featured: true,
    badges: ["RARE_COLLECTOR", "20_YEAR_RESERVE"],
    vendorId: null,
    approvalStatus: "approved"
  },
  {
    id: "ws-fenjiu-red-label",
    slug: "fen-jiu-red-label-fen-chiew-baijiu-500ml",
    name: "Fen Jiu Red Label (Fen Chiew) Baijiu 500ml",
    brand: "Fenjiu",
    category: "Baijiu",
    subcategory: "Light Aroma Baijiu (Qingxiang)",
    type: "Baijiu",
    country: "China",
    price: "650",
    size: "500ml",
    stock: 35,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658959/grand-store/catalog-originals/baijiu/fen-jiu-red-label-fen-chiew.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658959/grand-store/catalog-originals/baijiu/fen-jiu-red-label-fen-chiew.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658959/grand-store/catalog-originals/baijiu/fen-jiu-red-label-fen-chiew.png"
    ],
    description: "The iconic everyday staple of Northern China. Distilled from fermented whole sorghum grains with indigenous barley-and-pea qu starter. Vibrant, refreshing, and full-bodied with notes of ripe honeydew melon, star anise, and crisp grain.",
    tastingNotes: [
      "Honeydew Melon",
      "Star Aniseed",
      "Warm White Pepper",
      "Sweet Sorghum",
      "Clean Spring Water"
    ],
    flavorProfile: ["Crisp & Fragrant", "Sweet Spice", "Clean Finish"],
    foodPairing: ["Spicy Dumplings", "Crispy Spring Rolls", "Salt & Pepper Prawns"],
    identity: {
      type: "Chinese Baijiu",
      style: "Light Aroma (Qingxiang)",
      production: "Traditional Earthenware Pot Distillation",
      origin: "Shanxi Province, China",
      age: "Standard Heritage",
      bottleSize: "500ml",
      abv: "53.0%",
      barcode: "6903562010121",
      barcodeImage: getBarcodeImageUrl("6903562010121"),
      cartonBarcode: "16903562010128"
    },
    barcode: "6903562010121",
    barcodeImage: getBarcodeImageUrl("6903562010121"),
    cartonBarcode: "16903562010128",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.5,
      length_cm: 10.0,
      width_cm: 10.0,
      height_cm: 26.0,
      is_fragile: true,
      parcel_value: 650,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    },
    featured: false,
    badges: ["AUTHENTIC_IMPORT", "RETAIL_SELECTION"],
    vendorId: null,
    approvalStatus: "approved"
  },
  {
    id: "ws-gekkeikan-gold-sake",
    slug: "gekkeikan-traditional-junmai-shu-sake-720ml",
    name: "Gekkeikan Traditional Junmai-shu Sake 720ml",
    brand: "Gekkeikan",
    category: "Sake",
    subcategory: "Junmai Sake",
    type: "Sake",
    country: "Japan",
    price: "480",
    size: "720ml",
    stock: 45,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658970/grand-store/catalog-originals/sake/gekkeikan-traditional-junmai-sake-720ml.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658970/grand-store/catalog-originals/sake/gekkeikan-traditional-junmai-sake-720ml.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658970/grand-store/catalog-originals/sake/gekkeikan-traditional-junmai-sake-720ml.png"
    ],
    description: "Brewed in Fushimi, Kyoto—the historic capital of Japanese sake brewing with over 380 years of craftsmanship. Made using centuries-old yeast strains and pristine natural spring water. Herbaceous with gentle grapefruit acidity, subtle steamed rice notes, and a balanced dry finish. Delicious served chilled, room temperature, or gently warmed.",
    tastingNotes: [
      "Steamed Koji Rice",
      "Fresh Grapefruit Peel",
      "Green Melon",
      "Gentle Earthy Umami",
      "Clean Mineral Spring"
    ],
    flavorProfile: ["Smooth & Earthy", "Clean Umami", "Gentle Acidity"],
    foodPairing: ["Salmon & Tuna Sashimi", "Crispy Prawn Tempura", "Yakitori Skewers", "Miso Black Cod"],
    identity: {
      type: "Japanese Sake",
      style: "Junmai-shu (Pure Rice Sake)",
      production: "Natural Spring Water & Polished Rice Fermentation",
      origin: "Fushimi, Kyoto, Japan",
      age: "Brewed Fresh Release",
      bottleSize: "720ml",
      abv: "15.6%",
      barcode: "4901030113019",
      barcodeImage: getBarcodeImageUrl("4901030113019"),
      cartonBarcode: "14901030113016"
    },
    barcode: "4901030113019",
    barcodeImage: getBarcodeImageUrl("4901030113019"),
    cartonBarcode: "14901030113016",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.6,
      length_cm: 11.0,
      width_cm: 11.0,
      height_cm: 31.0,
      is_fragile: true,
      parcel_value: 480,
      hs_code: "2206.00",
      aramexServiceType: "ONP"
    },
    featured: false,
    badges: ["JAPANESE_IMPORT", "RETAIL_SELECTION"],
    vendorId: null,
    approvalStatus: "approved"
  },
  {
    id: "ws-dassai-45-sake",
    slug: "dassai-45-junmai-daiginjo-sake-720ml",
    name: "Dassai 45 Junmai Daiginjo Sake 720ml",
    brand: "Dassai",
    category: "Sake",
    subcategory: "Junmai Daiginjo Sake",
    type: "Sake",
    country: "Japan",
    price: "850",
    size: "720ml",
    stock: 25,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658974/grand-store/catalog-originals/sake/dassai-45-junmai-daiginjo-sake-720ml.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658974/grand-store/catalog-originals/sake/dassai-45-junmai-daiginjo-sake-720ml.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658974/grand-store/catalog-originals/sake/dassai-45-junmai-daiginjo-sake-720ml.png"
    ],
    description: "Crafted exclusively from King of Sake Rice (Yamada Nishiki), polished down meticulously until only 45% of the grain heart remains. Dassai 45 offers a delicate bouquet of white peach, honeydew melon, and muscat grapes, balanced by a silky, refined mouthfeel.",
    tastingNotes: [
      "Ripe Muscat Grape",
      "Honeydew Melon",
      "Fresh White Peach",
      "Cotton Candy",
      "Pristine Alpine Water"
    ],
    flavorProfile: ["Fruity & Floral", "Silky Texture", "Delicate Acidity"],
    foodPairing: ["Yellowtail Hamachi Crudo", "Hokkaido Scallops", "Fresh Oysters", "Light Soba"],
    identity: {
      type: "Japanese Sake",
      style: "Junmai Daiginjo (Ultra-Polished 45%)",
      production: "Yamada Nishiki Rice Polished to 45% Core",
      origin: "Iwakuni, Yamaguchi Prefecture, Japan",
      age: "Daiginjo Artisanal Batch",
      bottleSize: "720ml",
      abv: "16.0%",
      barcode: "4935819000458",
      barcodeImage: getBarcodeImageUrl("4935819000458"),
      cartonBarcode: "14935819000455"
    },
    barcode: "4935819000458",
    barcodeImage: getBarcodeImageUrl("4935819000458"),
    cartonBarcode: "14935819000455",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.6,
      length_cm: 11.0,
      width_cm: 11.0,
      height_cm: 32.0,
      is_fragile: true,
      parcel_value: 820,
      hs_code: "2206.00",
      aramexServiceType: "ONP"
    },
    featured: true,
    badges: ["GRAND_STORE_CHOICE", "DAIGINJO_SUPREME"],
    vendorId: null,
    approvalStatus: "approved"
  },

  // =========================================================================
  // 3. JACK (JACK DANIEL'S)
  // =========================================================================
  {
    id: "ws-jack-daniels-single-barrel-rye",
    slug: "jack-daniels-single-barrel-rye-green-label-700ml",
    name: "Jack Daniel's Single Barrel Rye Green Label 700ml",
    brand: "Jack Daniel's",
    category: "Whisky",
    subcategory: "Tennessee Rye Whiskey",
    type: "Whisky",
    country: "United States",
    price: "2890",
    size: "700ml",
    stock: 20,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792735201/grand-store/catalog-originals/whisky/jack-daniels/jack-daniels-single-barrel-rye-green-label-700ml.png",
    originalImage: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80"
    ],
    description: "A historic achievement from the Jack Daniel Distillery in Lynchburg, Tennessee. Distilled from a proprietary 70% rye grain bill, charcoal mellowed through sugar maple, and hand-selected from individual barrels elevated to the highest barrelhouse lofts where temperature fluctuations create immense depth and peppered rye spice.",
    tastingNotes: [
      "Bold Rye Pepper Spice",
      "Sweet Bourbon Vanilla",
      "Charred American Oak",
      "Caramelized Orange Zest",
      "Warm Baking Cinnamon"
    ],
    flavorProfile: ["Bold & Peppery", "Sweet Vanilla", "Rich Charred Oak"],
    foodPairing: ["Smoked Texas Beef Brisket", "Prime Dry-Aged Ribeye", "Dark Chocolate Tart", "Aged Smoked Gouda"],
    identity: {
      type: "Tennessee Whiskey",
      style: "Straight Rye Whiskey (Single Barrel)",
      production: "70% Rye Mash Bill, Sugar Maple Charcoal Mellowing",
      origin: "Lynchburg, Tennessee, USA",
      age: "Single Barrel Loft Reserve",
      bottleSize: "700ml",
      abv: "47.0%",
      barcode: "5099873003053",
      barcodeImage: getBarcodeImageUrl("5099873003053"),
      cartonBarcode: "15099873003050"
    },
    barcode: "5099873003053",
    barcodeImage: getBarcodeImageUrl("5099873003053"),
    cartonBarcode: "15099873003050",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.9,
      length_cm: 12.0,
      width_cm: 12.0,
      height_cm: 32.0,
      is_fragile: true,
      parcel_value: 2890,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    },
    featured: true,
    badges: ["GRAND_STORE_CHOICE", "SINGLE_BARREL_SELECT", "LIMITED_ALLOCATION"],
    vendorId: null,
    approvalStatus: "approved"
  },
  {
    id: "ws-jack-daniels-master-distiller-5",
    slug: "jack-daniels-master-distiller-no-5-tennessee-whiskey-750ml",
    name: "Jack Daniel's Master Distiller No. 5 Tennessee Whiskey 750ml",
    brand: "Jack Daniel's",
    category: "Whisky",
    subcategory: "Tennessee Whiskey",
    type: "Whisky",
    country: "United States",
    price: "1450",
    size: "750ml",
    stock: 22,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792735202/grand-store/catalog-originals/whisky/jack-daniels/jack-daniels-master-distiller-no-5-tennessee-whiskey-750ml.png",
    originalImage: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=800&q=80"
    ],
    description: "The fifth edition in Jack Daniel's legendary Master Distiller series, honouring Frank Bobo, who supervised the distillery from 1966 through the iconic boom of the 1970s. Matured to peak balance in handcrafted barrels for an exceptionally deep caramel sweetness and smooth charcoal signature.",
    tastingNotes: [
      "Rich Caramel & Butterscotch",
      "Ripe Banana Bread",
      "Toasted White Oak",
      "Dark Honey",
      "Nutty Brown Sugar"
    ],
    flavorProfile: ["Sweet Butterscotch", "Smooth Oak", "Charcoal Warmth"],
    foodPairing: ["Barbecue Pulled Pork", "Caramel Bread Pudding", "Grilled Venison Burgers"],
    identity: {
      type: "Tennessee Whiskey",
      style: "Master Distiller Limited Commemorative Edition",
      production: "Charcoal Mellowed drop-by-drop through 10ft of Sugar Maple",
      origin: "Lynchburg, Moore County, Tennessee, USA",
      age: "Master Distiller Series No. 5",
      bottleSize: "750ml",
      abv: "43.0%",
      barcode: "5099873001851",
      barcodeImage: getBarcodeImageUrl("5099873001851"),
      cartonBarcode: "15099873001858"
    },
    barcode: "5099873001851",
    barcodeImage: getBarcodeImageUrl("5099873001851"),
    cartonBarcode: "15099873001858",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.85,
      length_cm: 11.5,
      width_cm: 11.5,
      height_cm: 32.5,
      is_fragile: true,
      parcel_value: 1450,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    },
    featured: true,
    badges: ["COMMEMORATIVE_EDITION", "COLLECTOR_SERIES"],
    vendorId: null,
    approvalStatus: "approved"
  },
  {
    id: "ws-jack-daniels-gentleman-jack",
    slug: "gentleman-jack-rare-tennessee-whiskey-750ml",
    name: "Gentleman Jack Rare Tennessee Whiskey 750ml",
    brand: "Jack Daniel's",
    category: "Whisky",
    subcategory: "Tennessee Whiskey",
    type: "Whisky",
    country: "United States",
    price: "580",
    size: "750ml",
    stock: 50,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792735203/grand-store/catalog-originals/whisky/jack-daniels/gentleman-jack-rare-tennessee-whiskey-750ml.png",
    originalImage: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=80"
    ],
    description: "The world's only double-mellowed whiskey. Filtered through 10 feet of sugar maple charcoal once before aging in barrels, and once again after maturation. Exceptionally silky, with generous caramel, honey, vanilla, and gentle spice.",
    tastingNotes: [
      "Sweet Caramel",
      "Bourbon Vanilla",
      "Ripe Red Apple",
      "Honey Blossom",
      "Light Toasted Oak"
    ],
    flavorProfile: ["Exceptionally Smooth", "Sweet & Mellow", "Subtle Spice"],
    foodPairing: ["Honey-Glazed Ham", "Pecan Tart", "Roasted Walnuts", "Aged White Cheddar"],
    identity: {
      type: "Tennessee Whiskey",
      style: "Double Mellowed Rare Expression",
      production: "Double Charcoal Mellowed (Before & After Maturation)",
      origin: "Lynchburg, Tennessee, USA",
      age: "Signature Rare Batch",
      bottleSize: "750ml",
      abv: "40.0%",
      barcode: "5099873000519",
      barcodeImage: getBarcodeImageUrl("5099873000519"),
      cartonBarcode: "15099873000516"
    },
    barcode: "5099873000519",
    barcodeImage: getBarcodeImageUrl("5099873000519"),
    cartonBarcode: "15099873000516",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.8,
      length_cm: 11.0,
      width_cm: 11.0,
      height_cm: 32.0,
      is_fragile: true,
      parcel_value: 580,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    },
    featured: false,
    badges: ["RETAIL_SELECTION", "DOUBLE_MELLOWED"],
    vendorId: null,
    approvalStatus: "approved"
  },

  // =========================================================================
  // 4. DIMPLE
  // =========================================================================
  {
    id: "ws-dimple-15-blended-scotch",
    slug: "dimple-15-year-old-blended-scotch-whisky-750ml",
    name: "Dimple 15 Year Old Blended Scotch Whisky 750ml",
    brand: "Dimple",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    type: "Whisky",
    country: "Scotland",
    price: "950",
    size: "750ml",
    stock: 28,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792671660/grand-store/catalog-originals/whisky/dimple/dimple-15-year-old-blended-scotch-whisky-750ml.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792671660/grand-store/catalog-originals/whisky/dimple/dimple-15-year-old-blended-scotch-whisky-750ml.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1792671660/grand-store/catalog-originals/whisky/dimple/dimple-15-year-old-blended-scotch-whisky-750ml.png"
    ],
    description: "Crafted by the historic House of Haig—Scotland's oldest whisky dynasty dating back to 1627. Bottled in its world-famous three-sided dimpled decanter wrapped in gold wire. Aged a minimum of 15 years with a high content of Glenkinchie malt for mellow honey, toffee, and gentle highland peat warmth.",
    tastingNotes: [
      "Warm Butter Toffee",
      "Heather Honey Malt",
      "Gentle Peat Smoke",
      "Dried Apricot & Mango",
      "Aged Oak Spice"
    ],
    flavorProfile: ["Mellow & Complex", "Honey & Peat", "Spicy Toffee Finish"],
    foodPairing: ["Stilton Blue Cheese", "Roast Scottish Lamb", "Traditional Shortbread", "Dark Chocolate"],
    identity: {
      type: "Blended Scotch Whisky",
      style: "15 Year Old De Luxe Blended Scotch",
      production: "Aged 15 Years in Selected Oak Casks",
      origin: "Markinch, Fife, Scotland",
      age: "15 Years Old",
      bottleSize: "750ml",
      abv: "43.0%",
      barcode: "5000281005232",
      barcodeImage: getBarcodeImageUrl("5000281005232"),
      cartonBarcode: "15000281005239"
    },
    barcode: "5000281005232",
    barcodeImage: getBarcodeImageUrl("5000281005232"),
    cartonBarcode: "15000281005239",
    shipping: {
      box_type: "Three-Sided Pinched Decanter Box",
      weight_kg: 1.9,
      length_cm: 13.0,
      width_cm: 13.0,
      height_cm: 30.0,
      is_fragile: true,
      parcel_value: 950,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    },
    featured: true,
    badges: ["GRAND_STORE_CHOICE", "HISTORIC_DYNASTY", "15_YEAR_RESERVE"],
    vendorId: null,
    approvalStatus: "approved"
  },
  {
    id: "ws-dimple-haig-15-tin",
    slug: "dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml",
    name: "Dimple Haig 15 Year Old Presentation Tin De Luxe Scotch Whisky 750ml",
    brand: "Dimple",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    type: "Whisky",
    country: "Scotland",
    price: "1590",
    size: "750ml",
    stock: 15,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792671669/grand-store/catalog-originals/whisky/dimple/dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792671669/grand-store/catalog-originals/whisky/dimple/dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1792671669/grand-store/catalog-originals/whisky/dimple/dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml.png"
    ],
    description: "The rare collector's edition Dimple Haig 15 Year Old encased in an embossed presentation tin. Iconic gold-netted pinched flagon celebrating Master Blender John Haig's centuries-old legacy.",
    tastingNotes: [
      "Deep Spanish Oak",
      "Wildflower Honey",
      "Salted Caramel",
      "Candied Orange Peel",
      "Lingering Peat Ember"
    ],
    flavorProfile: ["Rich & Velvety", "Deep Oak", "Lingering Honeyed Smoke"],
    foodPairing: ["Dark Chocolate Fondant", "Slow-Braised Venison", "Smoked Gouda Cheese"],
    identity: {
      type: "Blended Scotch Whisky",
      style: "Collector Presentation Tin Edition",
      production: "Triple Distilled Grain & Single Malts Aged 15 Years",
      origin: "Scotland",
      age: "15 Years Old",
      bottleSize: "750ml",
      abv: "43.0%",
      barcode: "5000281005249",
      barcodeImage: getBarcodeImageUrl("5000281005249"),
      cartonBarcode: "15000281005246"
    },
    barcode: "5000281005249",
    barcodeImage: getBarcodeImageUrl("5000281005249"),
    cartonBarcode: "15000281005246",
    shipping: {
      box_type: "Embossed Metal Tin Outer Box",
      weight_kg: 2.2,
      length_cm: 14.0,
      width_cm: 14.0,
      height_cm: 32.0,
      is_fragile: true,
      parcel_value: 1590,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    },
    featured: true,
    badges: ["COLLECTOR_TIN_EDITION", "RARE_ALLOCATION"],
    vendorId: null,
    approvalStatus: "approved"
  },
  {
    id: "ws-dimple-golden-selection",
    slug: "dimple-golden-selection-blended-scotch-whisky-700ml",
    name: "Dimple Golden Selection Blended Scotch Whisky 700ml",
    brand: "Dimple",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    type: "Whisky",
    country: "Scotland",
    price: "820",
    size: "700ml",
    stock: 32,
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792671666/grand-store/catalog-originals/whisky/dimple/dimple-golden-selection-blended-scotch-whisky-700ml.png",
    originalImage: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792671666/grand-store/catalog-originals/whisky/dimple/dimple-golden-selection-blended-scotch-whisky-700ml.png",
    gallery: [
      "https://res.cloudinary.com/oioqrgj0/image/upload/v1792671666/grand-store/catalog-originals/whisky/dimple/dimple-golden-selection-blended-scotch-whisky-700ml.png"
    ],
    description: "An expressive modern creation from the Master of Malt at Dimple. Selected whiskies at the peak of their maturation are blended for vibrant aromas of ripe mango, toasted hazelnut, and rich mocha chocolate.",
    tastingNotes: [
      "Ripe Tropical Mango",
      "Roasted Hazelnuts",
      "Mocha Espresso",
      "Wildflower Honey",
      "Soft Oak Spice"
    ],
    flavorProfile: ["Fruit-Forward", "Nutty & Sweet", "Clean Mellow Finish"],
    foodPairing: ["Hazelnut Praline Tart", "Duck Breast with Cherry Glaze", "Mild Hard Cheeses"],
    identity: {
      type: "Blended Scotch Whisky",
      style: "Master Selection Blended Scotch",
      production: "Peak Maturation Handcrafted Blend",
      origin: "Scotland",
      age: "Golden Selection",
      bottleSize: "700ml",
      abv: "40.0%",
      barcode: "5000281036014",
      barcodeImage: getBarcodeImageUrl("5000281036014"),
      cartonBarcode: "15000281036011"
    },
    barcode: "5000281036014",
    barcodeImage: getBarcodeImageUrl("5000281036014"),
    cartonBarcode: "15000281036011",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.8,
      length_cm: 12.0,
      width_cm: 12.0,
      height_cm: 30.0,
      is_fragile: true,
      parcel_value: 820,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    },
    featured: false,
    badges: ["RETAIL_SELECTION", "GOLDEN_EDITION"],
    vendorId: null,
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

    for (const prod of retailProducts) {
      const existing = await Product.findOne({ id: prod.id });
      if (existing) {
        await Product.findOneAndUpdate({ id: prod.id }, { $set: prod });
        console.log(`[UPDATED] ${prod.name} (${prod.id})`);
        updated++;
      } else {
        await Product.create(prod);
        console.log(`[INSERTED] ${prod.name} (${prod.id})`);
        inserted++;
      }
    }

    console.log(`\n========================================`);
    console.log(`Seeding Finished Successfully!`);
    console.log(`Total Products Seeded: ${retailProducts.length}`);
    console.log(`  - Newly Inserted: ${inserted}`);
    console.log(`  - Updated Existing: ${updated}`);
    console.log(`All products seeded as ADMIN retail products (vendorId: null).`);
    console.log(`========================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
}

seed();
