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

const scratch = 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch';
const finalDir = path.join(scratch, 'jd_final');

const products = [
  {
    id: 1,
    mongoId: '6acf69df415867e1d2b89cd3',
    name: "Jack Daniel's Single Barrel Rye Green Label 700ml",
    slug: 'jack-daniels-single-barrel-rye-green-label-700ml',
    filename: 'jack-daniels-single-barrel-rye-green-label-700ml.png',
    localFile: path.join(finalDir, 'jack-daniels-single-barrel-rye-green-label-700ml.png'),
    publicId: 'jack-daniels-single-barrel-rye-green-label-700ml'
  },
  {
    id: 2,
    mongoId: '6acf69df415867e1d2b89cd4',
    name: "Jack Daniel's Master Distiller No. 5 Tennessee Whiskey 750ml",
    slug: 'jack-daniels-master-distiller-no-5-tennessee-whiskey-750ml',
    filename: 'jack-daniels-master-distiller-no-5-tennessee-whiskey-750ml.png',
    localFile: path.join(finalDir, 'jack-daniels-master-distiller-no-5-tennessee-whiskey-750ml.png'),
    publicId: 'jack-daniels-master-distiller-no-5-tennessee-whiskey-750ml'
  },
  {
    id: 3,
    mongoId: '6acf69df415867e1d2b89cd5',
    name: "Gentleman Jack Rare Tennessee Whiskey 750ml",
    slug: 'gentleman-jack-rare-tennessee-whiskey-750ml',
    filename: 'gentleman-jack-rare-tennessee-whiskey-750ml.png',
    localFile: path.join(finalDir, 'gentleman-jack-rare-tennessee-whiskey-750ml.png'),
    publicId: 'gentleman-jack-rare-tennessee-whiskey-750ml'
  },
  {
    id: 4,
    mongoId: '6acf704eeea6503535645cdb',
    name: "Jack Daniel's Single Barrel Rye Green Label 750ml",
    slug: 'jack-daniels-single-barrel-rye-green-label-750ml',
    filename: 'jack-daniels-single-barrel-rye-green-label-750ml.png',
    localFile: path.join(finalDir, 'jack-daniels-single-barrel-rye-green-label-750ml.png'),
    publicId: 'jack-daniels-single-barrel-rye-green-label-750ml'
  },
  {
    id: 5,
    mongoId: '6acf704eeea6503535645cdc',
    name: "Jack Daniel's Master Distiller Series No. 5 1L",
    slug: 'jack-daniels-master-distiller-series-no-5-1l',
    filename: 'jack-daniels-master-distiller-series-no-5-1l.png',
    localFile: path.join(finalDir, 'jack-daniels-master-distiller-series-no-5-1l.png'),
    publicId: 'jack-daniels-master-distiller-series-no-5-1l'
  },
  {
    id: 6,
    mongoId: '6acf704eeea6503535645cdd',
    name: "Gentleman Jack Rare Double-Mellowed Tennessee Whiskey 750ml",
    slug: 'gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml',
    filename: 'gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml.png',
    localFile: path.join(finalDir, 'gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml.png'),
    publicId: 'gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml'
  },
  {
    id: 7,
    mongoId: '6acf704eeea6503535645cde',
    name: "Jack Daniel's Old No. 7 Tennessee Whiskey 750ml",
    slug: 'jack-daniels-old-no-7-tennessee-whiskey-750ml',
    filename: 'jack-daniels-old-no-7-tennessee-whiskey-750ml.png',
    localFile: path.join(finalDir, 'jack-daniels-old-no-7-tennessee-whiskey-750ml.png'),
    publicId: 'jack-daniels-old-no-7-tennessee-whiskey-750ml'
  },
  {
    id: 8,
    mongoId: '6acf704eeea6503535645cdf',
    name: "Jack Daniel's Old No. 7 Tennessee Whiskey 1.5L Magnum",
    slug: 'jack-daniels-old-no-7-tennessee-whiskey-15l-magnum',
    filename: 'jack-daniels-old-no-7-tennessee-whiskey-15l-magnum.png',
    localFile: path.join(finalDir, 'jack-daniels-old-no-7-tennessee-whiskey-15l-magnum.png'),
    publicId: 'jack-daniels-old-no-7-tennessee-whiskey-15l-magnum'
  },
  {
    id: 9,
    mongoId: '6acf704eeea6503535645ce0',
    name: "Jack Daniel's Sinatra Select Bold Handcrafted Decanter 1L",
    slug: 'jack-daniels-sinatra-select-bold-handcrafted-decanter-1l',
    filename: 'jack-daniels-sinatra-select-bold-handcrafted-decanter-1l.png',
    localFile: path.join(finalDir, 'jack-daniels-sinatra-select-bold-handcrafted-decanter-1l.png'),
    publicId: 'jack-daniels-sinatra-select-bold-handcrafted-decanter-1l'
  }
];

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/whisky'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/whisky')
];

