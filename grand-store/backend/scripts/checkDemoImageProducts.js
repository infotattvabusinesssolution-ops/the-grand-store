const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const matches = await Product.find({
    $or: [
      { image: { $regex: /mtccybuvs4fhwadbfhcu/i } },
      { slug: 'dqdqwdq' },
      { name: 'dqdqwdq' }
    ]
  }).lean();
  console.log('Matches for demo image or dqdqwdq:', matches.length);
  matches.forEach(m => console.log(m.name, m.slug, m.image));
  
  await mongoose.disconnect();
}
check().catch(console.error);
