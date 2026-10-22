const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../models/Product');

const whiskyshopProducts = [
  // ==========================================
  // BALLANTINE'S
  // ==========================================
  {
    name: "Ballantine's 21 Year Old Blended Scotch Whisky 750ml",
    brand: "Ballantine's",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    country: "Scotland",
    size: "750ml",
    price: "3990",
    stock: 12,
    description: "Ballantine's 21 Year Old is a supreme, prestigious blend crafted by Master Blender Sandy Hyslop. Aged for a minimum of 21 years in exceptional oak casks with a high proportion of European oak maturation, this expression offers exquisite poise, opulent texture, and deep aromatic complexity. A hallmark of Scottish blending mastery since George Ballantine's pioneering days.",
    tastingNotes: [
      "Nose: Rich, honeyed nectar, ripe orchard apples, floral heather, and subtle oak smoke.",
      "Palate: Velvety smooth with decadent layers of sweet heather honey, soft liquorice, aromatic spices, and Seville orange marmalade.",
      "Finish: Exceptionally long, warming, lingering dried fruit, sweet vanilla, and refined oak tannins."
    ],
    flavorProfile: ["Honeyed", "Orchard Fruits", "Liquorice", "Subtle Oak Spice", "Vanilla Cream"],
    foodPairing: ["Aged Gouda", "Dark Chocolate Truffles", "Seared Venison", "Roasted Almonds"],
    identity: {
      type: "Whisky",
      style: "Blended Scotch Whisky",
      production: "Traditional Copper Pot & Column Distillation, Cask Blended",
      origin: "Dumbarton & Speyside, Scotland",
      age: "21 Years",
      bottleSize: "750ml",
      abv: "40%",
      barcode: "5000299223017",
      cartonBarcode: "15000299223014",
      barcodeImage: "https://barcodeapi.org/api/128/5000299223017"
    },
    barcode: "5000299223017",
    cartonBarcode: "15000299223014",
    barcodeImage: "https://barcodeapi.org/api/128/5000299223017",
    image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.85,
      length_cm: 12,
      width_cm: 12,
      height_cm: 34,
      is_fragile: true,
      parcel_value: 3990,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Ballantine's Hard Fired Blended Scotch Whisky 1L",
    brand: "Ballantine's",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    country: "Scotland",
    size: "1.0L",
    price: "490",
    stock: 28,
    description: "Ballantine's Hard Fired introduces an innovative double-charred finishing technique. Specially seasoned American oak casks undergo a bespoke hard firing process by skilled coopers, caramelizing the wood sugars to unlock explosive notes of sweet smoke, creamy vanilla, and toasted toffee.",
    tastingNotes: [
      "Nose: Sweet ripe pears, honey, toasted coconut, and gentle wafts of charred wood smoke.",
      "Palate: Creamy toffee, red crisp apples, warm vanilla custard, and smoky barbecue oak notes.",
      "Finish: Lingering, smooth, with a delicate veil of sweet wood smoke and campfire vanilla."
    ],
    flavorProfile: ["Charred Oak", "Vanilla Toffee", "Sweet Smoke", "Caramelized Pear"],
    foodPairing: ["Smoked Barbecue Brisket", "Caramelized Pecans", "Cheddar Cheese"],
    identity: {
      type: "Whisky",
      style: "Blended Scotch Whisky",
      production: "Double-Charred Hard-Fired American Oak Casks",
      origin: "Scotland",
      age: "NAS",
      bottleSize: "1.0L",
      abv: "40%",
      barcode: "5000299607145",
      cartonBarcode: "15000299607142",
      barcodeImage: "https://barcodeapi.org/api/128/5000299607145"
    },
    barcode: "5000299607145",
    cartonBarcode: "15000299607142",
    barcodeImage: "https://barcodeapi.org/api/128/5000299607145",
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 2.25,
      length_cm: 13,
      width_cm: 13,
      height_cm: 36,
      is_fragile: true,
      parcel_value: 490,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Ballantine's Finest Blended Scotch Whisky 750ml",
    brand: "Ballantine's",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    country: "Scotland",
    size: "750ml",
    price: "340",
    stock: 50,
    description: "Ballantine's Finest is the world's iconic blended Scotch whisky, staying true to its original recipe created in 1910. Composed of over 40 carefully selected malt and grain whiskies from four renowned Scottish whisky regions, it delivers an unmistakably golden, rounded, and smooth character.",
    tastingNotes: [
      "Nose: Soft, elegant, heather honey aromas with a hint of spice and fresh crisp red apple.",
      "Palate: Well-balanced subtle flavors with tones of milk chocolate, red apple, and delicate vanilla.",
      "Finish: Fresh, floral, glowing aftertaste with rounded warmth."
    ],
    flavorProfile: ["Heather Honey", "Red Apple", "Milk Chocolate", "Subtle Vanilla"],
    foodPairing: ["Charcuterie Platter", "Smoked Salmon Crostini", "Mild Blue Cheese"],
    identity: {
      type: "Whisky",
      style: "Blended Scotch Whisky",
      production: "Master Blend of 40+ Single Malts and Grain Whiskies",
      origin: "Scotland",
      age: "NAS",
      bottleSize: "750ml",
      abv: "43%",
      barcode: "5000299211014",
      cartonBarcode: "15000299211011",
      barcodeImage: "https://barcodeapi.org/api/128/5000299211014"
    },
    barcode: "5000299211014",
    cartonBarcode: "15000299211011",
    barcodeImage: "https://barcodeapi.org/api/128/5000299211014",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.85,
      length_cm: 12,
      width_cm: 12,
      height_cm: 34,
      is_fragile: true,
      parcel_value: 340,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Ballantine's Finest Blended Scotch Whisky 3L with Cradle",
    brand: "Ballantine's",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky Collector Edition",
    country: "Scotland",
    size: "3.0L",
    price: "1390",
    stock: 8,
    description: "The monumental 3-Litre Jeroboam presentation of Ballantine's Finest, complete with an ornamental swinging pouring cradle. An extraordinary centerpiece for celebration bars and collector displays, showcasing the timeless 1910 blend in grand proportions.",
    tastingNotes: [
      "Nose: Expressive heather honey, rich malt, red apples, and gentle cinnamon warmth.",
      "Palate: Full and expansive on the tongue, milk chocolate, vanilla pods, and sweet grains.",
      "Finish: Long, comforting warmth with pleasant floral freshness."
    ],
    flavorProfile: ["Heather Honey", "Malt", "Vanilla", "Milk Chocolate", "Floral"],
    foodPairing: ["Celebration Roasts", "Artisan Cheese Boards", "Petits Fours"],
    identity: {
      type: "Whisky",
      style: "Blended Scotch Whisky",
      production: "Large Format Jeroboam Bottling with Pouring Cradle",
      origin: "Scotland",
      age: "NAS",
      bottleSize: "3.0L",
      abv: "43%",
      barcode: "5000299211304",
      cartonBarcode: "15000299211301",
      barcodeImage: "https://barcodeapi.org/api/128/5000299211304"
    },
    barcode: "5000299211304",
    cartonBarcode: "15000299211301",
    barcodeImage: "https://barcodeapi.org/api/128/5000299211304",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792583112/grandstore-uploads/products/whisky/ballantines-finest-blended-scotch-whisky-3l-with-cradle.jpg",
    shipping: {
      box_type: "Extra Large Wooden Crate",
      weight_kg: 5.8,
      length_cm: 20,
      width_cm: 20,
      height_cm: 48,
      is_fragile: true,
      parcel_value: 1390,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Ballantine's Original Extra-Large 4.5L Gallon Cradle",
    brand: "Ballantine's",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky Collector Edition",
    country: "Scotland",
    size: "4.5L",
    price: "2850",
    stock: 4,
    description: "The ultimate collector's showpiece: a mammoth 4.5L Gallon bottle of Ballantine's mounted on an ornate custom pouring stand. A rare acquisition for connoisseurs and connoisseur display cases.",
    tastingNotes: [
      "Nose: Abundant honey, ripe pears, soft spice, and toasted cereal grains.",
      "Palate: Luxurious and velvety, chocolate-dipped apples, vanilla cream, and delicate malt.",
      "Finish: Long, opulent, lingering floral honey and soft wood spice."
    ],
    flavorProfile: ["Floral Honey", "Crisp Apple", "Milk Chocolate", "Toasted Grains"],
    foodPairing: ["Feast Banquet Roasts", "Aged Cheddar", "Caramel Desserts"],
    identity: {
      type: "Whisky",
      style: "Collector Gallon Blended Scotch",
      production: "Imperial Gallon Bottling with Metal Gimbal Cradle",
      origin: "Scotland",
      age: "NAS",
      bottleSize: "4.5L",
      abv: "43%",
      barcode: "5000299211458",
      cartonBarcode: "15000299211455",
      barcodeImage: "https://barcodeapi.org/api/128/5000299211458"
    },
    barcode: "5000299211458",
    cartonBarcode: "15000299211455",
    barcodeImage: "https://barcodeapi.org/api/128/5000299211458",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792583112/grandstore-uploads/products/whisky/ballantines-finest-blended-scotch-whisky-3l-with-cradle.jpg",
    shipping: {
      box_type: "Heavyweight Reinforced Crate",
      weight_kg: 8.5,
      length_cm: 24,
      width_cm: 24,
      height_cm: 54,
      is_fragile: true,
      parcel_value: 2850,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Ballantine's 17 Year Old Blended Scotch Whisky 750ml",
    brand: "Ballantine's",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    country: "Scotland",
    size: "750ml",
    price: "2150",
    stock: 14,
    description: "Consistently rated as one of the world's most lauded blended Scotch whiskies, Ballantine's 17 Year Old embodies all the rich, smooth elegance of Scottish blending tradition. Matured in hand-selected oak casks for over 17 years, it balances smoky complexity with sweet vanilla oak.",
    tastingNotes: [
      "Nose: Deep, balanced, elegant and silky with hints of oak and vanilla smoke.",
      "Palate: Full and complex with vibrant honey sweetness, creamy vanilla, and hints of licorice.",
      "Finish: Long, luxurious, sweet with light smoky echoes."
    ],
    flavorProfile: ["Honey", "Creamy Vanilla", "Licorice", "Sweet Peat Smoke"],
    foodPairing: ["Smoked Duck Breast", "Braised Beef Short Ribs", "Stilton Cheese"],
    identity: {
      type: "Whisky",
      style: "17 Year Old Blended Scotch",
      production: "Extended 17-Year Oak Cask Maturation",
      origin: "Scotland",
      age: "17 Years",
      bottleSize: "750ml",
      abv: "40%",
      barcode: "5000299217016",
      cartonBarcode: "15000299217013",
      barcodeImage: "https://barcodeapi.org/api/128/5000299217016"
    },
    barcode: "5000299217016",
    cartonBarcode: "15000299217013",
    barcodeImage: "https://barcodeapi.org/api/128/5000299217016",
    image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.85,
      length_cm: 12,
      width_cm: 12,
      height_cm: 34,
      is_fragile: true,
      parcel_value: 2150,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Ballantine's 30 Year Old Very Rare Blended Scotch Whisky 750ml",
    brand: "Ballantine's",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Prestige Rare Blended Scotch",
    country: "Scotland",
    size: "750ml",
    price: "9800",
    stock: 5,
    description: "Ballantine's 30 Year Old is among the rarest and most magnificent whiskies in the world. Comprising irreplaceable single malts from distilleries that no longer exist, each drops has slumbered in oak casks for three decades to achieve unparalleled depth, rich fruitiness, and sublime velvety grace.",
    tastingNotes: [
      "Nose: Deep, opulent, succulent fruits with sweet oak vanilla, pear tart, and nutmeg.",
      "Palate: Rich, velvety, layered with peach compote, honey, toffee fudge, and antique cedar wood.",
      "Finish: Incredibly sustained, gentle, elegant, and timelessly complex."
    ],
    flavorProfile: ["Antique Oak", "Toffee Fudge", "Peach Compote", "Nutmeg", "Honeyed Vanilla"],
    foodPairing: ["Caviar", "Prime Wagyu Tenderloin", "Single-Origin 85% Dark Chocolate"],
    identity: {
      type: "Whisky",
      style: "30 Year Old Prestige Blended Scotch",
      production: "Three Decades of Maturation, Rare Ghost Distillery Malts",
      origin: "Scotland",
      age: "30 Years",
      bottleSize: "750ml",
      abv: "40%",
      barcode: "5000299230015",
      cartonBarcode: "15000299230012",
      barcodeImage: "https://barcodeapi.org/api/128/5000299230015"
    },
    barcode: "5000299230015",
    cartonBarcode: "15000299230012",
    barcodeImage: "https://barcodeapi.org/api/128/5000299230015",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792585870/grandstore-uploads/products/whisky/ballantines-30-year-old-very-rare-blended-scotch-whisky-750ml.jpg",
    shipping: {
      box_type: "Handcrafted Luxury Timber Presentation Case",
      weight_kg: 2.8,
      length_cm: 16,
      width_cm: 16,
      height_cm: 38,
      is_fragile: true,
      parcel_value: 9800,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },

  // ==========================================
  // SAKE & BAIJIU
  // ==========================================
  {
    name: "Guizhou XIJIU Friends Series Baijiu (Blue Bottle) 500ml",
    brand: "Guizhou XIJIU",
    type: "Baijiu",
    category: "Baijiu",
    subcategory: "Sauce-Aroma (Jiangxiang) Baijiu",
    country: "China",
    size: "500ml",
    price: "890",
    stock: 20,
    description: "Guizhou Xijiu Friends Series Blue Bottle is crafted in the heart of the Chishui River Valley using time-honored solid-state fermentation techniques. Renowned for its rich Jiang-aroma, elegant sauce notes, velvety mouthfeel, and clean finish, it represents the finest Chinese distilling tradition.",
    tastingNotes: [
      "Nose: Pronounced soy sauce aroma, fermented sorghum grains, dried plums, and herbal complexity.",
      "Palate: Rich umami, layered sweetness, full spirit warmth, and dried wild fruit.",
      "Finish: Remarkably long, savory, and warming with an enduring grain fragrance."
    ],
    flavorProfile: ["Umami Jiang Sauce", "Fermented Grain", "Dried Prune", "Herbal", "Sweet Sorghum"],
    foodPairing: ["Sichuan Hotpot", "Dongpo Braised Pork Belly", "Peking Duck", "Spicy Mapo Tofu"],
    identity: {
      type: "Baijiu",
      style: "Sauce-Aroma (Jiangxiang) Baijiu",
      production: "Solid-State Grain Fermentation in Stone Pits, Chishui River Valley",
      origin: "Guizhou Province, China",
      age: "Multi-Vintage Aged Blend",
      bottleSize: "500ml",
      abv: "53%",
      barcode: "6901382103567",
      cartonBarcode: "16901382103564",
      barcodeImage: "https://barcodeapi.org/api/128/6901382103567"
    },
    barcode: "6901382103567",
    cartonBarcode: "16901382103564",
    barcodeImage: "https://barcodeapi.org/api/128/6901382103567",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792565188/grandstore-uploads/products/baijiu/guizhou-xijiu-friends-series-blue-bottle.jpg",
    shipping: {
      box_type: "Traditional Ceramic Bottle Gift Box",
      weight_kg: 1.65,
      length_cm: 11,
      width_cm: 11,
      height_cm: 30,
      is_fragile: true,
      parcel_value: 890,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Fenjiu Qinghua 20 Year Old Baijiu 500ml",
    brand: "Fenjiu",
    type: "Baijiu",
    category: "Baijiu",
    subcategory: "Light-Aroma (Qingxiang) Baijiu",
    country: "China",
    size: "500ml",
    price: "2450",
    stock: 15,
    description: "Fenjiu Qinghua 20 Year Old is the pinnacle of Chinese Light-Aroma Baijiu, produced in Xinghuacun, Shanxi Province with over 6,000 years of brewing pedigree. Fermented in buried terracotta jars and presented in an exquisite blue-and-white porcelain bottle, it delivers ethereal purity and delicate floral grace.",
    tastingNotes: [
      "Nose: Pristine floral aromas, honeysuckle, fresh orchard pears, and sweet rice sweetness.",
      "Palate: Incomparably smooth, crisp, refreshing sweet sorghum with silk-like softness.",
      "Finish: Impeccably clean, sweet, lingering with no burning aftertaste."
    ],
    flavorProfile: ["Honeysuckle", "Crisp Pear", "Sweet Sorghum", "Jasmine Blossom", "Spring Water"],
    foodPairing: ["Steamed Whole Turbot", "Cantonese Dim Sum", "Shanghainese Drunken Chicken"],
    identity: {
      type: "Baijiu",
      style: "Light-Aroma (Qingxiang) Baijiu",
      production: "Buried Terracotta Jar Fermentation, Xinghuacun Well Spring",
      origin: "Shanxi Province, China",
      age: "20 Years",
      bottleSize: "500ml",
      abv: "53%",
      barcode: "6901168102341",
      cartonBarcode: "16901168102348",
      barcodeImage: "https://barcodeapi.org/api/128/6901168102341"
    },
    barcode: "6901168102341",
    cartonBarcode: "16901168102348",
    barcodeImage: "https://barcodeapi.org/api/128/6901168102341",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792565190/grandstore-uploads/products/baijiu/fenjiu-qinghua-20-year-old.jpg",
    shipping: {
      box_type: "Porcelain Decanter Luxury Gift Box",
      weight_kg: 1.75,
      length_cm: 12,
      width_cm: 12,
      height_cm: 32,
      is_fragile: true,
      parcel_value: 2450,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Fen Jiu Red Label (Fen Chiew) Baijiu 500ml",
    brand: "Fenjiu",
    type: "Baijiu",
    category: "Baijiu",
    subcategory: "Light-Aroma Baijiu",
    country: "China",
    size: "500ml",
    price: "650",
    stock: 35,
    description: "The classic Fen Chiew Red Label is beloved throughout Asia for its crisp, authentic light-aroma profile. Made from indigenous Shanxi sorghum and barley-pea Daqu starter, it is vibrant, crystal-clear, and wonderfully refreshing.",
    tastingNotes: [
      "Nose: Sweet green apples, steamed polished grains, and subtle blossom perfume.",
      "Palate: Clean, light, sweet grain freshness with silky warmth.",
      "Finish: Refreshing, crisp, and pleasantly sweet."
    ],
    flavorProfile: ["Green Apple", "Steamed Grain", "Subtle Pea Daqu", "Clean Sweetness"],
    foodPairing: ["Northern Chinese Dumplings", "Crispy Roast Duck", "Salt & Pepper Calamari"],
    identity: {
      type: "Baijiu",
      style: "Light-Aroma Baijiu",
      production: "Traditional Solid-State Jar Fermentation",
      origin: "Shanxi Province, China",
      age: "NAS",
      bottleSize: "500ml",
      abv: "53%",
      barcode: "6901168101016",
      cartonBarcode: "16901168101013",
      barcodeImage: "https://barcodeapi.org/api/128/6901168101016"
    },
    barcode: "6901168101016",
    cartonBarcode: "16901168101013",
    barcodeImage: "https://barcodeapi.org/api/128/6901168101016",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792565191/grandstore-uploads/products/baijiu/fen-jiu-red-label-fen-chiew.jpg",
    shipping: {
      box_type: "Standard Bottle Box",
      weight_kg: 1.45,
      length_cm: 10,
      width_cm: 10,
      height_cm: 28,
      is_fragile: true,
      parcel_value: 650,
      hs_code: "2208.90",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Gold Gekkeikan Junmai-shu Sake with Gold Leaf 720ml",
    brand: "Gekkeikan",
    type: "Sake",
    category: "Sake",
    subcategory: "Junmai Sake",
    country: "Japan",
    size: "720ml",
    price: "750",
    stock: 25,
    description: "Gold Gekkeikan is an auspicious celebratory Junmai Sake brewed in Fushimi, Kyoto, famous for its pure, soft subterranean spring water (Miyamizu). Imbued with shimmering flakes of edible pure 24-karat gold leaf, it delivers a harmonious, rounded umami profile that honors Japanese hospitality and tradition.",
    tastingNotes: [
      "Nose: Subtle green apple, crisp melon, steamed rice, and gentle floral minerality.",
      "Palate: Medium-bodied, balanced acidity, rich rice umami with velvety texture and glittering gold leaf flakes.",
      "Finish: Crisp, refreshing, and pristine celebratory finish."
    ],
    flavorProfile: ["Melon", "Steamed Rice", "Soft Mineral Water", "Delicate Umami"],
    foodPairing: ["Celebration Sashimi Platter", "Tempura Prawns", "Grilled Black Cod Miso", "Wagyu Beef Tataki"],
    identity: {
      type: "Sake",
      style: "Junmai Sake with Edible Gold Leaf",
      production: "Kyoto Fushimi Spring Water, Pure Rice Brewing",
      origin: "Kyoto, Japan",
      age: "Freshly Bottled Season",
      bottleSize: "720ml",
      abv: "15.6%",
      barcode: "4901030112023",
      cartonBarcode: "14901030112020",
      barcodeImage: "https://barcodeapi.org/api/128/4901030112023"
    },
    barcode: "4901030112023",
    cartonBarcode: "14901030112020",
    barcodeImage: "https://barcodeapi.org/api/128/4901030112023",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792570281/grandstore-uploads/products/sake/gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.jpg",
    shipping: {
      box_type: "Japanese Ceremonial Sake Box",
      weight_kg: 1.6,
      length_cm: 11,
      width_cm: 11,
      height_cm: 32,
      is_fragile: true,
      parcel_value: 750,
      hs_code: "2206.00",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Dassai 45 Junmai Daiginjo Sake 720ml",
    brand: "Dassai",
    type: "Sake",
    category: "Sake",
    subcategory: "Junmai Daiginjo Sake",
    country: "Japan",
    size: "720ml",
    price: "850",
    stock: 18,
    description: "Dassai 45 is crafted by Asahi Shuzo in Yamaguchi Prefecture using the king of sake rice, Yamada Nishiki, polished down meticulously until only 45% of the grain heart remains. This yields an exquisite, world-acclaimed sake boasting delicate aromas of white peach, honeydew melon, and a silky, refined finish.",
    tastingNotes: [
      "Nose: Ethereal white peach, honeydew melon, muscat grape, and fresh mountain wildflowers.",
      "Palate: Luscious, silky elegance, gentle fruity sweetness, and balanced vibrant acidity.",
      "Finish: Incredibly clean, crisp, and sophisticated."
    ],
    flavorProfile: ["White Peach", "Honeydew Melon", "Wildflowers", "Silky Sweetness"],
    foodPairing: ["Yellowtail Hamachi Crudo", "Hokkaido Scallops", "Fresh Oysters", "Light Soba"],
    identity: {
      type: "Sake",
      style: "Junmai Daiginjo",
      production: "Yamada Nishiki Rice polished to 45%, Centrifuge Pressing",
      origin: "Yamaguchi Prefecture, Japan",
      age: "Current Brewery Vintage",
      bottleSize: "720ml",
      abv: "16%",
      barcode: "4935819140450",
      cartonBarcode: "14935819140457",
      barcodeImage: "https://barcodeapi.org/api/128/4935819140450"
    },
    barcode: "4935819140450",
    cartonBarcode: "14935819140457",
    barcodeImage: "https://barcodeapi.org/api/128/4935819140450",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792570282/grandstore-uploads/products/sake/dassai-45-junmai-daiginjo-sake-720ml.jpg",
    shipping: {
      box_type: "Standard Sake Presentation Box",
      weight_kg: 1.6,
      length_cm: 11,
      width_cm: 11,
      height_cm: 32,
      is_fragile: true,
      parcel_value: 850,
      hs_code: "2206.00",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Super Kinokuni Junmai Sake 720ml",
    brand: "Kinokuni",
    type: "Sake",
    category: "Sake",
    subcategory: "Junmai Sake",
    country: "Japan",
    size: "720ml",
    price: "435",
    stock: 16,
    description: "Super Kinokuni Junmai Sake is brewed using traditional Wakayama regional techniques. Crafted with local Gohyakumangoku sake rice and clear mountain stream water, it produces a hearty, food-friendly Junmai with well-defined umami and crisp refreshing acidity.",
    tastingNotes: [
      "Nose: Steamed rice, green melon, and gentle cedar wood notes.",
      "Palate: Savory, medium-dry, pleasant rice grain sweetness and bright acidity.",
      "Finish: Crisp, dry, and exceptionally appetizing."
    ],
    flavorProfile: ["Crisp Rice", "Green Melon", "Cedar Wood", "Savory Umami"],
    foodPairing: ["Grilled Unagi Eel", "Tonkatsu", "Gyoza", "Ramen"],
    identity: {
      type: "Sake",
      style: "Junmai Sake",
      production: "Wakayama Mountain Spring Water, Gohyakumangoku Rice",
      origin: "Wakayama, Japan",
      age: "Seasonal Bottling",
      bottleSize: "720ml",
      abv: "15%",
      barcode: "4904339120721",
      cartonBarcode: "14904339120728",
      barcodeImage: "https://barcodeapi.org/api/128/4904339120721"
    },
    barcode: "4904339120721",
    cartonBarcode: "14904339120728",
    barcodeImage: "https://barcodeapi.org/api/128/4904339120721",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792570282/grandstore-uploads/products/sake/super-kinokuni-junmai-sake-720ml.jpg",
    shipping: {
      box_type: "Standard Sake Box",
      weight_kg: 1.55,
      length_cm: 11,
      width_cm: 11,
      height_cm: 32,
      is_fragile: true,
      parcel_value: 435,
      hs_code: "2206.00",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Dassai 23 Junmai Daiginjo Super Premium Sake 720ml",
    brand: "Dassai",
    type: "Sake",
    category: "Sake",
    subcategory: "Ultra-Premium Junmai Daiginjo",
    country: "Japan",
    size: "720ml",
    price: "2890",
    stock: 6,
    description: "Dassai 23 represents the absolute summit of modern rice polishing technology. Each grain of Yamada Nishiki rice is gently polished down over 168 continuous hours to a breathtaking 23% kernel remnant. Presented in an authentic paulownia wooden presentation box with gold mizuhiki cord, it offers velvet floral aromas and a hauntingly pure finish.",
    tastingNotes: [
      "Nose: Fragrant bouquet of wild strawberries, blooming lilies, and ripe Bartlett pear.",
      "Palate: Astonishingly velvety and seamless, sweet rain water, melon drops, and refined minerality.",
      "Finish: Long, crystalline, and gossamer-smooth."
    ],
    flavorProfile: ["Wild Strawberry", "Lily Flower", "Bartlett Pear", "Crystalline Purity"],
    foodPairing: ["Otoro Tuna Sashimi", "Uni Sea Urchin", "Fresh Belon Oysters with Ponzu", "Kobe Beef"],
    identity: {
      type: "Sake",
      style: "Ultra-Premium Junmai Daiginjo",
      production: "Yamada Nishiki Rice polished to 23%, 168-hour Milling",
      origin: "Yamaguchi Prefecture, Japan",
      age: "Current Release",
      bottleSize: "720ml",
      abv: "16%",
      barcode: "4935819120230",
      cartonBarcode: "14935819120237",
      barcodeImage: "https://barcodeapi.org/api/128/4935819120230"
    },
    barcode: "4935819120230",
    cartonBarcode: "14935819120237",
    barcodeImage: "https://barcodeapi.org/api/128/4935819120230",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792570283/grandstore-uploads/products/sake/dassai-23-junmai-daiginjo-super-premium-sake-720ml.jpg",
    shipping: {
      box_type: "Handcrafted Paulownia Wood Box",
      weight_kg: 1.85,
      length_cm: 12,
      width_cm: 12,
      height_cm: 34,
      is_fragile: true,
      parcel_value: 2890,
      hs_code: "2206.00",
      aramexServiceType: "ONP"
    }
  },

  // ==========================================
  // JACK DANIEL'S
  // ==========================================
  {
    name: "Jack Daniel's Single Barrel Rye Green Label 750ml",
    brand: "Jack Daniel's",
    type: "Whiskey",
    category: "Whiskey",
    subcategory: "Tennessee Straight Rye Whiskey",
    country: "USA",
    size: "750ml",
    price: "2890",
    stock: 10,
    description: "Jack Daniel's Single Barrel Rye Green Label is drawn from individual barrels situated at the top tiers of the historic Lynchburg barrelhouses. Crafted from a historic 70% rye grain recipe and charcoal mellowed through 10 feet of sugar maple charcoal, this expression offers bold rye spice balanced with classic Tennessee sweetness.",
    tastingNotes: [
      "Nose: Ripe cherries, toasted oak, robust cracked rye pepper, and warm vanilla bean.",
      "Palate: Rich caramel, toasted hazelnut, spicy cloves, cinnamon bark, and dark chocolate.",
      "Finish: Warm, lingering rye spice, smooth charcoal sweetness, and toasted oak tannins."
    ],
    flavorProfile: ["Rye Spice", "Toasted Oak", "Caramelized Cherry", "Clove", "Dark Chocolate"],
    foodPairing: ["Slow-Smoked Ribs", "Dry-Aged Ribeye Steak", "Pecan Pie", "Roquefort Cheese"],
    identity: {
      type: "Whiskey",
      style: "Tennessee Straight Rye Whiskey",
      production: "70% Rye Mash Bill, Lincoln County Charcoal Mellowing, Single Barrel Select",
      origin: "Lynchburg, Tennessee, USA",
      age: "Single Barrel Vintage",
      bottleSize: "750ml",
      abv: "47%",
      barcode: "082184002610",
      cartonBarcode: "10082184002617",
      barcodeImage: "https://barcodeapi.org/api/128/082184002610"
    },
    barcode: "082184002610",
    cartonBarcode: "10082184002617",
    barcodeImage: "https://barcodeapi.org/api/128/082184002610",
    image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Decanter Heavyweight Luxury Box",
      weight_kg: 1.95,
      length_cm: 12,
      width_cm: 12,
      height_cm: 32,
      is_fragile: true,
      parcel_value: 2890,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Jack Daniel's Master Distiller Series No. 5 1L",
    brand: "Jack Daniel's",
    type: "Whiskey",
    category: "Whiskey",
    subcategory: "Limited Edition Tennessee Whiskey",
    country: "USA",
    size: "1.0L",
    price: "1450",
    stock: 14,
    description: "The 5th release in Jack Daniel's celebratory Master Distiller Series honors Frank Bobo, who guided the Lynchburg distillery through the momentous growth of the 1970s and 1980s. Bottled at a robust 43% ABV in a 1-Litre presentation, it is a treasured collector's item.",
    tastingNotes: [
      "Nose: Sweet caramel, vanilla fudge, toasted oak, and butterscotch candy.",
      "Palate: Charcoal-mellowed warmth, banana bread, sweet corn, and toasted baking spices.",
      "Finish: Long, rich, smooth, and lingering sweet oak."
    ],
    flavorProfile: ["Caramel Fudge", "Banana Bread", "Toasted Oak", "Butterscotch"],
    foodPairing: ["Barbecue Pulled Pork", "Sticky Toffee Pudding", "Smoked Gouda"],
    identity: {
      type: "Whiskey",
      style: "Master Distiller Limited Edition",
      production: "Cave Spring Water, Sugar Maple Charcoal Mellowing, Commemorative Series",
      origin: "Lynchburg, Tennessee, USA",
      age: "NAS Limited Release",
      bottleSize: "1.0L",
      abv: "43%",
      barcode: "5099873082531",
      cartonBarcode: "15099873082538",
      barcodeImage: "https://barcodeapi.org/api/128/5099873082531"
    },
    barcode: "5099873082531",
    cartonBarcode: "15099873082538",
    barcodeImage: "https://barcodeapi.org/api/128/5099873082531",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792585356/grandstore-uploads/products/whisky/jack-daniels-master-distiller-series-no-5-1l.jpg",
    shipping: {
      box_type: "Collector Cylinder Presentation Tin",
      weight_kg: 2.3,
      length_cm: 13,
      width_cm: 13,
      height_cm: 36,
      is_fragile: true,
      parcel_value: 1450,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Gentleman Jack Rare Double-Mellowed Tennessee Whiskey 750ml",
    brand: "Jack Daniel's",
    type: "Whiskey",
    category: "Whiskey",
    subcategory: "Double Charcoal Mellowed Whiskey",
    country: "USA",
    size: "750ml",
    price: "580",
    stock: 30,
    description: "Inspired by the original founder himself, Gentleman Jack undergoes a second charcoal mellowing after its maturation in handcrafted charred oak barrels. This double-mellowing process imparts exceptional smoothness, refined caramel notes, and an ultra-silky mouthfeel.",
    tastingNotes: [
      "Nose: Sweet vanilla, golden honey, and ripe crisp orchard fruit aromas.",
      "Palate: Unbelievably smooth and balanced, sweet vanilla caramel, toasted oak, and delicate citrus.",
      "Finish: Clean, silky, exceptionally rounded with warm honey tones."
    ],
    flavorProfile: ["Silky Vanilla", "Golden Honey", "Toasted Oak", "Delicate Citrus"],
    foodPairing: ["Glazed Ham", "Roasted Duck with Orange Sauce", "Creamy Brie Cheese"],
    identity: {
      type: "Whiskey",
      style: "Double Charcoal Mellowed Tennessee Whiskey",
      production: "Twice Charcoal Mellowed (Before & After Maturation)",
      origin: "Lynchburg, Tennessee, USA",
      age: "NAS",
      bottleSize: "750ml",
      abv: "40%",
      barcode: "082184038749",
      cartonBarcode: "10082184038746",
      barcodeImage: "https://barcodeapi.org/api/128/082184038749"
    },
    barcode: "082184038749",
    cartonBarcode: "10082184038746",
    barcodeImage: "https://barcodeapi.org/api/128/082184038749",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Standard Luxury Bottle Box",
      weight_kg: 1.85,
      length_cm: 12,
      width_cm: 12,
      height_cm: 32,
      is_fragile: true,
      parcel_value: 580,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Jack Daniel's Old No. 7 Tennessee Whiskey 750ml",
    brand: "Jack Daniel's",
    type: "Whiskey",
    category: "Whiskey",
    subcategory: "Tennessee Whiskey",
    country: "USA",
    size: "750ml",
    price: "360",
    stock: 60,
    description: "The world's quintessential American whiskey. Charcoal mellowed drop by drop through 10 feet of sugar maple charcoal and matured in handcrafted American white oak barrels, Jack Daniel's Old No. 7 has stood the test of time since 1866.",
    tastingNotes: [
      "Nose: Sweet caramel, vanilla, toffee, and toasted oak.",
      "Palate: Balanced sweet and oaky notes with banana, caramel, and charcoal warmth.",
      "Finish: Quick, sweet, and comforting warmth."
    ],
    flavorProfile: ["Caramel", "Vanilla", "Banana", "Charred Oak"],
    foodPairing: ["Barbecue Burgers", "Smoked Chicken Wings", "Apple Crumble"],
    identity: {
      type: "Whiskey",
      style: "Tennessee Whiskey",
      production: "Lincoln County Charcoal Mellowing, Cave Spring Water",
      origin: "Lynchburg, Tennessee, USA",
      age: "NAS",
      bottleSize: "750ml",
      abv: "43%",
      barcode: "082184090464",
      cartonBarcode: "10082184090461",
      barcodeImage: "https://barcodeapi.org/api/128/082184090464"
    },
    barcode: "082184090464",
    cartonBarcode: "10082184090461",
    barcodeImage: "https://barcodeapi.org/api/128/082184090464",
    image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Standard Bottle Box",
      weight_kg: 1.85,
      length_cm: 11,
      width_cm: 11,
      height_cm: 32,
      is_fragile: true,
      parcel_value: 360,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Jack Daniel's Old No. 7 Tennessee Whiskey 1.5L Magnum",
    brand: "Jack Daniel's",
    type: "Whiskey",
    category: "Whiskey",
    subcategory: "Large Format Tennessee Whiskey",
    country: "USA",
    size: "1.5L",
    price: "690",
    stock: 22,
    description: "The impressive 1.5-Litre Magnum bottle of the legendary Jack Daniel's Old No. 7. Perfect for social hosting, event bars, and home collections.",
    tastingNotes: [
      "Nose: Rich brown sugar, vanilla, molasses, and toasted wood.",
      "Palate: Smooth and bold with caramel candy, toasted oak, and sweet corn.",
      "Finish: Clean, sweet, and lingering."
    ],
    flavorProfile: ["Brown Sugar", "Toasted Oak", "Sweet Corn", "Caramel"],
    foodPairing: ["Barbecue Party Platters", "Smoked Pork Ribs", "Cheddar & Crackers"],
    identity: {
      type: "Whiskey",
      style: "Tennessee Whiskey Magnum",
      production: "Large Format Magnum Bottling",
      origin: "Lynchburg, Tennessee, USA",
      age: "NAS",
      bottleSize: "1.5L",
      abv: "43%",
      barcode: "082184090488",
      cartonBarcode: "10082184090485",
      barcodeImage: "https://barcodeapi.org/api/128/082184090488"
    },
    barcode: "082184090488",
    cartonBarcode: "10082184090485",
    barcodeImage: "https://barcodeapi.org/api/128/082184090488",
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Extra Large Bottle Box",
      weight_kg: 3.1,
      length_cm: 14,
      width_cm: 14,
      height_cm: 38,
      is_fragile: true,
      parcel_value: 690,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Jack Daniel's Sinatra Select Bold Handcrafted Decanter 1L",
    brand: "Jack Daniel's",
    type: "Whiskey",
    category: "Whiskey",
    subcategory: "Prestige American Whiskey Decanter",
    country: "USA",
    size: "1.0L",
    price: "3490",
    stock: 8,
    description: "Sinatra Select celebrates Frank Sinatra's legendary 50-year devotion to Jack Daniel's. Crafted in unique 'Sinatra Barrels' featuring deep hand-carved interior grooves that expose the whiskey to extra layers of toasted oak, this bottling delivers a rich amber hue and bold character bottled at 90 proof (45% ABV).",
    tastingNotes: [
      "Nose: Spicy oak, rich sweet honey, dried orange peel, and warm vanilla bean.",
      "Palate: Bold oak spice, dark chocolate, tobacco leaf, vanilla cream, and butterscotch.",
      "Finish: Incredibly smooth, bold, and sustained with pleasant smoky vanilla."
    ],
    flavorProfile: ["Grooved Oak", "Dark Chocolate", "Orange Peel", "Tobacco Leaf", "Butterscotch"],
    foodPairing: ["Prime New York Strip", "Cuban Cigars", "Artisanal Dark Truffles"],
    identity: {
      type: "Whiskey",
      style: "Prestige American Decanter",
      production: "Sinatra Grooved Oak Casks, 90 Proof (45% ABV)",
      origin: "Lynchburg, Tennessee, USA",
      age: "Special Cask Select",
      bottleSize: "1.0L",
      abv: "45%",
      barcode: "082184000470",
      cartonBarcode: "10082184000477",
      barcodeImage: "https://barcodeapi.org/api/128/082184000470"
    },
    barcode: "082184000470",
    cartonBarcode: "10082184000477",
    barcodeImage: "https://barcodeapi.org/api/128/082184000470",
    image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Sinatra Signature Presentation Box with Book",
      weight_kg: 2.8,
      length_cm: 15,
      width_cm: 15,
      height_cm: 38,
      is_fragile: true,
      parcel_value: 3490,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },

  // ==========================================
  // DIMPLE
  // ==========================================
  {
    name: "Dimple 15 Year Old De Luxe Scotch Whisky 750ml",
    brand: "Dimple",
    type: "Whisky",
    category: "Whisky",
    subcategory: "De Luxe Blended Scotch Whisky",
    country: "Scotland",
    size: "750ml",
    price: "950",
    stock: 20,
    description: "Famous for its unique three-sided dimpled bottle wrapped in protective gold wire mesh, Dimple 15 Year Old was created by the Haig family, Scotland's oldest whisky dynasty dating back to 1627. Boasting a high percentage of rich single malts including Glenkinchie and Linkwood, it provides rich, mellow complexity.",
    tastingNotes: [
      "Nose: Warm malt, dried stone fruits, sweet caramel, citrus zest, and a subtle puff of peat smoke.",
      "Palate: Smooth, layered, honeyed malt, toffee, dark spices, toasted oak, and roasted walnuts.",
      "Finish: Long, warming, mellow, and satisfyingly dry."
    ],
    flavorProfile: ["Malty Honey", "Dried Fruits", "Toasted Oak", "Soft Peat Smoke", "Walnut"],
    foodPairing: ["Venison Carpaccio", "Rich Fruitcake", "Roasted Chestnuts", "Mature Cheddar"],
    identity: {
      type: "Whisky",
      style: "De Luxe Blended Scotch Whisky",
      production: "15-Year Oak Aged, Glenkinchie & Linkwood Malts, Wire-Wrapped Bottle",
      origin: "Edinburgh & Fife, Scotland",
      age: "15 Years",
      bottleSize: "750ml",
      abv: "43%",
      barcode: "5000267014203",
      cartonBarcode: "15000267014200",
      barcodeImage: "https://barcodeapi.org/api/128/5000267014203"
    },
    barcode: "5000267014203",
    cartonBarcode: "15000267014200",
    barcodeImage: "https://barcodeapi.org/api/128/5000267014203",
    image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Iconic Triangular Bottle Luxury Box",
      weight_kg: 1.85,
      length_cm: 14,
      width_cm: 14,
      height_cm: 30,
      is_fragile: true,
      parcel_value: 950,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Dimple Haig 15 Year Old Presentation Tin Collector Edition 750ml",
    brand: "Dimple",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Vintage Collector Tin Edition",
    country: "Scotland",
    size: "750ml",
    price: "1590",
    stock: 10,
    description: "An authentic vintage collector's treasure: Dimple Haig 15 Year Old housed inside an ornate embossed presentation tin depicting the legendary Haig distilling lineage. A prized historical acquisition.",
    tastingNotes: [
      "Nose: Rich antique malt, heather honey, dried raisins, soft tobacco smoke, and nutmeg.",
      "Palate: Velvety smooth with rich malt, toffee fudge, cinnamon stick, and aged oak depth.",
      "Finish: Lingering, warm, gently spicy, and beautifully rounded."
    ],
    flavorProfile: ["Antique Malt", "Toffee Fudge", "Nutmeg", "Soft Tobacco", "Aged Oak"],
    foodPairing: ["Braised Oxtail Stew", "Aged Gouda", "Dark Chocolate Orange"],
    identity: {
      type: "Whisky",
      style: "Collector Presentation Tin Edition",
      production: "Aged 15 Years in Scottish Oak, Embossed Metal Presentation Tin",
      origin: "Scotland",
      age: "15 Years",
      bottleSize: "750ml",
      abv: "43%",
      barcode: "5000267020051",
      cartonBarcode: "15000267020058",
      barcodeImage: "https://barcodeapi.org/api/128/5000267020051"
    },
    barcode: "5000267020051",
    cartonBarcode: "15000267020058",
    barcodeImage: "https://barcodeapi.org/api/128/5000267020051",
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Embossed Collector Presentation Tin",
      weight_kg: 2.1,
      length_cm: 15,
      width_cm: 15,
      height_cm: 32,
      is_fragile: true,
      parcel_value: 1590,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Dimple Golden Selection Blended Scotch Whisky 700ml",
    brand: "Dimple",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Blended Scotch Whisky",
    country: "Scotland",
    size: "700ml",
    price: "820",
    stock: 24,
    description: "Crafted by Master Blender Chris Clark, Dimple Golden Selection captures the peak of maturation across thirty distinct malt and grain whiskies. Showcasing notes of ripe mango, rich mocha, and sweet vanilla, it redefines the Dimple profile for modern palates.",
    tastingNotes: [
      "Nose: Fresh floral vibrancy, juicy ripe mango, honeyed malt, and macadamia nut.",
      "Palate: Creamy, soft, luxurious mocha coffee, sweet vanilla, and delicate baking spice.",
      "Finish: Smooth, lingering, and softly sweet."
    ],
    flavorProfile: ["Ripe Mango", "Mocha Coffee", "Honeyed Malt", "Macadamia Nut"],
    foodPairing: ["Duck a l'Orange", "Tiramisu", "Brie de Meaux"],
    identity: {
      type: "Whisky",
      style: "Blended Scotch Whisky",
      production: "Master Blend of 30 Casks, Gold Wire Mesh Decanter",
      origin: "Scotland",
      age: "NAS",
      bottleSize: "700ml",
      abv: "40%",
      barcode: "5000267160306",
      cartonBarcode: "15000267160303",
      barcodeImage: "https://barcodeapi.org/api/128/5000267160306"
    },
    barcode: "5000267160306",
    cartonBarcode: "15000267160303",
    barcodeImage: "https://barcodeapi.org/api/128/5000267160306",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop",
    shipping: {
      box_type: "Standard Triangular Bottle Box",
      weight_kg: 1.75,
      length_cm: 13,
      width_cm: 13,
      height_cm: 30,
      is_fragile: true,
      parcel_value: 820,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  },
  {
    name: "Dimple 3L 1970 Rare Heritage Collector Limited Edition",
    brand: "Dimple",
    type: "Whisky",
    category: "Whisky",
    subcategory: "Ultra-Rare Heritage Jeroboam",
    country: "Scotland",
    size: "3.0L",
    price: "7990",
    stock: 3,
    description: "An extraordinary 1970s vintage 3-Litre Jeroboam bottling of Dimple De Luxe Scotch Whisky. Complete with the original heavy wire lattice and wax seal, this museum-grade bottle preserves the legendary 1970s Haig blend profile containing deep, unpeated Speyside and Highland malts.",
    tastingNotes: [
      "Nose: Antique library leather, beeswax, dried figs, candied orange, and honeyed malt.",
      "Palate: Dense, rich, oily mouthfeel, dark treacle, dried dates, pipe tobacco, and antique oak.",
      "Finish: Immensely long, dignified, and complex with gentle wood smoke."
    ],
    flavorProfile: ["Antique Leather", "Dark Treacle", "Dried Figs", "Pipe Tobacco", "Beeswax"],
    foodPairing: ["Rare Roast Beef", "Aged Parmigiano Reggiano", "Vintage Cigars"],
    identity: {
      type: "Whisky",
      style: "1970s Vintage Rare Jeroboam",
      production: "Historical 1970s Distillate Bottling, Hand-Wired Glass Jeroboam",
      origin: "Scotland",
      age: "Vintage 1970",
      bottleSize: "3.0L",
      abv: "43%",
      barcode: "5000267030036",
      cartonBarcode: "15000267030033",
      barcodeImage: "https://barcodeapi.org/api/128/5000267030036"
    },
    barcode: "5000267030036",
    cartonBarcode: "15000267030033",
    barcodeImage: "https://barcodeapi.org/api/128/5000267030036",
    image: "https://res.cloudinary.com/oioqrgj0/image/upload/v1792581441/grandstore-uploads/products/whisky/dimple-3l-1970-rare-heritage-collector-limited-edition.jpg",
    shipping: {
      box_type: "Custom Foam-Lined Timber Vault Crate",
      weight_kg: 6.2,
      length_cm: 22,
      width_cm: 22,
      height_cm: 46,
      is_fragile: true,
      parcel_value: 7990,
      hs_code: "2208.30",
      aramexServiceType: "ONP"
    }
  }
];

// ==========================================
// MOSI OA TUNYA CIGARS (10 PRODUCTS)
// ==========================================
const mosiProducts = [
  {
    id: "cigar_mot_001",
    slug: "mot-robusto-zebra",
    name: "MOT ROBUSTO ZEBRA",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Hand-Rolled Cigars",
    country: "Zimbabwe",
    size: "6 inches x 54 gauge",
    price: "380",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 380,
      box10Price: 3600,
      box25Price: 8550,
      tradePrice: 260,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Habanos & Connecticut",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "54",
      length: "6 inches",
      shape: "Robusto",
      flavor: "Mixed",
      pressed: "Yes",
      tip: "No",
      origin: "Ecuador"
    },
    description: "MOT ROBUSTO ZEBRA is a masterpiece of artisan blending, featuring an eye-catching barber-pole dual wrapper of Habanos and Connecticut leaf over premium Zimbabwean Burley binder and filler. Hand-rolled by Zimbabwe's all-female master rollers.",
    stock: 50,
    barcode: "6009876543011",
    cartonBarcode: "16009876543018",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543011",
    image: "/images/products/mot-robusto-zebra.webp",
    shipping: {
      box_type: "Cedar Cigar Humidor Box",
      weight_kg: 0.45,
      length_cm: 20,
      width_cm: 15,
      height_cm: 6,
      is_fragile: true,
      parcel_value: 380,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  },
  {
    id: "cigar_mot_002",
    slug: "mot-toro-habanos",
    name: "MOT TORO HABANOS",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Hand-Rolled Cigars",
    country: "Zimbabwe",
    size: "6 inches x 60 gauge",
    price: "420",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 420,
      box10Price: 3990,
      box25Price: 9450,
      tradePrice: 290,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Habanos",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "60",
      length: "6 inches",
      shape: "Toro",
      flavor: "Strong",
      pressed: "Yes",
      tip: "No",
      origin: "Ecuador"
    },
    description: "A commanding 60-gauge Toro cloaked in a rich, oily Ecuadorian Habanos wrapper. Delivering deep earthy notes, espresso, and spicy African pepper from aged Zimbabwean Burley.",
    stock: 45,
    barcode: "6009876543028",
    cartonBarcode: "16009876543025",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543028",
    image: "/images/products/mot-toro-habanos.webp",
    shipping: {
      box_type: "Cedar Cigar Humidor Box",
      weight_kg: 0.5,
      length_cm: 22,
      width_cm: 16,
      height_cm: 6,
      is_fragile: true,
      parcel_value: 420,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  },
  {
    id: "cigar_mot_003",
    slug: "mot-torpedo-habanos",
    name: "MOT TORPEDO HABANOS",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Hand-Rolled Cigars",
    country: "Zimbabwe",
    size: "6 inches x 60 gauge",
    price: "440",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 440,
      box10Price: 4180,
      box25Price: 9900,
      tradePrice: 300,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Habanos",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "60",
      length: "6 inches",
      shape: "Torpedo",
      flavor: "Strong",
      pressed: "Yes",
      tip: "Yes",
      origin: "Ecuador"
    },
    description: "The Torpedo Habanos concentrates rich flavors towards its tapered head, offering robust wood smoke, toasted nuts, and intense cocoa undertones.",
    stock: 40,
    barcode: "6009876543035",
    cartonBarcode: "16009876543032",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543035",
    image: "/images/products/mot-torpedo-habanos.webp",
    shipping: {
      box_type: "Cedar Cigar Humidor Box",
      weight_kg: 0.5,
      length_cm: 22,
      width_cm: 16,
      height_cm: 6,
      is_fragile: true,
      parcel_value: 440,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  },
  {
    id: "cigar_mot_004",
    slug: "mot-robusto-habanos",
    name: "MOT ROBUSTO HABANOS",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Hand-Rolled Cigars",
    country: "Zimbabwe",
    size: "6 inches x 54 gauge",
    price: "360",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 360,
      box10Price: 3420,
      box25Price: 8100,
      tradePrice: 250,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Habanos",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "54",
      length: "6 inches",
      shape: "Robusto",
      flavor: "Strong",
      pressed: "Yes",
      tip: "No",
      origin: "Ecuador"
    },
    description: "A compact powerhouse. The MOT Robusto Habanos offers full-bodied character with bold cedar, rich leather, and a peppery finish.",
    stock: 60,
    barcode: "6009876543042",
    cartonBarcode: "16009876543049",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543042",
    image: "/images/products/mot-robusto-habanos.webp",
    shipping: {
      box_type: "Cedar Cigar Humidor Box",
      weight_kg: 0.45,
      length_cm: 20,
      width_cm: 15,
      height_cm: 6,
      is_fragile: true,
      parcel_value: 360,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  },
  {
    id: "cigar_mot_005",
    slug: "mot-toro-connecticut",
    name: "MOT TORO CONNECTICUT",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Hand-Rolled Cigars",
    country: "Zimbabwe",
    size: "6 inches x 60 gauge",
    price: "390",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 390,
      box10Price: 3700,
      box25Price: 8775,
      tradePrice: 270,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Connecticut",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "60",
      length: "6 inches",
      shape: "Toro",
      flavor: "Mild",
      pressed: "Yes",
      tip: "No",
      origin: "Ecuador"
    },
    description: "Draped in a golden Ecuadorian Connecticut shade wrapper, this mild-to-medium Toro delivers creamy nuances, toasted almonds, and sweet hay with supreme elegance.",
    stock: 45,
    barcode: "6009876543059",
    cartonBarcode: "16009876543056",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543059",
    image: "/images/products/mot-toro-connecticut.webp",
    shipping: {
      box_type: "Cedar Cigar Humidor Box",
      weight_kg: 0.5,
      length_cm: 22,
      width_cm: 16,
      height_cm: 6,
      is_fragile: true,
      parcel_value: 390,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  },
  {
    id: "cigar_mot_006",
    slug: "mot-torpedo-sumatra",
    name: "MOT TORPEDO SUMATRA",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Hand-Rolled Cigars",
    country: "Zimbabwe",
    size: "6 inches x 54 gauge",
    price: "410",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 410,
      box10Price: 3890,
      box25Price: 9225,
      tradePrice: 280,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Sumatra/Connecticut",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "54",
      length: "6 inches",
      shape: "Torpedo",
      flavor: "Mild",
      pressed: "Yes",
      tip: "Yes",
      origin: "Ecuador"
    },
    description: "A dual-toned Torpedo wrapped in fragrant Sumatra and smooth Connecticut leaf, offering gentle spice, sweet cedar, and herbal nuances.",
    stock: 40,
    barcode: "6009876543066",
    cartonBarcode: "16009876543063",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543066",
    image: "/images/products/mot-torpedo-sumatra.webp",
    shipping: {
      box_type: "Cedar Cigar Humidor Box",
      weight_kg: 0.45,
      length_cm: 20,
      width_cm: 15,
      height_cm: 6,
      is_fragile: true,
      parcel_value: 410,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  },
  {
    id: "cigar_mot_007",
    slug: "mot-robusto-sumatra",
    name: "MOT ROBUSTO SUMATRA",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Hand-Rolled Cigars",
    country: "Zimbabwe",
    size: "6 inches x 54 gauge",
    price: "350",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 350,
      box10Price: 3325,
      box25Price: 7875,
      tradePrice: 240,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Sumatra",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "54",
      length: "6 inches",
      shape: "Robusto",
      flavor: "Mild",
      pressed: "Yes",
      tip: "No",
      origin: "Cameroon"
    },
    description: "Wrapped in toothy Cameroon Sumatra leaf, this Robusto provides cinnamon, toasted graham cracker, and delicate honeyed tobacco notes.",
    stock: 55,
    barcode: "6009876543073",
    cartonBarcode: "16009876543070",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543073",
    image: "/images/products/mot-robusto-sumatra.webp",
    shipping: {
      box_type: "Cedar Cigar Humidor Box",
      weight_kg: 0.45,
      length_cm: 20,
      width_cm: 15,
      height_cm: 6,
      is_fragile: true,
      parcel_value: 350,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  },
  {
    id: "cigar_mot_008",
    slug: "mot-corona-habanos-strong",
    name: "MOT CORONA HABANOS (STRONG)",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Hand-Rolled Cigars",
    country: "Zimbabwe",
    size: "5 inches x 42 gauge",
    price: "310",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 310,
      box10Price: 2950,
      box25Price: 6975,
      tradePrice: 210,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Habanos",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "42",
      length: "5 inches",
      shape: "Corona",
      flavor: "Strong",
      pressed: "Yes",
      tip: "No",
      origin: "Dominican Republic"
    },
    description: "An intense 42-gauge Corona delivering concentrated spicy African tobacco character, dark roasted coffee, and smoky wood.",
    stock: 70,
    barcode: "6009876543080",
    cartonBarcode: "16009876543087",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543080",
    image: "/images/products/mot-corona-habanos-strong.webp",
    shipping: {
      box_type: "Cedar Cigar Humidor Box",
      weight_kg: 0.4,
      length_cm: 18,
      width_cm: 14,
      height_cm: 5,
      is_fragile: true,
      parcel_value: 310,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  },
  {
    id: "cigar_mot_009",
    slug: "mot-corona-sumatra-mild",
    name: "MOT CORONA SUMATRA (MILD)",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Hand-Rolled Cigars",
    country: "Zimbabwe",
    size: "5 inches x 42 gauge",
    price: "290",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 290,
      box10Price: 2750,
      box25Price: 6525,
      tradePrice: 195,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Sumatra",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "42",
      length: "5 inches",
      shape: "Corona",
      flavor: "Mild",
      pressed: "Yes",
      tip: "No",
      origin: "Ecuador"
    },
    description: "A smooth, mild daytime Corona offering crisp cedar, roasted hazelnuts, and a gentle floral bouquet.",
    stock: 65,
    barcode: "6009876543097",
    cartonBarcode: "16009876543094",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543097",
    image: "/images/products/mot-corona-sumatra-mild.webp",
    shipping: {
      box_type: "Cedar Cigar Humidor Box",
      weight_kg: 0.4,
      length_cm: 18,
      width_cm: 14,
      height_cm: 5,
      is_fragile: true,
      parcel_value: 290,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  },
  {
    id: "cigar_mot_010",
    slug: "mot-mini-cigar",
    name: "MOT MINI CIGAR",
    brand: "Mosi Oa Tunya",
    type: "Cigar",
    category: "Cigars",
    subcategory: "Cigarillos",
    country: "Zimbabwe",
    size: "4 inches x 28 gauge",
    price: "180",
    hidePriceOnFrontend: true,
    cigarPricing: {
      singlePrice: 180,
      box10Price: 1700,
      box25Price: 4050,
      tradePrice: 120,
      dynamicMarginPct: 35,
      currency: "ZAR",
      lastDynamicUpdate: new Date()
    },
    cigarSpecs: {
      wrapper: "Connecticut",
      binder: "Zimbabwean Burley",
      filler: "Zimbabwean Burley",
      gauge: "28",
      length: "4 inches",
      shape: "Cigarillo",
      flavor: "Lite",
      pressed: "No",
      tip: "No",
      origin: "Ecuador"
    },
    description: "Convenient 4-inch hand-rolled cigarillo for a quick 20-minute smoke. Features premium Zimbabwean Burley wrapped in delicate Connecticut leaf.",
    stock: 120,
    barcode: "6009876543103",
    cartonBarcode: "16009876543100",
    barcodeImage: "https://barcodeapi.org/api/128/6009876543103",
    image: "/images/products/mot-mini-cigar.webp",
    shipping: {
      box_type: "Pocket Tin / Box",
      weight_kg: 0.2,
      length_cm: 12,
      width_cm: 10,
      height_cm: 3,
      is_fragile: false,
      parcel_value: 180,
      hs_code: "2402.10",
      aramexServiceType: "ONP"
    }
  }
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function seedAll() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grand-store';
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    // 1. Seed Whiskyshop Products
    let whiskyshopCount = 0;
    for (const p of whiskyshopProducts) {
      const generatedSlug = slugify(p.name);
      const query = { $or: [{ name: p.name }, { slug: generatedSlug }] };
      const existing = await Product.findOne(query);

      const productPayload = {
        name: p.name,
        slug: generatedSlug,
        brand: p.brand,
        type: p.type,
        category: p.category,
        subcategory: p.subcategory,
        country: p.country,
        size: p.size,
        price: p.price,
        stock: p.stock,
        description: p.description,
        tastingNotes: p.tastingNotes,
        flavorProfile: p.flavorProfile,
        foodPairing: p.foodPairing,
        identity: p.identity,
        barcode: p.barcode,
        cartonBarcode: p.cartonBarcode,
        barcodeImage: p.barcodeImage,
        image: p.image,
        gallery: [p.image],
        shipping: p.shipping,
        vendorId: null, // Admin Retail Product
        approvalStatus: 'approved',
        catalogManaged: true,
        sourceUrl: 'https://whiskyshop.co.za/'
      };

      if (existing) {
        await Product.findByIdAndUpdate(existing._id, { $set: productPayload });
        console.log(`Updated Whiskyshop product: ${p.name}`);
      } else {
        productPayload.id = `ws_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await Product.create(productPayload);
        console.log(`Inserted Whiskyshop product: ${p.name}`);
      }
      whiskyshopCount++;
    }

    // 2. Seed Mosi Oa Tunya Cigars
    let mosiCount = 0;
    for (const m of mosiProducts) {
      const query = { $or: [{ slug: m.slug }, { name: m.name }] };
      const existing = await Product.findOne(query);

      const mosiPayload = {
        id: m.id,
        name: m.name,
        slug: m.slug,
        brand: m.brand,
        type: m.type,
        category: m.category,
        subcategory: m.subcategory,
        country: m.country,
        size: m.size,
        price: m.price,
        hidePriceOnFrontend: true,
        cigarPricing: m.cigarPricing,
        cigarSpecs: m.cigarSpecs,
        description: m.description,
        stock: m.stock,
        barcode: m.barcode,
        cartonBarcode: m.cartonBarcode,
        barcodeImage: m.barcodeImage,
        image: m.image,
        gallery: [m.image],
        shipping: m.shipping,
        vendorId: null, // Admin Retail Product
        approvalStatus: 'approved',
        catalogManaged: true
      };

      if (existing) {
        await Product.findByIdAndUpdate(existing._id, { $set: mosiPayload });
        console.log(`Updated Mosi product: ${m.name}`);
      } else {
        await Product.create(mosiPayload);
        console.log(`Inserted Mosi product: ${m.name}`);
      }
      mosiCount++;
    }

    console.log(`\nDONE! Successfully seeded/updated:`);
    console.log(`- ${whiskyshopCount} WhiskyShop retail products (Ballantine's, Sake, Baijiu, Jack Daniel's, Dimple)`);
    console.log(`- ${mosiCount} Mosi Oa Tunya hand-rolled cigar products with dynamic pricing engine configured`);

    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seedAll();
