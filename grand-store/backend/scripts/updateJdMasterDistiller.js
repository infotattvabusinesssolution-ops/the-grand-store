const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

const localImage = 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/jd_master_distiller_no5_1792585321445.jpg';

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/whisky'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/whisky')
];

async function run() {
  if (!fs.existsSync(localImage)) {
    throw new Error(`File does not exist: ${localImage}`);
  }

  // 1. Copy to frontend directories
  for (const dir of targetFrontendDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dest = path.join(dir, 'jack-daniels-master-distiller-series-no-5-1l.jpg');
    fs.copyFileSync(localImage, dest);
    console.log(`Copied to ${dest}`);
  }

  // 2. Upload to Cloudinary
  console.log('Uploading to Cloudinary...');
  const uploadRes = await cloudinary.uploader.upload(localImage, {
    folder: 'grandstore-uploads/products/whisky',
    public_id: 'jack-daniels-master-distiller-series-no-5-1l',
    overwrite: true,
    resource_type: 'image'
  });
  const secureUrl = uploadRes.secure_url;
  console.log(`Uploaded Cloudinary URL: ${secureUrl}`);

  // 3. Update MongoDB
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  const res = await Product.updateMany(
    {
      $or: [
        { slug: 'jack-daniels-master-distiller-series-no-5-1l' },
        { slug: 'jack-daniels-master-distiller-no-5-tennessee-whiskey-750ml' },
        { name: { $regex: /master distiller.*no\.?\s*5/i } }
      ]
    },
    {
      $set: {
        image: secureUrl,
        updatedAt: new Date()
      }
    }
  );
  console.log(`Updated DB: matched ${res.matchedCount}, modified ${res.modifiedCount}`);

  const updatedProducts = await Product.find({
    name: { $regex: /master distiller/i }
  }, { name: 1, slug: 1, image: 1 }).lean();

  console.log('\nMaster Distiller products in DB:');
  updatedProducts.forEach(p => console.log(JSON.stringify(p, null, 2)));

  await mongoose.disconnect();
  console.log('Done!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
