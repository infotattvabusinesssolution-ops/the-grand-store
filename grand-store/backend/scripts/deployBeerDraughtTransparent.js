const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const items = [
  {
    name: 'Castle Lager 30l Keg [Liq] & SAB Draught Machine 7 Days',
    slugs: ['castle-lager-30l-keg-liq-sab-draught-machine-7-days'],
    nameRegex: /castle.*lager.*30l.*keg/i,
    filename: 'castle-lager-30l-keg-draught-machine.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792827640/grand-store/catalog-originals/beer/castle-lager-30l-keg-draught-machine.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/06826049-49e8-4713-97b2-45b8684250f3/transparent_output/castle-lager-30l-keg-draught-machine.png'
  },
  {
    name: 'Castle Double Malt 30l Keg [Liq] & SAB Draught Machine 7 Days',
    slugs: ['castle-double-malt-30l-keg-liq-sab-draught-machine-7-days'],
    nameRegex: /castle.*double.*malt.*30l.*keg/i,
    filename: 'castle-double-malt-30l-keg-draught-machine.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792827642/grand-store/catalog-originals/beer/castle-double-malt-30l-keg-draught-machine.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/06826049-49e8-4713-97b2-45b8684250f3/transparent_output/castle-double-malt-30l-keg-draught-machine.png'
  },
  {
    name: 'Castle Lite 30l Keg [Liq] & SAB Draught Machine 7 Days',
    slugs: ['castle-lite-30l-keg-liq-sab-draught-machine-7-days'],
    nameRegex: /castle.*lite.*30l.*keg/i,
    filename: 'castle-lite-30l-keg-draught-machine.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/c_limit,h_1600,w_1200/v1792827653/grand-store/catalog-originals/beer/castle-lite-30l-keg-draught-machine.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/06826049-49e8-4713-97b2-45b8684250f3/transparent_output/castle-lite-30l-keg-draught-machine.png'
  },
  {
    name: 'Carling Black Label 30L Keg [Liq] & SAB Draught Machine 7 Days',
    slugs: ['carling-black-label-30l-keg-liq-sab-draught-machine-7-days'],
    nameRegex: /carling.*black.*label.*30l.*keg/i,
    filename: 'carling-black-label-30l-keg-draught-machine.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792827645/grand-store/catalog-originals/beer/carling-black-label-30l-keg-draught-machine.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/06826049-49e8-4713-97b2-45b8684250f3/transparent_output/carling-black-label-30l-keg-draught-machine.png'
  },
  {
    name: 'Hansa Pilsener 30L Keg [Liq] & SAB Draught Machine 7 Days',
    slugs: ['hansa-pilsener-30l-keg-liq-sab-draught-machine-7-days'],
    nameRegex: /hansa.*pilsener.*30l.*keg/i,
    filename: 'hansa-pilsener-30l-keg-draught-machine.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792827647/grand-store/catalog-originals/beer/hansa-pilsener-30l-keg-draught-machine.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/06826049-49e8-4713-97b2-45b8684250f3/transparent_output/hansa-pilsener-30l-keg-draught-machine.png'
  },
  {
    name: 'Stella Artois 30L Keg [Liq] & SAB Draught Machine 7 Days',
    slugs: ['stella-artois-30l-keg-liq-sab-draught-machine-7-days'],
    nameRegex: /stella.*artois.*30l.*keg/i,
    filename: 'stella-artois-30l-keg-draught-machine.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792827650/grand-store/catalog-originals/beer/stella-artois-30l-keg-draught-machine.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/06826049-49e8-4713-97b2-45b8684250f3/transparent_output/stella-artois-30l-keg-draught-machine.png'
  }
];

const targetFrontendDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/products/beer'),
  path.resolve(__dirname, '../../frontend/dist/assets/products/beer'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/beer')
];

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  for (const item of items) {
    console.log(`\n========================================`);
    console.log(`Processing: ${item.name}`);

    if (!fs.existsSync(item.scratchFile)) {
      throw new Error(`File does not exist: ${item.scratchFile}`);
    }

    // 1. Copy to frontend directories
    for (const dir of targetFrontendDirs) {
      if (fs.existsSync(path.dirname(dir))) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const dest = path.join(dir, item.filename);
        fs.copyFileSync(item.scratchFile, dest);
        console.log(`Copied to ${dest}`);
      }
    }

    // 2. Update MongoDB
    const filter = {
      $or: [
        { slug: { $in: item.slugs } },
        { name: item.nameRegex }
      ]
    };

    const updateRes = await Product.updateMany(filter, {
      $set: {
        image: item.transparentUrl,
        originalImage: item.transparentUrl,
        gallery: [item.transparentUrl],
        updatedAt: new Date()
      }
    });
    console.log(`Updated DB: matched ${updateRes.matchedCount}, modified ${updateRes.modifiedCount}`);

    const verified = await Product.find(filter, { name: 1, slug: 1, image: 1 }).lean();
    verified.forEach(p => console.log(` Verified DB record: ${p.name} -> ${p.image}`));
  }

  await mongoose.disconnect();
  console.log('\nAll 6 Draught Machine beer products deployed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
