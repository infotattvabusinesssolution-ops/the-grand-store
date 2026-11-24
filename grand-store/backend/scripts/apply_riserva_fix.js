const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: 'd:/Grand Store/the-grand-store/grand-store/backend/.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

async function uploadToCloudinary(filePath, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      folder: 'grandstore-uploads/products/dogliotti-1870',
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: 'image'
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

async function updateAll() {
  const sourceImage = 'C:/Users/HP/.gemini/antigravity/brain/b282b627-b706-4104-8a7e-d0ae198cf4f8/ultra_clear_riserva.png';

  // 1. Copy to local asset paths
  const localDestinations = [
    'd:/Grand Store/the-grand-store/grand-store/frontend/public/assets/products/dogliotti-1870/dogliotti-alta-langa-riserva-docg-2020.png',
    'd:/Grand Store/the-grand-store/grand-store/frontend/public/assets/products/dogliotti-1870/dogliotti-alta-langa-riserva-single-box.png',
    'd:/Grand Store/the-grand-store/grand-storelocal/frontend/public/assets/products/dogliotti-1870/dogliotti-alta-langa-riserva-docg-2020.png',
    'd:/Grand Store/the-grand-store/grand-storelocal/frontend/public/assets/products/dogliotti-1870/dogliotti-alta-langa-riserva-single-box.png',
    'd:/Grand Store/the-grand-store/grand-store/frontend/dist/assets/products/dogliotti-1870/dogliotti-alta-langa-riserva-docg-2020.png',
    'd:/Grand Store/the-grand-store/grand-store/frontend/dist/assets/products/dogliotti-1870/dogliotti-alta-langa-riserva-single-box.png'
  ];

  for (const dest of localDestinations) {
    const dir = path.dirname(dest);
    if (fs.existsSync(dir)) {
      fs.copyFileSync(sourceImage, dest);
      console.log('Copied to:', dest);
    }
  }

  // 2. Upload to Cloudinary with cache invalidation
  console.log('\nUploading to Cloudinary...');
  const res1 = await uploadToCloudinary(sourceImage, 'dogliotti-alta-langa-riserva-docg-2020');
  console.log('Cloudinary Riserva URL:', res1.secure_url);

  const res2 = await uploadToCloudinary(sourceImage, 'dogliotti-alta-langa-riserva-single-box');
  console.log('Cloudinary Single Box URL:', res2.secure_url);

  // 3. Update MongoDB Atlas
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  const prod1 = await Product.findOneAndUpdate(
    { name: 'Dogliotti 1870 Alta Langa Riserva Docg 2020' },
    {
      $set: {
        image: res1.secure_url,
        originalImage: res1.secure_url,
        gallery: [res1.secure_url]
      }
    },
    { new: true }
  );
  console.log('Updated DB Product 1:', prod1.name, '->', prod1.image);

  const prod2 = await Product.findOneAndUpdate(
    { name: 'Dogliotti 1870 Alta Langa Riserva Docg 2020 (With Gift Box)' },
    {
      $set: {
        image: res2.secure_url,
        originalImage: res2.secure_url,
        gallery: [res2.secure_url]
      }
    },
    { new: true }
  );
  console.log('Updated DB Product 2:', prod2?.name, '->', prod2?.image);

  await mongoose.disconnect();
  console.log('\nAll updates completed successfully!');
}

updateAll().catch(err => {
  console.error('Update failed:', err);
  process.exit(1);
});
