require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const Product = require('../models/Product');

async function updateGallery() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const chardonnay = await Product.findOne({ slug: 'tesselaarsdal-chardonnay-2024' });
  if (chardonnay) {
    chardonnay.gallery = [chardonnay.image];
    chardonnay.originalImage = chardonnay.image;
    chardonnay.markModified('gallery');
    await chardonnay.save();
    console.log('✅ Updated Chardonnay 2024 gallery to only contain bottle image.');
  }

  const pinot = await Product.findOne({ slug: 'tesselaarsdal-pinot-noir-2024' });
  if (pinot) {
    pinot.gallery = [pinot.image];
    pinot.originalImage = pinot.image;
    pinot.markModified('gallery');
    await pinot.save();
    console.log('✅ Updated Pinot Noir 2024 gallery to only contain bottle image.');
  }

  // Also check if any other product has the candlelight or tasting images in gallery
  const otherWithCandle = await Product.find({
    gallery: {
      $in: [
        'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165581/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_bottles_candlelight.jpg',
        'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165580/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_wine_pour_tasting.jpg'
      ]
    }
  });

  for (const prod of otherWithCandle) {
    prod.gallery = [prod.image];
    prod.markModified('gallery');
    await prod.save();
    console.log(`✅ Cleaned gallery for ${prod.name}`);
  }

  // Verify
  const updated = await Product.find({ slug: { $in: ['tesselaarsdal-chardonnay-2024', 'tesselaarsdal-pinot-noir-2024'] } }).select('name slug image gallery');
  console.log('Updated records:\n', JSON.stringify(updated, null, 2));

  await mongoose.disconnect();
  console.log('Done!');
}

updateGallery().catch(err => {
  console.error(err);
  process.exit(1);
});
