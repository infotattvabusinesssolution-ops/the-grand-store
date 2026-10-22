const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const beerCiders = await Product.find({
    $or: [
      { category: { $regex: /beer/i } },
      { type: { $regex: /beer/i } },
      { category: { $regex: /cider/i } },
      { type: { $regex: /cider/i } }
    ]
  }).lean();
  
  console.log('Total Beer & Cider products:', beerCiders.length);
  beerCiders.forEach(p => console.log(JSON.stringify({
    _id: p._id,
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    brand: p.brand,
    price: p.price,
    image: p.image
  }, null, 2)));

  await mongoose.disconnect();
}
check().catch(console.error);
