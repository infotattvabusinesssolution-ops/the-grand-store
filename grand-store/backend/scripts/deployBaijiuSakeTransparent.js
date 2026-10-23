const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const updates = [
  {
    name: 'Fenjiu Qinghua 20 Year Old Baijiu 500ml',
    slugs: ['fenjiu-qinghua-20-year-old-baijiu-500ml', 'fenjiu-qinghua-blue-flower-20-years-old-baijiu-500ml'],
    nameRegex: /fenjiu.*qinghua/i,
    category: 'baijiu',
    filename: 'fenjiu-qinghua-20-year-old.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658955/grand-store/catalog-originals/baijiu/fenjiu-qinghua-20-year-old.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/fenjiu-qinghua-20-year-old.png'
  },
  {
    name: 'Fen Jiu Red Label (Fen Chiew) Baijiu 500ml',
    slugs: ['fen-jiu-red-label-fen-chiew-baijiu-500ml', 'fen-jiu-red-label-500ml'],
    nameRegex: /fen\s*jiu.*red/i,
    category: 'baijiu',
    filename: 'fen-jiu-red-label-fen-chiew.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658959/grand-store/catalog-originals/baijiu/fen-jiu-red-label-fen-chiew.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/fen-jiu-red-label-fen-chiew.png'
  },
  {
    name: 'Guizhou XIJIU Friends Series Baijiu (Blue Bottle) 500ml',
    slugs: ['guizhou-xijiu-friends-series-baijiu-blue-bottle-500ml', 'guizhou-xijiu-friends-series-500ml'],
    nameRegex: /xijiu.*friends/i,
    category: 'baijiu',
    filename: 'guizhou-xijiu-friends-series-blue-bottle.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658967/grand-store/catalog-originals/baijiu/guizhou-xijiu-friends-series-blue-bottle.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/guizhou-xijiu-friends-series-blue-bottle.png'
  },
  {
    name: 'Gekkeikan Traditional Junmai-shu Sake 720ml',
    slugs: ['gekkeikan-traditional-junmai-shu-sake-720ml', 'gekkeikan-traditional-junmai-sake-720ml'],
    nameRegex: /gekkeikan.*traditional/i,
    category: 'sake',
    filename: 'gekkeikan-traditional-junmai-sake-720ml.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658970/grand-store/catalog-originals/sake/gekkeikan-traditional-junmai-sake-720ml.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/gekkeikan-traditional-junmai-sake-720ml.png'
  },
  {
    name: 'Dassai 45 Junmai Daiginjo Sake 720ml',
    slugs: ['dassai-45-junmai-daiginjo-sake-720ml'],
    nameRegex: /dassai.*45/i,
    category: 'sake',
    filename: 'dassai-45-junmai-daiginjo-sake-720ml.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658974/grand-store/catalog-originals/sake/dassai-45-junmai-daiginjo-sake-720ml.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dassai-45-junmai-daiginjo-sake-720ml.png'
  },
  {
    name: 'Gold Gekkeikan Junmai-shu Sake with Gold Leaf 720ml',
    slugs: ['gold-gekkeikan-junmai-shu-sake-with-gold-leaf-720ml', 'gold-gekkeikan-junmai-sake-with-gold-leaf-720ml'],
    nameRegex: /gold.*gekkeikan/i,
    category: 'sake',
    filename: 'gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658977/grand-store/catalog-originals/sake/gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.png'
  },
  {
    name: 'Super Kinokuni Junmai Sake 720ml',
    slugs: ['super-kinokuni-junmai-sake-720ml'],
    nameRegex: /kinokuni/i,
    category: 'sake',
    filename: 'super-kinokuni-junmai-sake-720ml.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658980/grand-store/catalog-originals/sake/super-kinokuni-junmai-sake-720ml.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/super-kinokuni-junmai-sake-720ml.png'
  },
  {
    name: 'Dassai 23 Junmai Daiginjo Super Premium Sake 720ml',
    slugs: ['dassai-23-junmai-daiginjo-super-premium-sake-720ml', 'dassai-23-sake-720ml'],
    nameRegex: /dassai.*23/i,
    category: 'sake',
    filename: 'dassai-23-junmai-daiginjo-super-premium-sake-720ml.png',
    transparentUrl: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658983/grand-store/catalog-originals/sake/dassai-23-junmai-daiginjo-super-premium-sake-720ml.png',
    scratchFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dassai-23-junmai-daiginjo-super-premium-sake-720ml.png'
  }
];

const targetDirs = {
  baijiu: [
    path.resolve(__dirname, '../../frontend/public/assets/products/baijiu'),
    path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/baijiu')
  ],
  sake: [
    path.resolve(__dirname, '../../frontend/public/assets/products/sake'),
    path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/products/sake')
  ]
};

async function deploy() {
  console.log('=== 1. COPYING PNG FILES TO FRONTEND ASSETS ===');
  for (const item of updates) {
    if (!fs.existsSync(item.scratchFile)) {
      throw new Error(`File not found: ${item.scratchFile}`);
    }
    const dirs = targetDirs[item.category] || [];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const dest = path.join(dir, item.filename);
      fs.copyFileSync(item.scratchFile, dest);
      console.log(`Copied: ${dest}`);
      // Also overwrite .jpg if existing so any legacy reference to .jpg also serves the transparent png or redirect
      const jpgDest = path.join(dir, item.filename.replace(/\.png$/, '.jpg'));
      if (fs.existsSync(jpgDest)) {
        fs.copyFileSync(item.scratchFile, jpgDest);
        console.log(`Updated legacy jpg: ${jpgDest}`);
      }
    }
  }

  console.log('\n=== 2. UPDATING MONGODB DATABASE RECORDS ===');
  await mongoose.connect(process.env.MONGO_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  for (const item of updates) {
    const filter = {
      $or: [
        { slug: { $in: item.slugs } },
        { name: item.nameRegex }
      ]
    };
    const update = {
      $set: {
        image: item.transparentUrl,
        originalImage: item.transparentUrl,
        images: [item.transparentUrl],
        gallery: [item.transparentUrl],
        updatedAt: new Date()
      }
    };
    const res = await Product.updateMany(filter, update);
    console.log(`Updated ${item.name}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
  }

  console.log('\n=== 3. VERIFYING ALL BAIJIU & SAKE IN DB ===');
  const allProds = await Product.find({
    $or: [
      { category: { $in: ['Baijiu', 'baijiu', 'Sake', 'sake', 'Baijiu & Sake', 'baijiu & sake'] } },
      { subcategory: { $in: ['Baijiu', 'baijiu', 'Sake', 'sake'] } },
      { name: { $regex: /(moutai|fenjiu|xijiu|gekkeikan|dassai|kinokuni)/i } }
    ]
  }).select('name category image').lean();

  allProds.forEach((p, i) => {
    console.log(`${i+1}. [${p.name}] (${p.category}) -> ${p.image}`);
  });

  await mongoose.disconnect();
  console.log('\nDatabase update completed successfully!');
}

deploy().catch(err => {
  console.error(err);
  process.exit(1);
});
