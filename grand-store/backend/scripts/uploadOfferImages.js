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

const imagesToProcess = [
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/ballantines_21_scotch_1792576354493.jpg',
    publicId: 'ballantines-21-year-old-blended-scotch-whisky-750ml',
    filename: 'ballantines-21-year-old-blended-scotch-whisky-750ml.jpg',
    query: { $or: [{ id: 'ws-ballantines-21' }, { slug: 'ballantines-21-year-old-blended-scotch-whisky-750ml' }] }
  },
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/jd_single_barrel_rye_1792576379765.jpg',
    publicId: 'jack-daniels-single-barrel-rye-green-label-750ml',
    filename: 'jack-daniels-single-barrel-rye-green-label-750ml.jpg',
    query: { $or: [{ id: 'ws-jack-daniels-single-barrel-rye' }, { slug: { $regex: /jack-daniels-single-barrel-rye/i } }] }
  },
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/dimple_15_scotch_whisky_1792576429796.jpg',
    publicId: 'dimple-15-year-old-de-luxe-scotch-whisky-750ml',
    filename: 'dimple-15-year-old-de-luxe-scotch-whisky-750ml.jpg',
    query: { $or: [{ id: 'ws-dimple-15-blended-scotch' }, { slug: { $regex: /dimple-15-year-old/i } }] }
  },
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/ballantines_hard_fired_whisky_1792576449135.jpg',
    publicId: 'ballantines-hard-fired-blended-scotch-whisky-1l',
    filename: 'ballantines-hard-fired-blended-scotch-whisky-1l.jpg',
    query: { $or: [{ id: 'ws-ballantines-hardfired' }, { slug: 'ballantines-hard-fired-blended-scotch-whisky-1l' }] }
  },
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/gentleman_jack_whiskey_1792576471572.jpg',
    publicId: 'gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml',
    filename: 'gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml.jpg',
    query: { $or: [{ id: 'ws-jack-daniels-gentleman-jack' }, { slug: { $regex: /gentleman-jack/i } }] }
  }
];

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/offers'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/offers')
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  // Create public assets directories if not exists
  for (const dir of targetFrontendDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const uploadedUrls = {};

  for (const item of imagesToProcess) {
    console.log(`\nProcessing ${item.publicId}...`);
    if (!fs.existsSync(item.localFile)) {
      console.error(`File does not exist: ${item.localFile}`);
      continue;
    }

    // 1. Copy to local frontend assets
    for (const dir of targetFrontendDirs) {
      const dest = path.join(dir, item.filename);
      fs.copyFileSync(item.localFile, dest);
      console.log(`Copied to ${dest}`);
    }

    // 2. Upload to Cloudinary
    console.log(`Uploading to Cloudinary: grandstore-uploads/products/offers/${item.publicId}`);
    const uploadRes = await cloudinary.uploader.upload(item.localFile, {
      folder: 'grandstore-uploads/products/offers',
      public_id: item.publicId,
      overwrite: true,
      resource_type: 'image'
    });

    const secureUrl = uploadRes.secure_url;
    console.log(`Uploaded Cloudinary URL: ${secureUrl}`);
    uploadedUrls[item.publicId] = secureUrl;

    // 3. Update DB products
    const updateRes = await Product.updateMany(item.query, {
      $set: {
        image: secureUrl,
        updatedAt: new Date()
      }
    });
    console.log(`Updated DB: matched ${updateRes.matchedCount}, modified ${updateRes.modifiedCount}`);
  }

  // Also ensure Dassai 45 points to the authentic Dassai 45 Cloudinary image
  const dassai45Url = 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792570282/grandstore-uploads/products/sake/dassai-45-junmai-daiginjo-sake-720ml.jpg';
  const dassaiRes = await Product.updateMany(
    { $or: [{ id: 'ws-dassai-45-sake' }, { slug: 'dassai-45-junmai-daiginjo-sake-720ml' }] },
    { $set: { image: dassai45Url, barcode: '4935819140450', updatedAt: new Date() } }
  );
  console.log(`Updated Dassai 45 DB: matched ${dassaiRes.matchedCount}, modified ${dassaiRes.modifiedCount}`);

  console.log('\nAll done! Uploaded URLs:');
  console.log(JSON.stringify(uploadedUrls, null, 2));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
