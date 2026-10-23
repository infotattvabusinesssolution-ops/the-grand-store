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

const products = [
  {
    name: 'Dimple 15 Year Old Blended Scotch Whisky 750ml',
    slug: 'dimple-15-year-old-blended-scotch-whisky-750ml',
    localFinalFile: path.join(scratch, 'dimple_1_dimple-15-year-old-blended-scotch-whisky-750ml_final.png'),
    publicId: 'dimple-15-year-old-blended-scotch-whisky-750ml',
    filename: 'dimple-15-year-old-blended-scotch-whisky-750ml.png'
  },
  {
    name: 'Dimple 15 Year Old De Luxe Scotch Whisky 750ml',
    slug: 'dimple-15-year-old-de-luxe-scotch-whisky-750ml',
    localFinalFile: path.join(scratch, 'dimple_2_dimple-15-year-old-de-luxe-scotch-whisky-750ml_final.png'),
    publicId: 'dimple-15-year-old-de-luxe-scotch-whisky-750ml',
    filename: 'dimple-15-year-old-de-luxe-scotch-whisky-750ml.png'
  },
  {
    name: 'Dimple Golden Selection Blended Scotch Whisky 700ml',
    slug: 'dimple-golden-selection-blended-scotch-whisky-700ml',
    localFinalFile: path.join(scratch, 'dimple_3_dimple-golden-selection-blended-scotch-whisky-700ml_final.png'),
    publicId: 'dimple-golden-selection-blended-scotch-whisky-700ml',
    filename: 'dimple-golden-selection-blended-scotch-whisky-700ml.png'
  },
  {
    name: 'Dimple Haig 15 Year Old Presentation Tin De Luxe Scotch Whisky 750ml',
    slug: 'dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml',
    localFinalFile: path.join(scratch, 'dimple_4_dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml_final.png'),
    publicId: 'dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml',
    filename: 'dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml.png'
  },
  {
    name: 'Dimple Haig 15 Year Old Presentation Tin Collector Edition 750ml',
    slug: 'dimple-haig-15-year-old-presentation-tin-collector-edition-750ml',
    localFinalFile: path.join(scratch, 'dimple_5_dimple-haig-15-year-old-presentation-tin-collector-edition-750ml_final.png'),
    publicId: 'dimple-haig-15-year-old-presentation-tin-collector-edition-750ml',
    filename: 'dimple-haig-15-year-old-presentation-tin-collector-edition-750ml.png'
  },
  {
    name: 'Dimple 3L 1970 Rare Heritage Collector Limited Edition',
    slug: 'dimple-3l-1970-rare-heritage-collector-limited-edition',
    localFinalFile: path.join(scratch, 'dimple_6_dimple-3l-1970-rare-heritage-collector-limited-edition_final.png'),
    publicId: 'dimple-3l-1970-rare-heritage-collector-limited-edition',
    filename: 'dimple-3l-1970-rare-heritage-collector-limited-edition.png'
  }
];

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/whisky'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/whisky')
];

