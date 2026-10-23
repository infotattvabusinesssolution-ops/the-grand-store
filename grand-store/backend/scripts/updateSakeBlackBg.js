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

const sakeProducts = [
  {
    name: 'Gekkeikan Traditional Junmai-shu Sake 720ml',
    slugs: ['gekkeikan-traditional-junmai-shu-sake-720ml'],
    nameRegex: /gekkeikan.*traditional/i,
    localSource: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/gekkeikan_traditional_black_1792656447592.jpg',
    filename: 'gekkeikan-traditional-junmai-sake-720ml.jpg',
    publicId: 'gekkeikan-traditional-junmai-sake-720ml'
  },
  {
    name: 'Dassai 45 Junmai Daiginjo Sake 720ml',
    slugs: ['dassai-45-junmai-daiginjo-sake-720ml'],
    nameRegex: /dassai\s*45/i,
    localSource: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/dassai_45_black_1792656485903.jpg',
    filename: 'dassai-45-junmai-daiginjo-sake-720ml.jpg',
    publicId: 'dassai-45-junmai-daiginjo-sake-720ml'
  },
  {
    name: 'Gold Gekkeikan Junmai-shu Sake with Gold Leaf 720ml',
    slugs: ['gold-gekkeikan-junmai-shu-sake-with-gold-leaf-720ml', 'gold-gekkeikan-traditional-junmai-shu-sake-720ml'],
    nameRegex: /gold\s*gekkeikan/i,
    localSource: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/gold_gekkeikan_black_1792656529096.jpg',
    filename: 'gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.jpg',
    publicId: 'gold-gekkeikan-junmai-sake-with-gold-leaf-720ml'
  },
  {
    name: 'Super Kinokuni Junmai Sake 720ml',
    slugs: ['super-kinokuni-junmai-sake-720ml'],
    nameRegex: /kinokuni/i,
    localSource: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/super_kinokuni_black_1792656575825.jpg',
    filename: 'super-kinokuni-junmai-sake-720ml.jpg',
    publicId: 'super-kinokuni-junmai-sake-720ml'
  },
  {
    name: 'Dassai 23 Junmai Daiginjo Super Premium Sake 720ml',
    slugs: ['dassai-23-junmai-daiginjo-super-premium-sake-720ml'],
    nameRegex: /dassai\s*23/i,
    localSource: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/dassai_23_black_1792656649676.jpg',
    filename: 'dassai-23-junmai-daiginjo-super-premium-sake-720ml.jpg',
    publicId: 'dassai-23-junmai-daiginjo-super-premium-sake-720ml'
  }
];

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/sake'),
  path.resolve(__dirname, '../../frontend/dist/assets/products/sake'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/sake')
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  for (const item of sakeProducts) {
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
    console.log(`Uploading to Cloudinary: grandstore-uploads/products/sake/${item.publicId}`);
    const uploadRes = await cloudinary.uploader.upload(item.localSource, {
      folder: 'grandstore-uploads/products/sake',
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
  console.log('\nAll 5 Sake products updated successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
