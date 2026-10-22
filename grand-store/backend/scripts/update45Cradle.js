const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function update45() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const cradleUrl = 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792583112/grandstore-uploads/products/whisky/ballantines-finest-blended-scotch-whisky-3l-with-cradle.jpg';
  
  await Product.updateMany(
    { slug: 'ballantines-original-extra-large-45l-gallon-cradle' },
    { $set: { image: cradleUrl, updatedAt: new Date() } }
  );

  const cradles = await Product.find({
    name: { $regex: /cradle/i }
  }, { name: 1, slug: 1, image: 1 }).lean();

  console.log('Cradle products in DB:');
  cradles.forEach(p => console.log(JSON.stringify(p, null, 2)));

  await mongoose.disconnect();
}
update45().catch(console.error);
