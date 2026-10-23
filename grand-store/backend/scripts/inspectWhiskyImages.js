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
  const whisky = all.filter(p => getProductCategory(p).toLowerCase() === 'whisky');

  console.log(`Found ${whisky.length} Whisky products in DB:`);
  whisky.forEach((p, idx) => {
    console.log(`[${idx + 1}] ${p.name} (${p.brand}) -> ${p.image}`);
  });
  await mongoose.disconnect();
}

run().catch(console.error);
