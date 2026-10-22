const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const aska = await Product.find({
    $or: [
      { name: { $regex: /aska/i } },
      { slug: { $regex: /aska/i } },
      { brand: { $regex: /aska/i } }
    ]
  }).lean();
  console.log('Aska products count:', aska.length);
  aska.forEach(p => console.log('Aska:', JSON.stringify({ _id: p._id, id: p.id, name: p.name, slug: p.slug, price: p.price, brand: p.brand }, null, 2)));

  const dimple = await Product.find({
    $or: [
      { name: { $regex: /dimple/i } },
      { slug: { $regex: /dimple/i } }
    ]
  }).lean();
  console.log('\nDimple products count:', dimple.length);
  dimple.forEach(p => console.log('Dimple:', JSON.stringify({ _id: p._id, id: p.id, name: p.name, slug: p.slug, image: p.image }, null, 2)));

  await mongoose.disconnect();
}
check().catch(console.error);
