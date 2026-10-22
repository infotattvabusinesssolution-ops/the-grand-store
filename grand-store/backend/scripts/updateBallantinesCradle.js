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

const artifactDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01';

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/whisky'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/whisky')
];

async function updateBallantines(imageFilename) {
  const localImage = path.join(artifactDir, imageFilename);
  if (!fs.existsSync(localImage)) {
    throw new Error(`File does not exist: ${localImage}`);
  }

  console.log(`Processing ${imageFilename}...`);

  // 1. Copy to frontend directories
  for (const dir of targetFrontendDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dest = path.join(dir, 'ballantines-finest-blended-scotch-whisky-3l-with-cradle.jpg');
    fs.copyFileSync(localImage, dest);
    console.log(`Copied to ${dest}`);
  }

  // 2. Upload to Cloudinary
  console.log('Uploading to Cloudinary...');
  const uploadRes = await cloudinary.uploader.upload(localImage, {
    folder: 'grandstore-uploads/products/whisky',
    public_id: 'ballantines-finest-blended-scotch-whisky-3l-with-cradle',
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
        { slug: 'ballantines-finest-blended-scotch-whisky-3l-with-cradle' },
        { name: { $regex: /ballantine.*3l.*cradle/i } }
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

  // Check updated product
  const updated = await Product.findOne({ slug: 'ballantines-finest-blended-scotch-whisky-3l-with-cradle' }).lean();
  console.log('Product in DB now:', JSON.stringify({
    name: updated?.name,
    slug: updated?.slug,
    image: updated?.image
  }, null, 2));

  await mongoose.disconnect();
  console.log('All done!');
  return secureUrl;
}

if (process.argv[2]) {
  updateBallantines(process.argv[2]).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { updateBallantines };
