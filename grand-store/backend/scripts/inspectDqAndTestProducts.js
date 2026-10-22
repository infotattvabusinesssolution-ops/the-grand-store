const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const items = await Product.find({
    $or: [
      { name: { $regex: /dq/i } },
      { slug: { $regex: /dq/i } },
      { name: { $regex: /test/i } },
      { name: { $regex: /demo/i } },
      { brand: { $regex: /dq/i } },
      { category: { $regex: /cider/i } }
    ]
  }).lean();
  
  console.log('Found items count:', items.length);
  items.forEach(p => console.log(JSON.stringify({
    _id: p._id,
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    price: p.price,
    image: p.image,
    vendor: p.vendor
  }, null, 2)));

  // Also check all products in the database to see if there are any other gibberish/test products
  const allProducts = await Product.find({}, { name: 1, slug: 1, brand: 1, category: 1, price: 1, image: 1 }).lean();
  console.log('\nTotal products in DB:', allProducts.length);
  const suspicious = allProducts.filter(p => {
    const n = (p.name || '').toLowerCase();
    const b = (p.brand || '').toLowerCase();
    const s = (p.slug || '').toLowerCase();
    return /^(test|demo|asdf|qwerty|dq|dw|fake)/.test(n) || 
           /(dqdq|qdwq|asdf|qwerty)/.test(n) ||
           /(dqdq|qdwq|asdf|qwerty)/.test(b) ||
           /(dqdq|qdwq|asdf|qwerty)/.test(s);
  });
  console.log('\nSuspicious/Test products:', JSON.stringify(suspicious, null, 2));

  await mongoose.disconnect();
}
check().catch(console.error);
