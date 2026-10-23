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

async function checkWhisky() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const all = await Product.find({}).lean();
  
  const whiskies = all.filter(p => getProductCategory(p) === 'Whisky');
  const baijius = all.filter(p => getProductCategory(p) === 'Baijiu');
  const sakes = all.filter(p => getProductCategory(p) === 'Sake');

  console.log(`Totals: Whisky=${whiskies.length}, Baijiu=${baijius.length}, Sake=${sakes.length}`);

  let bgRemoval = 0;
  let transparentPng = 0;
  let localAsset = 0;
  let externalCdn = 0;

  whiskies.forEach(w => {
    const img = w.image || (w.images && w.images[0]) || '';
    if (img.includes('e_background_removal')) bgRemoval++;
    if (img.includes('.png')) transparentPng++;
    if (img.startsWith('/assets/')) localAsset++;
    if (img.startsWith('http')) externalCdn++;
  });

  console.log(`Whisky breakdown:
    Total: ${whiskies.length}
    with e_background_removal: ${bgRemoval}
    PNG format: ${transparentPng}
    local /assets/: ${localAsset}
    remote http(s): ${externalCdn}
  `);

  console.log('--- ALL BAIJIU PRODUCTS ---');
  baijius.forEach((b, i) => {
    console.log(`${i+1}. [${b.name}] (id: ${b._id})`);
    console.log(`   image: ${b.image}`);
    console.log(`   images: ${JSON.stringify(b.images)}`);
  });

  console.log('\n--- ALL SAKE PRODUCTS ---');
  sakes.forEach((s, i) => {
    console.log(`${i+1}. [${s.name}] (id: ${s._id})`);
    console.log(`   image: ${s.image}`);
    console.log(`   images: ${JSON.stringify(s.images)}`);
  });

  console.log('\n--- SAMPLE 15 WHISKY PRODUCTS ---');
  whiskies.slice(0, 15).forEach((w, i) => {
    console.log(`${i+1}. [${w.name}]`);
    console.log(`   image: ${w.image}`);
  });

  await mongoose.disconnect();
}

checkWhisky().catch(console.error);
