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

const productsToUpdate = [
  {
    name: 'Fenjiu Qinghua 20 Year Old Baijiu 500ml',
    slugs: ['fenjiu-qinghua-20-year-old-baijiu-500ml', 'fenjiu-qinghua-blue-flower-20-years-old-baijiu-500ml'],
    nameRegex: /fenjiu.*qinghua/i,
    localSource: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/fenjiu_qinghua_smooth_black_1792655532127.jpg',
    filename: 'fenjiu-qinghua-20-year-old.jpg',
    publicId: 'fenjiu-qinghua-20-year-old'
  },
  {
    name: 'Fen Jiu Red Label (Fen Chiew) Baijiu 500ml',
    slugs: ['fen-jiu-red-label-fen-chiew-baijiu-500ml', 'fen-jiu-red-label-light-aroma-baijiu-500ml'],
    nameRegex: /fen\s*jiu.*red\s*label/i,
    localSource: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/fen_jiu_red_label_different_black_1792655566891.jpg',
    filename: 'fen-jiu-red-label-fen-chiew.jpg',
    publicId: 'fen-jiu-red-label-fen-chiew'
  },
  {
    name: 'Guizhou XIJIU Friends Series Baijiu (Blue Bottle) 500ml',
    slugs: ['guizhou-xijiu-friends-series-baijiu-blue-bottle-500ml', 'guizhou-xijiu-friends-series-season-baijiu-blue-bottle'],
    nameRegex: /xijiu.*blue/i,
    localSource: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/guizhou_xijiu_different_black_1792655608075.jpg',
    filename: 'guizhou-xijiu-friends-series-blue-bottle.jpg',
    publicId: 'guizhou-xijiu-friends-series-blue-bottle'
  }
];

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/baijiu'),
  path.resolve(__dirname, '../../frontend/dist/assets/products/baijiu'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/baijiu')
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  for (const item of productsToUpdate) {
    console.log(`\n========================================`);
    console.log(`Processing: ${item.name}`);

    if (!fs.existsSync(item.localSource)) {
      throw new Error(`File does not exist: ${item.localSource}`);
    }

    // 1. Copy to frontend directories
    for (const dir of targetFrontendDirs) {
      if (fs.existsSync(path.dirname(dir))) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const dest = path.join(dir, item.filename);
        fs.copyFileSync(item.localSource, dest);
        console.log(`Copied to ${dest}`);
      }
    }

    // 2. Upload to Cloudinary with overwrite: true
    console.log(`Uploading to Cloudinary: grandstore-uploads/products/baijiu/${item.publicId}`);
    const uploadRes = await cloudinary.uploader.upload(item.localSource, {
      folder: 'grandstore-uploads/products/baijiu',
      public_id: item.publicId,
      overwrite: true,
      resource_type: 'image'
    });
    const secureUrl = uploadRes.secure_url;
    console.log(`Uploaded Cloudinary URL: ${secureUrl}`);

    // 3. Update MongoDB
    const filter = {
      $or: [
        { slug: { $in: item.slugs } },
        { name: item.nameRegex }
      ]
    };

    const updateRes = await Product.updateMany(filter, {
      $set: {
        image: secureUrl,
        originalImage: secureUrl,
        gallery: [secureUrl],
        updatedAt: new Date()
      }
    });
    console.log(`Updated DB: matched ${updateRes.matchedCount}, modified ${updateRes.modifiedCount}`);

    const verified = await Product.find(filter, { name: 1, slug: 1, image: 1 }).lean();
    verified.forEach(p => console.log(` Verified DB record: ${p.name} -> ${p.image}`));
  }

  await mongoose.disconnect();
  console.log('\nAll Baijiu products updated successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
