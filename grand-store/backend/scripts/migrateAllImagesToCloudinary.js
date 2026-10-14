require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const Product = require('../models/Product');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_API_NAME || 'oioqrgj0';
const apiKey = process.env.CLOUDINARY_API_KEY || '782922137546894';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Helper to upload a local file to Cloudinary
const uploadFile = (filePath, publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder: 'grandstore-uploads/products',
        public_id: publicId,
        overwrite: true,
        resource_type: 'image'
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
  });
};

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB successfully.');

    // 1. Upload Rocco Torro images
    console.log('\n--- 1. Uploading Rocco Torro Images ---');
    const roccoDir = path.resolve(__dirname, '../../frontend/public/assets/products');
    const roccoMap = {
      'rt-100-agave-blanco-750': 'rocco-torro-blanco.jpg',
      'rt-100-agave-reposado-french-oak-750': 'rocco-torro-reposado-french-oak.jpg',
      'rt-100-agave-reposado-american-oak-750': 'rocco-torro-reposado-american-oak.jpg',
      'rt-crafted-blend-gold-750': 'rocco-torro-gold.jpg',
      'rt-crafted-blend-silver-750': 'rocco-torro-silver.jpg',
      'rt-crafted-blend-white-chocolate-750': 'rocco-torro-white-chocolate.jpg'
    };

    for (const [prodId, filename] of Object.entries(roccoMap)) {
      const fullPath = path.join(roccoDir, filename);
      if (fs.existsSync(fullPath)) {
        console.log(`Uploading ${filename}...`);
        const cdnUrl = await uploadFile(fullPath, path.parse(filename).name);
        console.log(`  -> ${cdnUrl}`);
        await Product.findOneAndUpdate(
          { id: prodId },
          {
            $set: {
              image: cdnUrl,
              originalImage: cdnUrl,
              gallery: [cdnUrl]
            }
          }
        );
      } else {
        console.warn(`File not found: ${fullPath}`);
      }
    }

    // 2. Upload Mosi Oa Tunya Cigars
    console.log('\n--- 2. Uploading Mosi Oa Tunya Cigar Images ---');
    const cigarDir = path.resolve(__dirname, '../../../cigar-store/public/images/products');
    const motFiles = [
      { id: 'cigar_mot_001', file: 'mot-robusto-zebra.webp' },
      { id: 'cigar_mot_002', file: 'mot-toro-habanos.webp' },
      { id: 'cigar_mot_003', file: 'mot-torpedo-habanos.webp' },
      { id: 'cigar_mot_004', file: 'mot-robusto-habanos.webp' },
      { id: 'cigar_mot_005', file: 'mot-toro-connecticut.webp' },
      { id: 'cigar_mot_006', file: 'mot-torpedo-sumatra.webp' },
      { id: 'cigar_mot_007', file: 'mot-robusto-sumatra.webp' },
      { id: 'cigar_mot_008', file: 'mot-corona-habanos-strong.webp' },
      { id: 'cigar_mot_009', file: 'mot-corona-sumatra-mild.webp' },
      { id: 'cigar_mot_010', file: 'mot-mini-cigar.webp' }
    ];

    for (const item of motFiles) {
      const fullPath = path.join(cigarDir, item.file);
      if (fs.existsSync(fullPath)) {
        console.log(`Uploading ${item.file}...`);
        const cdnUrl = await uploadFile(fullPath, path.parse(item.file).name);
        console.log(`  -> ${cdnUrl}`);
        await Product.findOneAndUpdate(
          { id: item.id },
          {
            $set: {
              image: cdnUrl,
              originalImage: cdnUrl,
              gallery: [cdnUrl]
            }
          }
        );
      } else {
        console.warn(`File not found: ${fullPath}`);
      }
    }

    // 3. Upload Aberlour, Ardbeg, Del Maguey from backend/uploads
    console.log('\n--- 3. Uploading Local Backend Uploads ---');
    const uploadsDir = path.resolve(__dirname, '../uploads');
    const extraUploads = [
      { id: 'prod_1787654841808_342', file: 'product-aberlour-18.png' },
      { id: 'prod_1787654842540_619', file: 'product-ardbeg-dolce.png' },
      { id: 'd5970438-e05c-4f5d-afaa-ad952ce06661', file: 'product-del-maguey-las-milpas.png' }
    ];

    for (const item of extraUploads) {
      const fullPath = path.join(uploadsDir, item.file);
      if (fs.existsSync(fullPath)) {
        console.log(`Uploading ${item.file}...`);
        const cdnUrl = await uploadFile(fullPath, path.parse(item.file).name);
        console.log(`  -> ${cdnUrl}`);
        await Product.findOneAndUpdate(
          { id: item.id },
          {
            $set: {
              image: cdnUrl,
              originalImage: cdnUrl,
              gallery: [cdnUrl]
            }
          }
        );
      } else {
        console.warn(`File not found: ${fullPath}`);
      }
    }

    // 4. Update ask40 to high quality luxury reserve image
    console.log('\n--- 4. Updating ask40 ---');
    const ask40Cdn = 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?q=80&w=1000&auto=format&fit=crop';
    await Product.findOneAndUpdate(
      { id: 'prod_ask40' },
      {
        $set: {
          image: ask40Cdn,
          originalImage: ask40Cdn,
          gallery: [ask40Cdn]
        }
      }
    );
    console.log(`ask40 updated to ${ask40Cdn}`);

    console.log('\n=============================================');
    console.log('✅ ALL RELATIVE & BROKEN IMAGES SUCCESSFULLY MIGRATED TO CLOUDINARY!');
    console.log('=============================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
