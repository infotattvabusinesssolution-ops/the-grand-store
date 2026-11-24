const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/Product');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

const roccoProductsConfig = [
  {
    prodId: 'rt-100-agave-blanco-750',
    slug: 'rocco-torro-100-percent-agave-blanco-750ml',
    filename: 'rocco-torro-blanco.png',
    publicId: 'rocco-torro-blanco'
  },
  {
    prodId: 'rt-100-agave-reposado-french-oak-750',
    slug: 'rocco-torro-100-percent-agave-reposado-french-oak-750ml',
    filename: 'rocco-torro-reposado-french-oak.png',
    publicId: 'rocco-torro-reposado-french-oak'
  },
  {
    prodId: 'rt-100-agave-reposado-american-oak-750',
    slug: 'rocco-torro-100-percent-agave-reposado-american-oak-750ml',
    filename: 'rocco-torro-reposado-american-oak.png',
    publicId: 'rocco-torro-reposado-american-oak'
  },
  {
    prodId: 'rt-crafted-blend-gold-750',
    slug: 'rocco-torro-crafted-blend-gold-750ml',
    filename: 'rocco-torro-gold.png',
    publicId: 'rocco-torro-gold'
  },
  {
    prodId: 'rt-crafted-blend-silver-750',
    slug: 'rocco-torro-crafted-blend-silver-750ml',
    filename: 'rocco-torro-silver.png',
    publicId: 'rocco-torro-silver'
  },
  {
    prodId: 'rt-crafted-blend-white-chocolate-750',
    slug: 'rocco-torro-crafted-blend-white-chocolate-750ml',
    filename: 'rocco-torro-white-chocolate.png',
    publicId: 'rocco-torro-white-chocolate'
  }
];

function uploadToCloudinary(filePath, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: 'grandstore-uploads/products',
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        resource_type: 'image'
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB successfully.');

  const assetsDir = path.resolve(__dirname, '../../frontend/public/assets/products');

  console.log('\n--- Current Rocco Torro Products in Database ---');
  const existing = await Product.find({ brand: /rocco torro/i });
  console.log(`Found ${existing.length} Rocco Torro products.`);
  for (const p of existing) {
    console.log(`- [${p.id || p._id}] ${p.name}`);
    console.log(`    Slug: ${p.slug}`);
    console.log(`    Current Image: ${p.image}`);
  }

  console.log('\n--- Uploading PNGs to Cloudinary & Updating DB ---');
  const uploadResults = {};

  for (const item of roccoProductsConfig) {
    const fullPath = path.join(assetsDir, item.filename);
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      continue;
    }

    console.log(`Uploading ${item.filename} (public_id: ${item.publicId})...`);
    const res = await uploadToCloudinary(fullPath, item.publicId);
    console.log(`  -> Secure URL: ${res.secure_url} (format: ${res.format}, ${res.width}x${res.height})`);
    uploadResults[item.prodId] = res.secure_url;

    // Update product by id or slug or regex name
    const updateRes = await Product.updateMany(
      {
        $or: [
          { id: item.prodId },
          { slug: item.slug },
          { image: new RegExp(item.publicId, 'i') }
        ]
      },
      {
        $set: {
          image: res.secure_url,
          originalImage: res.secure_url,
          gallery: [res.secure_url, res.secure_url]
        }
      }
    );
    console.log(`  -> Updated in DB: matched ${updateRes.matchedCount}, modified ${updateRes.modifiedCount}`);
  }

  console.log('\n--- Verification: Checking DB values ---');
  const verified = await Product.find({ brand: /rocco torro/i });
  for (const p of verified) {
    console.log(`Verified [${p.id}]: ${p.name}`);
    console.log(`  Image: ${p.image}`);
  }

  const manifestPath = path.join(__dirname, 'rocco_torro_cloudinary_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(uploadResults, null, 2));
  console.log(`\nSaved manifest to ${manifestPath}`);

  await mongoose.disconnect();
  console.log('MongoDB disconnected cleanly.');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
