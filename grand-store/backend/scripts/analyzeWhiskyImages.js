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
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const all = await Product.find({}).lean();
  const whiskies = all.filter(p => getProductCategory(p) === 'Whisky');

  const hosts = {};
  whiskies.forEach(w => {
    const img = w.image || '';
    let host = 'other';
    try {
      const u = new URL(img);
      host = u.hostname;
    } catch (e) {}
    hosts[host] = (hosts[host] || 0) + 1;
  });

  console.log('Whisky hosts breakdown:');
  console.log(hosts);

  console.log('\nCloudinary whisky paths:');
  const cloudWhiskies = whiskies.filter(w => (w.image || '').includes('cloudinary'));
  cloudWhiskies.forEach(w => {
    console.log(`- ${w.name}: ${w.image}`);
  });

  console.log('\nNon-Cloudinary whisky samples:');
  const nonCloud = whiskies.filter(w => !(w.image || '').includes('cloudinary'));
  nonCloud.slice(0, 15).forEach(w => {
    console.log(`- ${w.name}: ${w.image}`);
  });

  await mongoose.disconnect();
}

run();
