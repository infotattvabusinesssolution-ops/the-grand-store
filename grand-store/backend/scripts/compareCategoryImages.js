const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const getProductCategory = (p) => {
  const cat = p.category || p.type || "Wine & spirits";
  const sub = (p.subcategory || "").toLowerCase();
  const name = (p.name || "").toLowerCase();
  if (
    sub === "baijiu" ||
    sub.includes("baijiu") ||
    name.includes("baijiu") ||
    (cat.toLowerCase() === "spirits" && name.includes("moutai"))
  ) {
    return "Baijiu";
  }
  if (cat.toLowerCase() === "baijiu & sake") {
    if (sub.includes("sake") || name.includes("sake")) return "Sake";
    return "Baijiu";
  }
  if (cat.toLowerCase() === "whiskey" || cat.toLowerCase() === "whisky") {
    return "Whisky";
  }
  return cat;
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const all = await Product.find({}).lean();
  
  const selectedCategories = ['Baijiu', 'Sake', 'Whisky'];
  const scoped = all.filter(p => {
    if (!p || p.type === 'accessory') return false;
    const pCat = getProductCategory(p).toLowerCase();
    return selectedCategories.some(c => {
      const cat = c.toLowerCase();
      if (cat === 'whisky' || cat === 'whiskey') {
        return pCat === 'whisky' || pCat === 'whiskey';
      }
      return cat === pCat;
    });
  });

  console.log(`Total scoped products for [Baijiu, Sake, Whisky]: ${scoped.length}`);
  
  // Categorize images by type
  const types = {};
  scoped.forEach(p => {
    const cat = getProductCategory(p);
    if (!types[cat]) types[cat] = [];
    types[cat].push({ name: p.name, img: p.image });
  });

  for (const cat in types) {
    console.log(`\n================== ${cat} (${types[cat].length} products) ==================`);
    types[cat].slice(0, 10).forEach((item, i) => {
      console.log(`${i+1}. [${item.name}] -> ${item.img}`);
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
