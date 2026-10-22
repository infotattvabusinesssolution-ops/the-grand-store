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

const localImage = 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/dimple_15_scotch_whisky_1792576429796.jpg';

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/whisky'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/whisky')
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  // 1. Remove Aska 40 and test products
  console.log('\n--- 1. Removing Aska 40 products ---');
  const deleteRes = await Product.deleteMany({
    $or: [
      { name: { $regex: /aska/i } },
      { slug: { $regex: /aska/i } },
      { brand: { $regex: /aska/i } }
    ]
  });
  console.log(`Deleted ${deleteRes.deletedCount} products matching aska.`);

  // 2. Prepare local frontend assets
  console.log('\n--- 2. Copying Dimple 3L image to local frontend assets ---');
  for (const dir of targetFrontendDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const dest = path.join(dir, 'dimple-3l-1970-rare-heritage-collector-limited-edition.jpg');
    fs.copyFileSync(localImage, dest);
    console.log(`Copied image to ${dest}`);
  }

  // 3. Upload Dimple 3L image to Cloudinary
  console.log('\n--- 3. Uploading Dimple 3L image to Cloudinary ---');
  const uploadRes = await cloudinary.uploader.upload(localImage, {
    folder: 'grandstore-uploads/products/whisky',
    public_id: 'dimple-3l-1970-rare-heritage-collector-limited-edition',
    overwrite: true,
    resource_type: 'image'
  });
  const secureUrl = uploadRes.secure_url;
  console.log(`Uploaded Cloudinary URL: ${secureUrl}`);

  // 4. Update Dimple 3L product in MongoDB
  console.log('\n--- 4. Updating Dimple 3L product in MongoDB ---');
  const updateRes = await Product.updateMany(
    {
      $or: [
        { slug: 'dimple-3l-1970-rare-heritage-collector-limited-edition' },
        { name: { $regex: /Dimple 3L 1970/i } }
      ]
    },
    {
      $set: {
        image: secureUrl,
        updatedAt: new Date()
      }
    }
  );
  console.log(`Updated Dimple 3L: matched ${updateRes.matchedCount}, modified ${updateRes.modifiedCount}`);

  // Also check if any other Dimple still has the Jack Daniel's unsplash image
  const otherJackDanielsDimple = await Product.find({
    name: { $regex: /dimple/i },
    image: { $regex: /photo-1527281400683/i }
  }).lean();
  if (otherJackDanielsDimple.length > 0) {
    console.log(`Found ${otherJackDanielsDimple.length} other Dimple products with Jack Daniel's unsplash image. Updating them.`);
    await Product.updateMany(
      {
        name: { $regex: /dimple/i },
        image: { $regex: /photo-1527281400683/i }
      },
      {
        $set: {
          image: secureUrl,
          updatedAt: new Date()
        }
      }
    );
  }

  // 5. Verification
  console.log('\n--- 5. Verification ---');
  const remainingAska = await Product.countDocuments({
    $or: [
      { name: { $regex: /aska/i } },
      { slug: { $regex: /aska/i } },
      { brand: { $regex: /aska/i } }
    ]
  });
  console.log(`Remaining Aska products: ${remainingAska}`);

  const updatedDimple3L = await Product.findOne({
    slug: 'dimple-3l-1970-rare-heritage-collector-limited-edition'
  }).lean();
  console.log('Updated Dimple 3L in DB:', JSON.stringify({
    name: updatedDimple3L?.name,
    slug: updatedDimple3L?.slug,
    image: updatedDimple3L?.image
  }, null, 2));

  await mongoose.disconnect();
  console.log('\nDone successfully!');
}

run().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
