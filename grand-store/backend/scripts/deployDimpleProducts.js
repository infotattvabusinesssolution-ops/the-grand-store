const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dimpleSpecs = [
  {
    targetGroup: 'dimple-15',
    names: [
      'Dimple 15 Year Old Blended Scotch Whisky 750ml',
      'Dimple 15 Year Old De Luxe Scotch Whisky 750ml'
    ],
    slugs: [
      'dimple-15-year-old-blended-scotch-whisky-750ml',
      'dimple-15-year-old-de-luxe-scotch-whisky-750ml'
    ],
    nameRegex: /dimple.*15.*(blended|de\s*luxe)/i,
    filename: 'dimple-15-year-old-blended-scotch-whisky-750ml.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dimple-15-year-old-blended-scotch-whisky-750ml_processed.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/c_limit,h_1600,w_1200/v1792664905/grand-store/catalog-originals/whisky/dimple/dimple-15-year-old-blended-scotch-whisky-750ml.png'
  },
  {
    targetGroup: 'dimple-golden',
    names: [
      'Dimple Golden Selection Blended Scotch Whisky 700ml'
    ],
    slugs: [
      'dimple-golden-selection-blended-scotch-whisky-700ml'
    ],
    nameRegex: /dimple.*golden.*selection/i,
    filename: 'dimple-golden-selection-blended-scotch-whisky-700ml.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dimple-golden-selection-blended-scotch-whisky-700ml_processed.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792664907/grand-store/catalog-originals/whisky/dimple/dimple-golden-selection-blended-scotch-whisky-700ml.png'
  },
  {
    targetGroup: 'dimple-tin',
    names: [
      'Dimple Haig 15 Year Old Presentation Tin De Luxe Scotch Whisky 750ml',
      'Dimple Haig 15 Year Old Presentation Tin Collector Edition 750ml'
    ],
    slugs: [
      'dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml',
      'dimple-haig-15-year-old-presentation-tin-collector-edition-750ml'
    ],
    nameRegex: /dimple.*tin/i,
    filename: 'dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml_processed.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792664911/grand-store/catalog-originals/whisky/dimple/dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml.png'
  },
  {
    targetGroup: 'dimple-3l',
    names: [
      'Dimple 3L 1970 Rare Heritage Collector Limited Edition'
    ],
    slugs: [
      'dimple-3l-1970-rare-heritage-collector-limited-edition'
    ],
    nameRegex: /dimple.*(3l|1970)/i,
    filename: 'dimple-3l-1970-rare-heritage-collector-limited-edition.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dimple-3l-1970-rare-heritage-collector-limited-edition_processed.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792664916/grand-store/catalog-originals/whisky/dimple/dimple-3l-1970-rare-heritage-collector-limited-edition.png'
  }
];

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/whisky'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/whisky')
];

