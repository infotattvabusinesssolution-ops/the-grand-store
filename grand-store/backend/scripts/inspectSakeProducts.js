const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB.');

  const query = {
    $or: [
      { category: { $regex: /sake/i } },
      { subcategory: { $regex: /sake/i } },
      { name: { $regex: /sake/i } },
      { type: { $regex: /sake/i } }
    ]
  };

  const products = await Product.find(query).lean();
  console.log(`Found ${products.length} products matching Sake in database:`);

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    console.log(`\n--- [${i + 1}] ID: ${p.id || p._id} ---`);
    console.log(`Name:        ${p.name}`);
    console.log(`Slug:        ${p.slug}`);
    console.log(`Brand:       ${p.brand}`);
    console.log(`Category:    ${p.category}`);
    console.log(`Subcategory: ${p.subcategory}`);
    console.log(`Price:       R ${p.price}`);
    console.log(`Image:       ${p.image}`);
    console.log(`OrigImage:   ${p.originalImage}`);
    console.log(`Gallery:     ${JSON.stringify(p.gallery)}`);
    console.log(`Description: ${p.description ? p.description.substring(0, 150) + '...' : 'N/A'}`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
