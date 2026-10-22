const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const ballantinesCradle = await Product.find({
    $or: [
      { name: { $regex: /cradle/i } },
      { slug: { $regex: /cradle/i } },
      { name: { $regex: /ballantine.*3l/i } }
    ]
  }).lean();
  console.log('Ballantine Cradle products:', ballantinesCradle.length);
  ballantinesCradle.forEach(p => console.log(JSON.stringify({
    _id: p._id,
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image
  }, null, 2)));

  const unsplashProducts = await Product.find({
    image: { $regex: /unsplash/i }
  }, { name: 1, slug: 1, brand: 1, image: 1 }).lean();
  console.log('\nTotal products with unsplash image:', unsplashProducts.length);
  unsplashProducts.forEach(p => console.log(`- [${p.brand}] ${p.name} (${p.slug}): ${p.image}`));

  await mongoose.disconnect();
}
check().catch(console.error);