async function deploy() {
  console.log('=== Step 1: Copying PNG files to frontend public assets ===');
  for (const spec of dimpleSpecs) {
    if (!fs.existsSync(spec.scratchFile)) {
      throw new Error(`File not found: ${spec.scratchFile}`);
    }
    for (const dir of targetFrontendDirs) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const destPng = path.join(dir, spec.filename);
      fs.copyFileSync(spec.scratchFile, destPng);
      console.log(`Copied: ${destPng}`);
      const destJpg = path.join(dir, spec.filename.replace(/\.png$/, '.jpg'));
      if (fs.existsSync(destJpg)) {
        fs.copyFileSync(spec.scratchFile, destJpg);
        console.log(`Updated legacy jpg: ${destJpg}`);
      }
    }
  }

  console.log('\n=== Step 2: Updating MongoDB database records ===');
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  for (const spec of dimpleSpecs) {
    const filter = {
      $or: [
        { slug: { $in: spec.slugs } },
        { name: spec.nameRegex }
      ]
    };
    const update = {
      $set: {
        image: spec.transparentUrl,
        originalImage: spec.transparentUrl,
        images: [spec.transparentUrl],
        gallery: [spec.transparentUrl],
        updatedAt: new Date()
      }
    };
    const res = await Product.updateMany(filter, update);
    console.log(`Updated [${spec.targetGroup}]: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
  }

  console.log('\n=== Step 3: Verifying Dimple products in DB ===');
  const prods = await Product.find({
    $or: [
      { brand: /Dimple/i },
      { name: /Dimple/i }
    ]
  }).select('name slug image').lean();

  prods.forEach((p, i) => {
    console.log(`${i+1}. [${p.name}] -> ${p.image}`);
  });

  await mongoose.disconnect();

  console.log('\n=== Step 4: Updating seed files ===');
  // Update seedRetailProductsWhiskyshop.js
  const seedFile1 = path.resolve(__dirname, 'seedRetailProductsWhiskyshop.js');
  if (fs.existsSync(seedFile1)) {
    let content = fs.readFileSync(seedFile1, 'utf8');
    // Dimple 15
    content = content.replace(
      /(id:\s*"ws-dimple-15-blended-scotch"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[0].transparentUrl}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-15-blended-scotch"[\s\S]*?originalImage:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[0].transparentUrl}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-15-blended-scotch"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${dimpleSpecs[0].transparentUrl}"`
    );

    // Dimple Tin
    content = content.replace(
      /(id:\s*"ws-dimple-haig-15-tin"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[2].transparentUrl}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-haig-15-tin"[\s\S]*?originalImage:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[2].transparentUrl}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-haig-15-tin"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${dimpleSpecs[2].transparentUrl}"`
    );

    // Dimple Golden Selection
    content = content.replace(
      /(id:\s*"ws-dimple-golden-selection"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[1].transparentUrl}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-golden-selection"[\s\S]*?originalImage:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[1].transparentUrl}"`
    );
    content = content.replace(
      /(id:\s*"ws-dimple-golden-selection"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${dimpleSpecs[1].transparentUrl}"`
    );

    fs.writeFileSync(seedFile1, content, 'utf8');
    console.log('Updated seedRetailProductsWhiskyshop.js successfully');
  }

  // Update seedAllWhiskyshopAndMosi.js
  const seedFile2 = path.resolve(__dirname, 'seedAllWhiskyshopAndMosi.js');
  if (fs.existsSync(seedFile2)) {
    let content = fs.readFileSync(seedFile2, 'utf8');

    // Dimple 15 De Luxe
    content = content.replace(
      /(name:\s*"Dimple 15 Year Old De Luxe Scotch Whisky 750ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[0].transparentUrl}"`
    );
    content = content.replace(
      /(name:\s*"Dimple 15 Year Old De Luxe Scotch Whisky 750ml"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${dimpleSpecs[0].transparentUrl}"`
    );

    // Dimple Tin
    content = content.replace(
      /(name:\s*"Dimple Haig 15 Year Old Presentation Tin Collector Edition 750ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[2].transparentUrl}"`
    );
    content = content.replace(
      /(name:\s*"Dimple Haig 15 Year Old Presentation Tin Collector Edition 750ml"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${dimpleSpecs[2].transparentUrl}"`
    );

    // Dimple Golden Selection
    content = content.replace(
      /(name:\s*"Dimple Golden Selection Blended Scotch Whisky 700ml"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[1].transparentUrl}"`
    );
    content = content.replace(
      /(name:\s*"Dimple Golden Selection Blended Scotch Whisky 700ml"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${dimpleSpecs[1].transparentUrl}"`
    );

    // Dimple 3L 1970
    content = content.replace(
      /(name:\s*"Dimple 3L 1970 Rare Heritage Collector Limited Edition"[\s\S]*?image:\s*)"[^"]*"/,
      `$1"${dimpleSpecs[3].transparentUrl}"`
    );
    content = content.replace(
      /(name:\s*"Dimple 3L 1970 Rare Heritage Collector Limited Edition"[\s\S]*?gallery:\s*\[\s*)"[^"]*"/,
      `$1"${dimpleSpecs[3].transparentUrl}"`
    );

    fs.writeFileSync(seedFile2, content, 'utf8');
    console.log('Updated seedAllWhiskyshopAndMosi.js successfully');
  }

  console.log('\n=== Step 5: Touching server.js to restart nodemon and flush cache ===');
  const serverFile = path.resolve(__dirname, '../server.js');
  const now = new Date();
  fs.utimesSync(serverFile, now, now);
  console.log('Touched server.js successfully');
}

deploy().catch(err => {
  console.error(err);
  process.exit(1);
});