async function run() {
  console.log('=== Step 1: Uploading 9 Standardized Jack Daniel\'s Images to Cloudinary ===');
  const cloudFolder = 'grand-store/catalog-originals/whisky/jack-daniels';
  const deployedUrls = {};

  for (const prod of products) {
    if (!fs.existsSync(prod.localFile)) {
      throw new Error(`Local file not found: ${prod.localFile}`);
    }
    console.log(`Uploading ${prod.name}...`);
    const up = await cloudinary.uploader.upload(prod.localFile, {
      folder: cloudFolder,
      public_id: prod.publicId,
      overwrite: true,
      resource_type: 'image'
    });
    const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_API_NAME || 'oioqrgj0'}/image/upload/v${up.version}/${up.public_id}.png`;
    deployedUrls[prod.slug] = url;
    prod.cloudinaryUrl = url;
    console.log(`Uploaded ${prod.slug} -> ${url}`);
  }

  console.log('\n=== Step 2: Copying PNG Files to Frontend Public Asset Dirs ===');
  for (const prod of products) {
    for (const dir of targetFrontendDirs) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const destPng = path.join(dir, prod.filename);
      fs.copyFileSync(prod.localFile, destPng);
      console.log(`Copied ${prod.filename} -> ${dir}`);

      // Remove legacy jpg if present
      const legacyJpg = path.join(dir, prod.filename.replace(/\.png$/, '.jpg'));
      if (fs.existsSync(legacyJpg)) {
        fs.unlinkSync(legacyJpg);
        console.log(`Removed legacy file: ${legacyJpg}`);
      }
    }
  }

  console.log('\n=== Step 3: Updating MongoDB Records ===');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  for (const prod of products) {
    const filter = {
      $or: [
        { _id: new mongoose.Types.ObjectId(prod.mongoId) },
        { slug: prod.slug },
        { name: prod.name }
      ]
    };
    const update = {
      $set: {
        image: prod.cloudinaryUrl,
        originalImage: prod.cloudinaryUrl,
        images: [prod.cloudinaryUrl],
        gallery: [prod.cloudinaryUrl],
        updatedAt: new Date()
      }
    };
    const res = await Product.updateMany(filter, update);
    console.log(`DB Update for [${prod.slug}]: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
  }

  console.log('\n=== Step 4: Updating Backend Seed Files ===');
  const seedFiles = [
    path.resolve(__dirname, 'seedRetailProductsWhiskyshop.js'),
    path.resolve(__dirname, 'seedAllWhiskyshopAndMosi.js')
  ];

  for (const sFile of seedFiles) {
    if (!fs.existsSync(sFile)) continue;
    let content = fs.readFileSync(sFile, 'utf8');
    let modCount = 0;

    for (const prod of products) {
      // In seedRetailProductsWhiskyshop.js, products have `slug: "..."`
      // In seedAllWhiskyshopAndMosi.js, products have `name: "..."`
      const slugRegex = new RegExp(`(slug:\\s*["']${prod.slug}["'][\\s\\S]*?image:\\s*["'])[^"']+(["'])`, 'g');
      if (slugRegex.test(content)) {
        content = content.replace(slugRegex, `$1${prod.cloudinaryUrl}$2`);
        modCount++;
      }

      const escapedName = prod.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const nameRegex = new RegExp(`(name:\\s*["']${escapedName}["'][\\s\\S]*?image:\\s*["'])[^"']+(["'])`, 'g');
      if (nameRegex.test(content)) {
        content = content.replace(nameRegex, `$1${prod.cloudinaryUrl}$2`);
        modCount++;
      }
    }

    fs.writeFileSync(sFile, content, 'utf8');
    console.log(`Updated ${path.basename(sFile)} (${modCount} image URL replacements)`);
  }

  // Touch server.js to restart nodemon / clear cache
  const serverPath = path.resolve(__dirname, '../server.js');
  if (fs.existsSync(serverPath)) {
    const sContent = fs.readFileSync(serverPath, 'utf8');
    fs.writeFileSync(serverPath, sContent, 'utf8');
    console.log('Touched server.js to clear in-memory product cache.');
  }

  await mongoose.disconnect();
  console.log('\n=== All 9 Jack Daniel\'s Products Successfully Deployed! ===');
}

run().catch(err => {
  console.error('Deployment error:', err);
  process.exit(1);
});
