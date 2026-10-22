const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function removeAsk40() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  console.log('Finding and deleting ask40 test product...');
  const res = await Product.deleteMany({
    $or: [
      { name: 'ask40' },
      { slug: 'ask40' },
      { brand: 'GrandStore Reserve', name: /ask40/i }
    ]
  });

  console.log(`Deleted ${res.deletedCount} ask40 product(s).`);
  await mongoose.disconnect();
}

removeAsk40().catch(console.error);
