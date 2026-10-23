const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const jd = await Product.find({
    $or: [
      { brand: { $regex: /jack daniel/i } },
      { name: { $regex: /jack daniel/i } },
      { name: { $regex: /gentleman jack/i } }
    ]
  }).lean();
  console.log('Count:', jd.length);
  fs.writeFileSync('C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/jd_products.json', JSON.stringify(jd, null, 2));
  console.log('Saved', jd.length, 'products to scratch/jd_products.json');
  await mongoose.disconnect();
}
check().catch(console.error);
