const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const slugs = [
    'ballantines-21-year-old-blended-scotch-whisky-750ml',
    'jack-daniels-single-barrel-rye-green-label-750ml',
    'dimple-15-year-old-blended-scotch-whisky-750ml',
    'dassai-45-junmai-daiginjo-sake-720ml',
    'ballantines-hard-fired-blended-scotch-whisky-1l',
    'gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml'
  ];
  const items = await Product.find({
    $or: [
      { slug: { $in: slugs } },
      { name: { $regex: /(ballantine|dimple|dassai|gentleman|single barrel)/i } }
    ]
  }).select('id name slug image barcode price').lean();
  console.log(JSON.stringify(items, null, 2));
  await mongoose.disconnect();
}
check();
