require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

async function cleanLautusGallery() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  // Update Savvy White
  const res1 = await Product.updateOne(
    { slug: 'lautus-savvy-white-750ml' },
    {
      $set: {
        gallery: ['https://res.cloudinary.com/oioqrgj0/image/upload/v1793274055/grand-store/products/wine-grandstore/lautus-savvy-white-750ml.png'],
        originalImage: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793274055/grand-store/products/wine-grandstore/lautus-savvy-white-750ml.png'
      }
    }
  );
  console.log('Savvy White update result:', res1);

  // Update Sparkling White
  const res2 = await Product.updateOne(
    { slug: 'lautus-sparkling-white-750ml' },
    {
      $set: {
        gallery: ['https://res.cloudinary.com/oioqrgj0/image/upload/v1793274056/grand-store/products/wine-grandstore/lautus-sparkling-white-750ml.png'],
        originalImage: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793274056/grand-store/products/wine-grandstore/lautus-sparkling-white-750ml.png'
      }
    }
  );
  console.log('Sparkling White update result:', res2);

  // Verify
  const list = await Product.find({
    slug: { $in: ['lautus-savvy-white-750ml', 'lautus-sparkling-white-750ml'] }
  }).lean();

  list.forEach(p => {
    console.log(`\nProduct: ${p.name}`);
    console.log(`Image: ${p.image}`);
    console.log(`Gallery (${p.gallery.length} items):`, p.gallery);
    console.log(`OriginalImage: ${p.originalImage}`);
  });

  await mongoose.disconnect();
  console.log('\nDone!');
}

cleanLautusGallery().catch(err => {
  console.error(err);
  process.exit(1);
});
