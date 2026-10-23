const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function inspectUrl(url, label) {
  try {
    const resp = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(resp.data);
    const meta = await sharp(buffer).metadata();
    const stats = await sharp(buffer).stats();
    
    // Check corner pixels (0,0) and (width-1, 0)
    const raw = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
    const channels = raw.info.channels;
    const topLeft = [];
    for (let c = 0; c < channels; c++) topLeft.push(raw.data[c]);
    
    console.log(`\n=== [${label}] ===`);
    console.log(`URL: ${url}`);
    console.log(`Format: ${meta.format}, Size: ${meta.width}x${meta.height}, Channels: ${meta.channels}, HasAlpha: ${meta.hasAlpha}`);
    console.log(`TopLeft pixel [RGBA]:`, topLeft);
    console.log(`Channels stats (mean):`, stats.channels.map(c => Math.round(c.mean)));
  } catch (err) {
    console.error(`Error inspecting ${label}:`, err.message);
  }
}

async function inspectLocal(filePath, label) {
  try {
    const meta = await sharp(filePath).metadata();
    const stats = await sharp(filePath).stats();
    console.log(`\n=== [LOCAL: ${label}] ===`);
    console.log(`File: ${filePath}`);
    console.log(`Format: ${meta.format}, Size: ${meta.width}x${meta.height}, Channels: ${meta.channels}, HasAlpha: ${meta.hasAlpha}`);
    console.log(`Channels stats (mean):`, stats.channels.map(c => Math.round(c.mean)));
  } catch (err) {
    console.error(`Error inspecting local ${label}:`, err.message);
  }
}

async function run() {
  await inspectLocal('C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/ballantines_30_whisky_1792585829051.jpg', 'Ballantines 30');
  await inspectLocal('C:/Users/HP/.gemini/antigravity-ide/brain/ab795a1c-8e59-4bfd-8db6-40f3b1262d01/fenjiu_qinghua_20_bottle_1792565092818.jpg', 'Original Fenjiu Qinghua');
  
  await inspectUrl('https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1787994833/grand-store/catalog-originals/prod-1787654844502-37.png', 'Baijiu: Moutai Banquet Red (Cloudinary)');
  await inspectUrl('https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1787994724/grand-store/catalog-originals/prod-1787653937694-947.png', 'Whisky: FEW Bourbon (Cloudinary)');
  await inspectUrl('https://res.cloudinary.com/oioqrgj0/image/upload/v1792585870/grandstore-uploads/products/whisky/ballantines-30-year-old-very-rare-blended-scotch-whisky-750ml.jpg', 'Whisky: Ballantines 30 Cloudinary');
}

run();
