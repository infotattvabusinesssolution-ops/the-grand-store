const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function findAndDeleteDemo() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const demoItems = await Product.find({
    $or: [
      { name: { $regex: /(demo|test product)/i } },
      { slug: { $regex: /(demo|test-product)/i } },
      { brand: { $regex: /^jodi$/i } }
    ]
  }).lean();
  
  console.log('Found demo products count:', demoItems.length);
  demoItems.forEach(item => {
    console.log(`To delete: ${item._id} | ${item.name} | slug: ${item.slug} | price: ${item.price}`);
  });

  if (demoItems.length > 0) {
    const idsToDelete = demoItems.map(d => d._id);
    const deleteRes = await Product.deleteMany({ _id: { $in: idsToDelete } });
    console.log(`Deleted ${deleteRes.deletedCount} demo products from MongoDB.`);
  }

  await mongoose.disconnect();
}
findAndDeleteDemo().catch(console.error);
