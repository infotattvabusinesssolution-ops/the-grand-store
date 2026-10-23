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
    name: "Ballantine's 30 Year Old Very Rare Blended Scotch Whisky 750ml",
    slug: 'ballantines-30-year-old-very-rare-blended-scotch-whisky-750ml',
    localFinalFile: path.join(scratch, 'ballantines_1_ballantines-30-year-old-very-rare-blended-scotch-whisky-750ml_final.png'),
    publicId: 'ballantines-30-year-old-very-rare-blended-scotch-whisky-750ml',
    filename: 'ballantines-30-year-old-very-rare-blended-scotch-whisky-750ml.png'
  },
  {
    name: "Ballantine's 17 Year Old Blended Scotch Whisky 750ml",
    slug: 'ballantines-17-year-old-blended-scotch-whisky-750ml',
    localFinalFile: path.join(scratch, 'ballantines_2_ballantines-17-year-old-blended-scotch-whisky-750ml_final.png'),
    publicId: 'ballantines-17-year-old-blended-scotch-whisky-750ml',
    filename: 'ballantines-17-year-old-blended-scotch-whisky-750ml.png'
  },
  {
    name: "Ballantine's Original Extra-Large 4.5L Gallon Cradle",
    slug: 'ballantines-original-extra-large-45l-gallon-cradle',
    localFinalFile: path.join(scratch, 'ballantines_3_ballantines-original-extra-large-45l-gallon-cradle_final.png'),
    publicId: 'ballantines-original-extra-large-45l-gallon-cradle',
    filename: 'ballantines-original-extra-large-45l-gallon-cradle.png'
  },
  {
    name: "Ballantine's Finest Blended Scotch Whisky 3L with Cradle",
    slug: 'ballantines-finest-blended-scotch-whisky-3l-with-cradle',
    localFinalFile: path.join(scratch, 'ballantines_4_ballantines-finest-blended-scotch-whisky-3l-with-cradle_final.png'),
    publicId: 'ballantines-finest-blended-scotch-whisky-3l-with-cradle',
    filename: 'ballantines-finest-blended-scotch-whisky-3l-with-cradle.png'
  },
  {
    name: "Ballantine's Finest Blended Scotch Whisky 750ml",
    slug: 'ballantines-finest-blended-scotch-whisky-750ml',
    localFinalFile: path.join(scratch, 'ballantines_5_ballantines-finest-blended-scotch-whisky-750ml_final.png'),
    publicId: 'ballantines-finest-blended-scotch-whisky-750ml',
    filename: 'ballantines-finest-blended-scotch-whisky-750ml.png'
  },
  {
    name: "Ballantine's Hard Fired Blended Scotch Whisky 1L",
    slug: 'ballantines-hard-fired-blended-scotch-whisky-1l',
    localFinalFile: path.join(scratch, 'ballantines_6_ballantines-hard-fired-blended-scotch-whisky-1l_final.png'),
    publicId: 'ballantines-hard-fired-blended-scotch-whisky-1l',
    filename: 'ballantines-hard-fired-blended-scotch-whisky-1l.png'
  },
  {
    name: "Ballantine's 21 Year Old Blended Scotch Whisky 750ml",
    slug: 'ballantines-21-year-old-blended-scotch-whisky-750ml',
    localFinalFile: path.join(scratch, 'ballantines_7_ballantines-21-year-old-blended-scotch-whisky-750ml_final.png'),
    publicId: 'ballantines-21-year-old-blended-scotch-whisky-750ml',
    filename: 'ballantines-21-year-old-blended-scotch-whisky-750ml.png'
  }
];

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/whisky'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/whisky')
];

