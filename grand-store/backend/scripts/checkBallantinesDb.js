const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const prods = await Product.find({
    $or: [
      { brand: /Ballantine/i },
      { name: /Ballantine/i }
    ]
  }).lean();
  console.log('Total Ballantine products found:', prods.length);
  prods.forEach((p, idx) => {
    console.log(`${idx + 1}. ID: ${p.id || p._id} | Name: ${p.name} | Slug: ${p.slug} | Image: ${p.image}`);
  });
  await mongoose.disconnect();
}
check().catch(console.error);