async function run() {
  console.log('=== Step 1: Uploading 6 Standardized Images to Cloudinary ===');
  const cloudFolder = 'grand-store/catalog-originals/whisky/dimple';
  const deployedUrls = {};

  for (const prod of products) {
    if (!fs.existsSync(prod.localFinalFile)) {
      throw new Error(`File not found: ${prod.localFinalFile}`);
    }
    console.log(`Uploading ${prod.name}...`);
    const up = await cloudinary.uploader.upload(prod.localFinalFile, {
      folder: cloudFolder,
      public_id: prod.publicId,
      overwrite: true,
      resource_type: 'image'
    });
    // Use clean CDN URL
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
      fs.copyFileSync(prod.localFinalFile, destPng);
      console.log(`Copied: ${destPng}`);
      const destJpg = path.join(dir, prod.filename.replace(/\.png$/, '.jpg'));
      if (fs.existsSync(destJpg)) {
        fs.copyFileSync(prod.localFinalFile, destJpg);
        console.log(`Updated legacy jpg: ${destJpg}`);
      }
    }
  }

  console.log('\n=== Step 3: Updating MongoDB Database Records ===');
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  for (const prod of products) {
    const filter = {
      $or: [
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
    console.log(`Updated [${prod.slug}]: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
  }

  console.log('\n=== Step 4: Verifying MongoDB Dimple Records ===');
  const prods = await Product.find({
    $or: [
      { brand: /Dimple/i },
      { name: /Dimple/i }
    ]
  }).select('name slug image').lean();

  prods.forEach((p, i) => {
    console.log(`${i+1}. [${p.name}] (${p.slug}) -> ${p.image}`);
  });

  await mongoose.disconnect();

  console.log('\n=== Step 5: Updating Seed Files ===');
  // 5.1: seedRetailProductsWhiskyshop.js
  const seedFile1 = path.resolve(__dirname, 'seedRetailProductsWhiskyshop.js');
  if (fs.existsSync(seedFile1)) {
    let content = fs.readFileSync(seedFile1, 'utf8');

    // ws-dimple-15-blended-scotch
    content = content.replace(
      /(id:\s*"ws-dimple-15-blended-scotch"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-15-year-old-blended-scotch-whisky-750ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-15-blended-scotch"[\s\S]*?originalImage:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-15-year-old-blended-scotch-whisky-750ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-15-blended-scotch"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-15-year-old-blended-scotch-whisky-750ml']}"`
    );

    // ws-dimple-haig-15-tin
    content = content.replace(
      /(id:\s*"ws-dimple-haig-15-tin"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-haig-15-tin"[\s\S]*?originalImage:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-haig-15-tin"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml']}"`
    );

    // ws-dimple-golden-selection
    content = content.replace(
      /(id:\s*"ws-dimple-golden-selection"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-golden-selection-blended-scotch-whisky-700ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-golden-selection"[\s\S]*?originalImage:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-golden-selection-blended-scotch-whisky-700ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-golden-selection"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-golden-selection-blended-scotch-whisky-700ml']}"`
    );

    fs.writeFileSync(seedFile1, content, 'utf8');
    console.log('Updated seedRetailProductsWhiskyshop.js successfully');
  }

  // 5.2: seedAllWhiskyshopAndMosi.js
  const seedFile2 = path.resolve(__dirname, 'seedAllWhiskyshopAndMosi.js');
  if (fs.existsSync(seedFile2)) {
    let content = fs.readFileSync(seedFile2, 'utf8');

    // Dimple 15 De Luxe
    content = content.replace(
      /(name:\s*"Dimple 15 Year Old De Luxe Scotch Whisky 750ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-15-year-old-de-luxe-scotch-whisky-750ml']}"`
    );
    content = content.replace(
      /(name:\s*"Dimple 15 Year Old De Luxe Scotch Whisky 750ml"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-15-year-old-de-luxe-scotch-whisky-750ml']}"`
    );

    // Dimple Haig 15 Presentation Tin Collector Edition
    content = content.replace(
      /(name:\s*"Dimple Haig 15 Year Old Presentation Tin Collector Edition 750ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-haig-15-year-old-presentation-tin-collector-edition-750ml']}"`
    );
    content = content.replace(
      /(name:\s*"Dimple Haig 15 Year Old Presentation Tin Collector Edition 750ml"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-haig-15-year-old-presentation-tin-collector-edition-750ml']}"`
    );

    // Dimple Golden Selection
    content = content.replace(
      /(name:\s*"Dimple Golden Selection Blended Scotch Whisky 700ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-golden-selection-blended-scotch-whisky-700ml']}"`
    );
    content = content.replace(
      /(name:\s*"Dimple Golden Selection Blended Scotch Whisky 700ml"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-golden-selection-blended-scotch-whisky-700ml']}"`
    );

    // Dimple 3L 1970
    content = content.replace(
      /(name:\s*"Dimple 3L 1970 Rare Heritage Collector Limited Edition"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-3l-1970-rare-heritage-collector-limited-edition']}"`
    );
    content = content.replace(
      /(name:\s*"Dimple 3L 1970 Rare Heritage Collector Limited Edition"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['dimple-3l-1970-rare-heritage-collector-limited-edition']}"`
    );

    fs.writeFileSync(seedFile2, content, 'utf8');
    console.log('Updated seedAllWhiskyshopAndMosi.js successfully');
  }

  console.log('\n=== Step 6: Touching server.js to restart and flush cache ===');
  const serverFile = path.resolve(__dirname, '../server.js');
  const now = new Date();
  fs.utimesSync(serverFile, now, now);
  console.log('Touched server.js successfully');

  fs.writeFileSync(
    path.join(scratch, 'dimple_deployed_urls.json'),
    JSON.stringify(deployedUrls, null, 2),
    'utf8'
  );
  console.log('Saved deployed URLs manifest.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
