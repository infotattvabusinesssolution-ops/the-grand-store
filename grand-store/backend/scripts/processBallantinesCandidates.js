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

const scratch = 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch';

const candidates = [
  {
    id: 'ballantines_30',
    file: path.join(scratch, 'twe_bal_12.jpg'),
    isPng: false
  },
  {
    id: 'ballantines_17',
    file: path.join(scratch, 'twe_bal_4.jpg'),
    isPng: false
  },
  {
    id: 'ballantines_4_5l_cradle',
    file: path.join(scratch, 'dom_whisky_4_5l_2.jpg'),
    isPng: false
  },
  {
    id: 'ballantines_3l_cradle',
    file: path.join(scratch, 'gn_3l_stand_0.jpg'),
    isPng: false
  },
  {
    id: 'ballantines_finest',
    file: path.join(scratch, 'twe_bal_5.jpg'),
    isPng: false
  },
  {
    id: 'ballantines_hard_fired',
    file: path.join(scratch, 'finedrams_hard_fired_orig.jpg'),
    isPng: true
  },
  {
    id: 'ballantines_21_box',
    file: path.join(scratch, 'twe_bal_10.jpg'),
    isPng: false
  },
  {
    id: 'ballantines_21_bottle',
    file: path.join(scratch, 'current_p7_21yo.jpg'),
    isPng: false
  }
];

async function run() {
  for (const c of candidates) {
    if (!fs.existsSync(c.file)) {
      console.log('Skipping missing:', c.file);
      continue;
    }
    console.log(`Uploading ${c.id}...`);
    const up = await cloudinary.uploader.upload(c.file, {
      folder: 'grand-store/catalog-originals/whisky/ballantines/test',
      public_id: c.id,
      overwrite: true,
      resource_type: 'image'
    });
    console.log(`Uploaded ${c.id}: ${up.secure_url}`);

    let transUrl;
    if (c.isPng) {
      transUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_API_NAME || 'oioqrgj0'}/image/upload/c_limit,h_1600,w_1200/v${up.version}/${up.public_id}.png`;
    } else {
      transUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_API_NAME || 'oioqrgj0'}/image/upload/e_background_removal/c_limit,h_1600,w_1200/v${up.version}/${up.public_id}.png`;
    }

    try {
      const resp = await axios.get(transUrl, { responseType: 'arraybuffer' });
      const outPath = path.join(scratch, `${c.id}_bgrem.png`);
      fs.writeFileSync(outPath, resp.data);
      console.log(`Saved ${c.id} bgrem: ${resp.data.length} bytes`);
    } catch (e) {
      console.error(`Error removing background for ${c.id}:`, e.message);
    }
  }
}

run().catch(console.error);
