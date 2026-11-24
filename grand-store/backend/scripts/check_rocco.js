const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: 'd:/Grand Store/the-grand-store/grand-store/backend/.env' });

async function checkRocco() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const prods = await Product.find({ 
    $or: [
      { brand: /Rocco\s*Torro/i },
      { name: /Rocco\s*Torro/i }
    ]
  });
  console.log('Total Rocco Torro products:', prods.length);
  prods.forEach((p, idx) => {
    console.log(`\n--- [${idx + 1}] ---`);
    console.log('ID:', p._id);
    console.log('Name:', p.name);
    console.log('Slug:', p.slug);
    console.log('SKU:', p.sku || p.id);
    console.log('Brand:', p.brand);
    console.log('Category:', p.category);
    console.log('Subcategory:', p.subcategory);
    console.log('Description:', p.description);
    console.log('Price:', p.price);
    console.log('Image:', p.image);
    console.log('OriginalImage:', p.originalImage);
    console.log('Gallery:', p.gallery);
  });
  await mongoose.disconnect();
}
checkRocco();
