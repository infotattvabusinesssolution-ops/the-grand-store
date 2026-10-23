const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkDimple() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  
  const dimples = await Product.find({
    $or: [
      { brand: /Dimple/i },
      { name: /Dimple/i },
      { slug: /dimple/i }
    ]
  }).lean();

  console.log('Total Dimple products found:', dimples.length);
  dimples.forEach((d, i) => {
    console.log(`\n================ ${i+1}. ${d.name} ================`);
    console.log('ID:', d._id, 'id:', d.id);
    console.log('Slug:', d.slug);
    console.log('Brand:', d.brand);
    console.log('Category:', d.category, 'Subcategory:', d.subcategory);
    console.log('Price:', d.price, 'Size:', d.size);
    console.log('Image:', d.image);
    console.log('Gallery:', d.gallery);
    console.log('Description:', d.description);
    console.log('TastingNotes:', d.tastingNotes);
  });

  await mongoose.disconnect();
}
checkDimple().catch(console.error);
