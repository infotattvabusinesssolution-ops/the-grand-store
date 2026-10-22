const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const all = await Product.find({}).lean();
  const valid = all
    .filter(p => p.slug !== 'dqdqwdq' && !p.name.includes('dqdq'))
    .filter(p => !p.vendorId || p.approvalStatus === 'approved')
    .filter(p => String(p.category || p.type || '').toLowerCase() !== 'accessories')
    .sort((a, b) => {
      const first = new Date(a.createdAt || a.updatedAt || 0).getTime() || 0;
      const second = new Date(b.createdAt || b.updatedAt || 0).getTime() || 0;
      return second - first;
    });

  const beerMatches = valid.filter(p => {
    const c = String(p.category || p.type || '').toLowerCase();
    return c.includes('beer') || c.includes('cider');
  });

  console.log('Top 5 beer matches when dqdqwdq is deleted:');
  beerMatches.slice(0, 5).forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.category}] ${p.name} - Brand: ${p.brand} - Image: ${p.image}`);
  });

  await mongoose.disconnect();
}
check().catch(console.error);
