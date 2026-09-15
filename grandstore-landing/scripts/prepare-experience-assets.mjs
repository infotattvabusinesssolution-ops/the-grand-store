import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function prepareAssets() {
  const source1 = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/f54edd9f-0d14-49e2-8d87-b16da8ede5fb/.user_uploaded/media_1789389372742.jpg';
  const source2 = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/f54edd9f-0d14-49e2-8d87-b16da8ede5fb/.user_uploaded/media_1789389390302.png';

  const out1 = 'public/assets/experiences-ron-abuelo.webp';
  const out2 = 'public/assets/experiences-mystic-oak.webp';

  console.log('Processing Ron Abuelo image...');
  await sharp(source1)
    .resize({ width: 1000, height: 1250, fit: 'cover' })
    .webp({ quality: 92 })
    .toFile(out1);
  console.log('Saved:', out1);

  console.log('Processing Mystic Oak image...');
  await sharp(source2)
    .resize({ width: 1000, height: 1250, fit: 'cover' })
    .webp({ quality: 92 })
    .toFile(out2);
  console.log('Saved:', out2);

  // Also create a subtle atmospheric faded cellar background with warm amber glow
  const bgSvg = Buffer.from(`
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ambience" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#141724" stop-opacity="1" />
          <stop offset="35%" stop-color="#0c0e16" stop-opacity="1" />
          <stop offset="70%" stop-color="#06070a" stop-opacity="1" />
          <stop offset="100%" stop-color="#020305" stop-opacity="1" />
        </radialGradient>
        <radialGradient id="amberGlow" cx="50%" cy="40%" r="40%">
          <stop offset="0%" stop-color="#dfba73" stop-opacity="0.12" />
          <stop offset="60%" stop-color="#dfba73" stop-opacity="0.02" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#ambience)" />
      <circle cx="960" cy="450" r="500" fill="url(#amberGlow)" />
      <!-- Subtle watermark typography -->
      <text x="50%" y="42%" text-anchor="middle" font-family="'Cinzel', serif" font-size="110" font-weight="900" fill="#dfba73" fill-opacity="0.03" letter-spacing="16">GRAND SALON</text>
      <text x="50%" y="54%" text-anchor="middle" font-family="'Cinzel', serif" font-size="42" font-weight="700" fill="#ffffff" fill-opacity="0.02" letter-spacing="24">PRIVATE CELLAR TASTING FLIGHTS</text>
    </svg>
  `);

  await sharp(bgSvg)
    .webp({ quality: 90 })
    .toFile('public/assets/experiences-faded-bg.webp');
  console.log('Saved: public/assets/experiences-faded-bg.webp');
}

prepareAssets().catch(console.error);
