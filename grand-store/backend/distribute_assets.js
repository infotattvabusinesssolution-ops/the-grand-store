const fs = require('fs');
const path = require('path');

const processedDir = path.join(__dirname, 'processed_images');

const mapping = {
  'image_1_2_241x376.png': 'tshireletso-white.png',
  'image_1_4_258x389.png': 'tshireletso-red.png',
  'image_1_6_248x416.png': 'sekhothali.png', // Or whatever name is used
  'image_2_2_362x419.png': 'moremoholo.png',
  'image_2_4_377x407.png': 'makhosonke.png',
  'image_2_6_377x394.png': 'depizan-sparkling-white.png',
  'image_3_2_566x602.png': 'depizan-sparkling-red.png',
  'image_3_4_360x572.png': 'depizan-rouge.png',
  'image_3_6_268x384.png': 'depizan-fraisch.png',
  'image_4_1_1395x780.png': 'depizan-cerise.png'
};

const targets = [
  // grand-store web
  path.join(__dirname, '..', '..', 'grand-storelocal', 'frontend', 'public', 'assets', 'products', 'wine-grandstore'),
  // grandstore-landing
  path.join(__dirname, '..', '..', 'grandstore-landing', 'public', 'assets', 'products'),
  // react native app
  path.join(__dirname, '..', '..', 'TheGrandStore', 'assets', 'products')
];

for (const target of targets) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
}

for (const [sourceName, destName] of Object.entries(mapping)) {
  const sourcePath = path.join(processedDir, sourceName);
  
  if (fs.existsSync(sourcePath)) {
    for (const target of targets) {
      const destPath = path.join(target, destName);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${destName} to ${target}`);
    }
  } else {
    console.log(`Warning: Source file ${sourceName} not found.`);
  }
}
