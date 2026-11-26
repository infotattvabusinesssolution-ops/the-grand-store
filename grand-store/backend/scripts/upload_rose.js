const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

async function main() {
  const file = 'd:/Grand Store/scratch/dogliotti_rose_transparent.png';
  console.log('Uploading dogliotti_rose_transparent.png to Cloudinary...');
  
  const uploadRes = await cloudinary.uploader.upload(file, {
    folder: 'grandstore-uploads/products/dogliotti-1870',
    public_id: 'dogliotti-alta-langa-rose-docg',
    overwrite: true,
    invalidate: true,
    resource_type: 'image'
  });

  console.log('Cloudinary Upload Success!');
  console.log('Secure URL:', uploadRes.secure_url);
  console.log('Version:', uploadRes.version);

  // Connect to MongoDB and update Product
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected.');

  const updatedUrl = uploadRes.secure_url;
  const updateResult = await Product.updateMany(
    { name: /Alta Langa Ros/i },
    {
      $set: {
        image: updatedUrl,
        imageUrl: updatedUrl,
        originalImage: updatedUrl,
        gallery: [updatedUrl]
      }
    }
  );

  console.log('MongoDB update result:', updateResult);

  // Verify
  const p = await Product.findOne({ name: /Alta Langa Ros/i });
  console.log('Verified Product in DB:', p ? { name: p.name, image: p.image } : 'Not found');

  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
