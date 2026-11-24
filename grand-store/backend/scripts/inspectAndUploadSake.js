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

const sakeConfig = [
  {
    id: "ws_1791979598166_99",
    slug: "dassai-23-junmai-daiginjo-super-premium-sake-720ml",
    filename: "dassai-23-junmai-daiginjo-super-premium-sake-720ml.png",
    publicId: "dassai-23-junmai-daiginjo-super-premium-sake-720ml"
  },
  {
    id: "ws-dassai-45-sake",
    slug: "dassai-45-junmai-daiginjo-sake-720ml",
    filename: "dassai-45-junmai-daiginjo-sake-720ml.png",
    publicId: "dassai-45-junmai-daiginjo-sake-720ml"
  },
  {
    id: "ws_1791979598070_213",
    slug: "super-kinokuni-junmai-sake-720ml",
    filename: "super-kinokuni-junmai-sake-720ml.png",
    publicId: "super-kinokuni-junmai-sake-720ml"
  },
  {
    id: "ws_1791979597879_57",
    slug: "gold-gekkeikan-junmai-shu-sake-with-gold-leaf-720ml",
    filename: "gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.png",
    publicId: "gold-gekkeikan-junmai-sake-with-gold-leaf-720ml"
  },
  {
    id: "ws-gekkeikan-gold-sake",
    slug: "gekkeikan-traditional-junmai-shu-sake-720ml",
    filename: "gekkeikan-traditional-junmai-sake-720ml.png",
    publicId: "gekkeikan-traditional-junmai-sake-720ml"
  }
];

function uploadFile(filePath, folder, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: folder,
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
  console.log('Connected to MongoDB.');

  const assetsDir = path.resolve(__dirname, '../../frontend/public/assets/products/sake');
  const manifest = {};

  for (const item of sakeConfig) {
    const fullPath = path.join(assetsDir, item.filename);
    if (!fs.existsSync(fullPath)) {
      console.error(`File missing: ${fullPath}`);
      continue;
    }

    console.log(`\nUploading ${item.filename}...`);
    // 1. Upload to grandstore-uploads/products/sake
    const primaryRes = await uploadFile(fullPath, 'grandstore-uploads/products/sake', item.publicId);
    console.log(`  -> Primary URL: ${primaryRes.secure_url} (${primaryRes.format}, ${primaryRes.width}x${primaryRes.height})`);

    // 2. Also overwrite catalog-originals/sake to ensure backwards compatibility
    try {
      await uploadFile(fullPath, 'grand-store/catalog-originals/sake', item.publicId);
      console.log(`  -> Legacy catalog-originals overwritten successfully.`);
    } catch (e) {
      console.warn(`  -> Legacy overwrite warning:`, e.message);
    }

    manifest[item.id] = {
      name: item.slug,
      url: primaryRes.secure_url
    };

    // Update in MongoDB
    const updateRes = await Product.updateMany(
      {
        $or: [
          { id: item.id },
          { slug: item.slug }
        ]
      },
      {
        $set: {
          image: primaryRes.secure_url,
          originalImage: primaryRes.secure_url,
          gallery: [primaryRes.secure_url, primaryRes.secure_url]
        }
      }
    );
    console.log(`  -> DB updated: matched ${updateRes.matchedCount}, modified ${updateRes.modifiedCount}`);
  }

  const manifestPath = path.join(__dirname, 'sake_cloudinary_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved to ${manifestPath}`);

  // Verification
  console.log('\n--- Verification from DB ---');
  const verified = await Product.find({ category: /sake/i });
  for (const p of verified) {
    console.log(`Verified [${p.id}]: ${p.name}`);
    console.log(`  Image: ${p.image}`);
  }

  await mongoose.disconnect();
  console.log('MongoDB disconnected cleanly.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
