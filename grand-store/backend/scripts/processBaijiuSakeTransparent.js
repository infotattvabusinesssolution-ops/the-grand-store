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
    category: 'baijiu',
    name: 'Fenjiu Qinghua 20 Year Old Baijiu 500ml',
    slug: 'fenjiu-qinghua-20-year-old',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/fenjiu_qinghua_20_bottle_1792565092818.jpg'
  },
  {
    category: 'baijiu',
    name: 'Fen Jiu Red Label (Fen Chiew) Baijiu 500ml',
    slug: 'fen-jiu-red-label-fen-chiew',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/fenjiu_red_label_bottle_1792565117693.jpg'
  },
  {
    category: 'baijiu',
    name: 'Guizhou XIJIU Friends Series Baijiu (Blue Bottle) 500ml',
    slug: 'guizhou-xijiu-friends-series-blue-bottle',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/guizhou_xijiu_blue_bottle_1792565070090.jpg'
  },
  {
    category: 'sake',
    name: 'Gekkeikan Traditional Junmai-shu Sake 720ml',
    slug: 'gekkeikan-traditional-junmai-sake-720ml',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/gekkeikan_traditional_junmai_1792570142564.jpg'
  },
  {
    category: 'sake',
    name: 'Dassai 45 Junmai Daiginjo Sake 720ml',
    slug: 'dassai-45-junmai-daiginjo-sake-720ml',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/dassai_45_junmai_daiginjo_1792570208789.jpg'
  },
  {
    category: 'sake',
    name: 'Gold Gekkeikan Junmai-shu Sake with Gold Leaf 720ml',
    slug: 'gold-gekkeikan-junmai-sake-with-gold-leaf-720ml',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/gold_gekkeikan_gold_leaf_1792570161448.jpg'
  },
  {
    category: 'sake',
    name: 'Super Kinokuni Junmai Sake 720ml',
    slug: 'super-kinokuni-junmai-sake-720ml',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/super_kinokuni_junmai_1792570186589.jpg'
  },
  {
    category: 'sake',
    name: 'Dassai 23 Junmai Daiginjo Super Premium Sake 720ml',
    slug: 'dassai-23-junmai-daiginjo-super-premium-sake-720ml',
    sourceFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/dassai_23_super_premium_1792570230468.jpg'
  }
];

async function processAll() {
  const scratchDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch';
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const results = [];

  for (const item of items) {
    console.log(`\nProcessing: ${item.name}`);
    if (!fs.existsSync(item.sourceFile)) {
      console.error(`Source file not found: ${item.sourceFile}`);
      continue;
    }

    // Upload clean original to Cloudinary in a clean folder
    const folder = `grand-store/catalog-originals/${item.category}`;
    const uploadRes = await cloudinary.uploader.upload(item.sourceFile, {
      folder,
      public_id: item.slug,
      overwrite: true,
      resource_type: 'image'
    });

    console.log(`Uploaded to Cloudinary: ${uploadRes.secure_url}`);
    console.log(`Public ID: ${uploadRes.public_id}, Version: ${uploadRes.version}`);

    // Construct the transparent background removal URL matching the Whisky standard:
    // https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v${uploadRes.version}/${uploadRes.public_id}.png
    const transparentUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_API_NAME || 'oioqrgj0'}/image/upload/e_background_removal/c_limit,h_1600,w_1200/v${uploadRes.version}/${uploadRes.public_id}.png`;

    console.log(`Generated Transparent URL: ${transparentUrl}`);

    // Verify and download sample
    try {
      const resp = await axios.get(transparentUrl, { responseType: 'arraybuffer' });
      const localPngPath = path.join(scratchDir, `${item.slug}.png`);
      fs.writeFileSync(localPngPath, resp.data);
      console.log(`Successfully verified and saved: ${localPngPath} (${(resp.data.length / 1024).toFixed(1)} KB)`);
      results.push({
        ...item,
        transparentUrl,
        localPngPath,
        sizeKb: (resp.data.length / 1024).toFixed(1)
      });
    } catch (err) {
      console.error(`Failed to fetch transparent URL for ${item.name}:`, err.message);
    }
  }

  console.log('\n================ SUMMARY ================');
  results.forEach((r, i) => {
    console.log(`${i+1}. [${r.name}] -> ${r.transparentUrl} (${r.sizeKb} KB)`);
  });

  fs.writeFileSync(
    path.join(scratchDir, 'processed_transparent_images.json'),
    JSON.stringify(results, null, 2)
  );
}

processAll().catch(console.error);
