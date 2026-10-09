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
const LuxuryShowcase = require("../models/LuxuryShowcase");

async function seedBrutReserve(existingConnection = null) {
  const shouldDisconnect = !existingConnection;
  if (!existingConnection) {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
  }

  console.log("Seeding M Collection The Brut Reserve as Retail Product...");

  const brutData = {
    id: "mcollection-brut-reserve",
    slug: "m-collection-the-brut-reserve-cap-classique",
    name: "M Collection The Brut Reserve 750ml",
    brand: "M Collection",
    category: "Champagne",
    subcategory: "Méthode Cap Classique",
    type: "Champagne",
    country: "South Africa",
    price: "850",
    offer_price: 795,
    offer_active: true,
    size: "750ml",
    stock: 50,
    image: "/assets/mcollection/mcollection-brut.png",
    originalImage: "/assets/mcollection/mcollection-brut.png",
    gallery: ["/assets/mcollection/mcollection-brut.png"],
    description:
      "Our signature expression. Crisp green apple and bright citrus on the palate, perfectly balanced with warm notes of toasted brioche. Aged 36 months on the lees for a fine, persistent mousse. An African masterpiece crafted for collectors and connoisseurs who accept only the rarest and the best.",
    tastingNotes: [
      "Crisp Green Apple",
      "Toasted Brioche",
      "White Truffle",
      "Lemon Zest",
      "Fine Persistent Mousse",
    ],
    flavorProfile: ["Crisp & Elegant", "Brioche & Citrus", "Mineral Finish"],
    foodPairing: [
      "Fresh Oysters",
      "Caviar",
      "Lobster Tail",
      "Truffle Risotto",
      "Aged Comté",
    ],
    identity: {
      type: "Sparkling Wine",
      style: "Brut Reserve",
      production: "Méthode Cap Classique",
      origin: "Western Cape, South Africa",
      age: "36 Months on Lees",
      bottleSize: "750ml",
      abv: "12.0%",
    },
    featured: true,
    badges: ["HAUTE_CUVEE", "GRAND_STORE_CHOICE", "LIMITED_ALLOCATION"],
  };

  // Upsert the Product
  const product = await Product.findOneAndUpdate(
    { id: brutData.id },
    { $set: brutData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Product saved successfully: ${product.name} (ID: ${product._id})`);

  // Upsert LuxuryShowcase config
  const showcaseConfig = {
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
    stock: product.stock || 50,
    bottleImage: "/assets/mcollection/mcollection-brut.png",
    productRefId: product.id,
    productId: product._id,
    ctaText: "Reserve Allocation",
  };

  let showcase = await LuxuryShowcase.findOne();
  if (showcase) {
    Object.assign(showcase, showcaseConfig);
    await showcase.save();
  } else {
    showcase = await LuxuryShowcase.create(showcaseConfig);
  }

  console.log("LuxuryShowcase configuration successfully synced!");

  if (shouldDisconnect) {
    await mongoose.disconnect();
  }

  return { product, showcase };
}

if (require.main === module) {
  seedBrutReserve()
    .then(() => {
      console.log("Seeding complete!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}

module.exports = seedBrutReserve;
