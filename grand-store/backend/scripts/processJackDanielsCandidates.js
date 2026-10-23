const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
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
const outDir = path.join(scratch, 'jd_bgrem');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const candidates = [
  {
    id: 'p1_sb_rye_700ml',
    file: path.join(scratch, 'candidates/sb_rye_70cl_175.jpg')
  },
  {
    id: 'p2_md5_bottle_750ml',
    file: path.join(scratch, 'md5_bottle_crop.jpg')
  },
  {
    id: 'p3_gentleman_jack_750ml',
    file: path.join(scratch, 'candidates/gentleman_jack_1.jpg')
  },
  {
    id: 'p4_sb_rye_750ml',
    file: path.join(scratch, 'official_jd_sb_rye.png')
  },
  {
    id: 'p5_md5_1l_box',
    file: path.join(scratch, 'candidates/master_distiller_5_box_183.jpg')
  },
  {
    id: 'p6_gentleman_jack_box',
    file: path.join(scratch, 'candidates/gentleman_jack_with_box_176.jpg')
  },
  {
    id: 'p7_old_no_7_750ml',
    file: path.join(scratch, 'candidates/old_no_7_1.jpg')
  },
  {
    id: 'p8_old_no_7_magnum_15l',
    file: path.join(scratch, 'candidates/old_no_7_magnum_63.jpg')
  },
  {
    id: 'p9_sinatra_select_1l',
    file: path.join(scratch, 'sinatra_twe_1000.jpg')
  }
];

async function run() {
  console.log('=== Processing Jack Daniels Candidates with Cloudinary Background Removal ===');

  for (const c of candidates) {
    if (!fs.existsSync(c.file)) {
      console.warn(`File not found: ${c.file}`);
      continue;
    }

    const dest = path.join(outDir, `${c.id}_bgrem.png`);

    // p4 is already a high-res transparent PNG from official site
    if (c.id === 'p4_sb_rye_750ml') {
      fs.copyFileSync(c.file, dest);
      console.log(`[${c.id}] Copied official transparent PNG directly: ${dest}`);
      continue;
    }

    console.log(`\nUploading ${c.id} (${c.file})...`);
    const up = await cloudinary.uploader.upload(c.file, {
      folder: 'grand-store/catalog-originals/whisky/jack-daniels/test',
      public_id: `${c.id}_raw`,
      overwrite: true,
      resource_type: 'image'
    });

    // Cloudinary e_background_removal URL with .png extension explicitly at the end
    const cloudName = process.env.CLOUDINARY_API_NAME || 'oioqrgj0';
    const bgRemovedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_background_removal/c_limit,h_1600,w_1200/v${up.version}/${up.public_id}.png`;

    console.log(`Generated removal URL: ${bgRemovedUrl}`);
    console.log(`Downloading background-removed PNG to ${dest}...`);

    let attempts = 0;
    let downloaded = false;
    while (attempts < 6 && !downloaded) {
      attempts++;
      try {
        await new Promise(r => setTimeout(r, 2000));
        const res = await axios.get(bgRemovedUrl, { responseType: 'arraybuffer', timeout: 30000 });
        if (res.status === 200 && res.data.length > 10000) {
          fs.writeFileSync(dest, res.data);
          downloaded = true;
          console.log(`Successfully downloaded ${dest} (${res.data.length} bytes)`);
        }
      } catch (e) {
        console.log(`Attempt ${attempts} failed: ${e.message}, retrying...`);
      }
    }

    if (!downloaded) {
      console.error(`Failed to download bg removed image for ${c.id}`);
    }
  }
}

run().catch(console.error);
