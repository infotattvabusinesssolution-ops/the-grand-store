const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const jd = await Product.find({
    $or: [
      { brand: { $regex: /jack daniel/i } },
      { name: { $regex: /jack daniel/i } }
    ]
  }, { name: 1, slug: 1, brand: 1, image: 1, price: 1 }).lean();

  console.log('Jack Daniels products count:', jd.length);
  jd.forEach(p => {
    console.log(`- ${p.name} (${p.slug}):\n    ${p.image}`);
  });

  await mongoose.disconnect();
}
check().catch(console.error);
