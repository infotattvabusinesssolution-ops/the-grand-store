const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function removeDqdq() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  console.log('Finding and deleting dqdqwdq demo product...');
  const res = await Product.deleteMany({
    $or: [
      { name: 'dqdqwdq' },
      { slug: 'dqdqwdq' },
      { brand: 'qdwqdq' },
      { image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1788276159/grandstore-uploads/mtccybuvs4fhwadbfhcu.jpg' }
    ]
  });

  console.log(`Deleted ${res.deletedCount} demo product(s).`);

  const remaining = await Product.countDocuments({
    $or: [
      { name: 'dqdqwdq' },
      { slug: 'dqdqwdq' }
    ]
  });
  console.log(`Remaining dqdqwdq in DB: ${remaining}`);

  await mongoose.disconnect();
}

removeDqdq().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
