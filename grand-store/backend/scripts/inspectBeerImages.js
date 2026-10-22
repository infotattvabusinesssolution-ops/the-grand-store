const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const beers = await Product.find({
    category: { $regex: /beer/i },
    name: { $not: { $regex: /keg|draught machine/i } }
  }).lean();
  
  console.log('Bottled beers count:', beers.length);
  beers.slice(0, 10).forEach(b => {
    console.log(`- ${b.name}: ${b.image}`);
  });

  await mongoose.disconnect();
}
check().catch(console.error);
