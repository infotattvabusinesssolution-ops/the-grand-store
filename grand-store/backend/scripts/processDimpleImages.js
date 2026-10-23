const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

const items = [
  {
    name: 'Dimple 15 Year Old Blended Scotch Whisky 750ml',
    slug: 'dimple-15-year-old-blended-scotch-whisky-750ml',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dimple_15_official.png',
    isAlreadyPng: true
  },
  {
    name: 'Dimple Golden Selection Blended Scotch Whisky 700ml',
    slug: 'dimple-golden-selection-blended-scotch-whisky-700ml',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dimple_gold_0.jpg',
    isAlreadyPng: false
  },
  {
    name: 'Dimple Haig 15 Year Old Presentation Tin De Luxe Scotch Whisky 750ml',
    slug: 'dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dimple_auction_15438.jpg',
    isAlreadyPng: false
  },
  {
    name: 'Dimple 3L 1970 Rare Heritage Collector Limited Edition',
    slug: 'dimple-3l-1970-rare-heritage-collector-limited-edition',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dimple_1970_auction.jpg',
    isAlreadyPng: false
  }
];

async function run() {
  const scratchDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch';
  const results = [];

  for (const item of items) {
    console.log(`\n--- Processing: ${item.name} ---`);
    if (!fs.existsSync(item.sourceFile)) {
      console.error(`File not found: ${item.sourceFile}`);
      continue;
    }

    const folder = 'grand-store/catalog-originals/whisky/dimple';
    const uploadRes = await cloudinary.uploader.upload(item.sourceFile, {
      folder,
      public_id: item.slug,
      overwrite: true,
      resource_type: 'image'
    });

    console.log(`Uploaded: ${uploadRes.secure_url}`);

    let transparentUrl;
    if (item.isAlreadyPng) {
      // For already transparent PNG, Cloudinary provides it directly as PNG or with c_limit
      transparentUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_API_NAME || 'oioqrgj0'}/image/upload/c_limit,h_1600,w_1200/v${uploadRes.version}/${uploadRes.public_id}.png`;
    } else {
      // For white background JPG, apply Cloudinary e_background_removal
      transparentUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_API_NAME || 'oioqrgj0'}/image/upload/e_background_removal/c_limit,h_1600,w_1200/v${uploadRes.version}/${uploadRes.public_id}.png`;
    }

    console.log(`Transparent URL: ${transparentUrl}`);

    // Download and verify
    try {
      const resp = await axios.get(transparentUrl, { responseType: 'arraybuffer' });
      const savedPath = path.join(scratchDir, `${item.slug}_processed.png`);
      fs.writeFileSync(savedPath, resp.data);
      console.log(`Verified and saved: ${savedPath} (${(resp.data.length / 1024).toFixed(1)} KB)`);
      results.push({
        ...item,
        transparentUrl,
        savedPath,
        sizeKb: (resp.data.length / 1024).toFixed(1)
      });
    } catch (err) {
      console.error(`Error verifying ${item.slug}:`, err.message);
    }
  }

  console.log('\n================ PROCESSED SUMMARY ================');
  results.forEach((r, i) => {
    console.log(`${i+1}. [${r.name}] -> ${r.transparentUrl} (${r.sizeKb} KB)`);
  });

  fs.writeFileSync(path.join(scratchDir, 'dimple_results.json'), JSON.stringify(results, null, 2));
}

run().catch(console.error);