async function run() {
  console.log('=== Step 1: Uploading 7 Standardized Ballantine\'s Images to Cloudinary ===');
  const cloudFolder = 'grand-store/catalog-originals/whisky/ballantines';
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

  console.log('\n=== Step 4: Verifying MongoDB Ballantine\'s Records ===');
  const prods = await Product.find({
    $or: [
      { brand: /Ballantine/i },
      { name: /Ballantine/i }
    ]
  }).select('id name slug image').lean();

  prods.forEach((p, i) => {
    console.log(`${i+1}. [${p.name}] (${p.slug}) -> ${p.image}`);
  });

  await mongoose.disconnect();

  console.log('\n=== Step 5: Updating Seed Files ===');
  // 5.1: seedRetailProductsWhiskyshop.js
  const seedFile1 = path.resolve(__dirname, 'seedRetailProductsWhiskyshop.js');
  if (fs.existsSync(seedFile1)) {
    let content = fs.readFileSync(seedFile1, 'utf8');

    // ws-ballantines-21
    content = content.replace(
      /(id:\s*"ws-ballantines-21"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-21-year-old-blended-scotch-whisky-750ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-ballantines-21"[\s\S]*?originalImage:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-21-year-old-blended-scotch-whisky-750ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-ballantines-21"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-21-year-old-blended-scotch-whisky-750ml']}"`
    );

    // ws-ballantines-hardfired
    content = content.replace(
      /(id:\s*"ws-ballantines-hardfired"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-hard-fired-blended-scotch-whisky-1l']}"`
    );
    content = content.replace(
      /(id:\s*"ws-ballantines-hardfired"[\s\S]*?originalImage:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-hard-fired-blended-scotch-whisky-1l']}"`
    );
    content = content.replace(
      /(id:\s*"ws-ballantines-hardfired"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-hard-fired-blended-scotch-whisky-1l']}"`
    );

    // ws-ballantines-finest
    content = content.replace(
      /(id:\s*"ws-ballantines-finest"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-finest-blended-scotch-whisky-750ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-ballantines-finest"[\s\S]*?originalImage:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-finest-blended-scotch-whisky-750ml']}"`
    );
    content = content.replace(
      /(id:\s*"ws-ballantines-finest"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-finest-blended-scotch-whisky-750ml']}"`
    );

    fs.writeFileSync(seedFile1, content, 'utf8');
    console.log('Updated seedRetailProductsWhiskyshop.js successfully');
  }

  // 5.2: seedAllWhiskyshopAndMosi.js
  const seedFile2 = path.resolve(__dirname, 'seedAllWhiskyshopAndMosi.js');
  if (fs.existsSync(seedFile2)) {
    let content = fs.readFileSync(seedFile2, 'utf8');

    // Ballantine's 21 Year Old
    content = content.replace(
      /(name:\s*"Ballantine's 21 Year Old Blended Scotch Whisky 750ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-21-year-old-blended-scotch-whisky-750ml']}"`
    );

    // Ballantine's Hard Fired
    content = content.replace(
      /(name:\s*"Ballantine's Hard Fired Blended Scotch Whisky 1L"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-hard-fired-blended-scotch-whisky-1l']}"`
    );

    // Ballantine's Finest 750ml
    content = content.replace(
      /(name:\s*"Ballantine's Finest Blended Scotch Whisky 750ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-finest-blended-scotch-whisky-750ml']}"`
    );

    // Ballantine's Finest 3L with Cradle
    content = content.replace(
      /(name:\s*"Ballantine's Finest Blended Scotch Whisky 3L with Cradle"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-finest-blended-scotch-whisky-3l-with-cradle']}"`
    );

    // Ballantine's Original Extra-Large 4.5L Gallon Cradle
    content = content.replace(
      /(name:\s*"Ballantine's Original Extra-Large 4.5L Gallon Cradle"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-original-extra-large-45l-gallon-cradle']}"`
    );

    // Ballantine's 17 Year Old
    content = content.replace(
      /(name:\s*"Ballantine's 17 Year Old Blended Scotch Whisky 750ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-17-year-old-blended-scotch-whisky-750ml']}"`
    );

    // Ballantine's 30 Year Old
    content = content.replace(
      /(name:\s*"Ballantine's 30 Year Old Very Rare Blended Scotch Whisky 750ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${deployedUrls['ballantines-30-year-old-very-rare-blended-scotch-whisky-750ml']}"`
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
    path.join(scratch, 'ballantines_deployed_manifest.json'),
    JSON.stringify(deployedUrls, null, 2),
    'utf8'
  );
  console.log('Saved deployed URLs manifest.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
