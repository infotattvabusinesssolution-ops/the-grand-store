import sharp from 'sharp';

async function createAuctionImage() {
  const width = 1000;
  const height = 1200;

  // 1. Create dark chiaroscuro anime-luxury studio background SVG
  const bgSvg = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Deep chiaroscuro studio spotlight -->
        <radialGradient id="spotlight" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stop-color="#2a2e3a" stop-opacity="1" />
          <stop offset="30%" stop-color="#141722" stop-opacity="1" />
          <stop offset="65%" stop-color="#08090d" stop-opacity="1" />
          <stop offset="100%" stop-color="#020304" stop-opacity="1" />
        </radialGradient>

        <!-- Vertical dramatic beam -->
        <linearGradient id="lightBeam" x1="50%" y1="0%" x2="50%" y2="80%">
          <stop offset="0%" stop-color="#dfba73" stop-opacity="0.12" />
          <stop offset="45%" stop-color="#ffffff" stop-opacity="0.05" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </linearGradient>

        <!-- Golden atmospheric aura -->
        <radialGradient id="goldHalo" cx="50%" cy="46%" r="38%">
          <stop offset="0%" stop-color="#dfba73" stop-opacity="0.25" />
          <stop offset="35%" stop-color="#dfba73" stop-opacity="0.08" />
          <stop offset="80%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>

        <!-- Anime style speed rays / flare lines -->
        <linearGradient id="flareLine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#dfba73" stop-opacity="0" />
          <stop offset="50%" stop-color="#dfba73" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#dfba73" stop-opacity="0" />
        </linearGradient>

        <!-- Plinth Top Surface (polished black granite) -->
        <radialGradient id="plinthTop" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#2c303c" />
          <stop offset="60%" stop-color="#15171f" />
          <stop offset="95%" stop-color="#0c0d12" />
          <stop offset="100%" stop-color="#050609" />
        </radialGradient>

        <!-- Plinth Front Cylindrical Base -->
        <linearGradient id="plinthFront" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#08090d" />
          <stop offset="25%" stop-color="#1e212b" />
          <stop offset="50%" stop-color="#2c313d" />
          <stop offset="75%" stop-color="#181a22" />
          <stop offset="100%" stop-color="#06070a" />
        </linearGradient>

        <!-- Gold bevel highlight on plinth edge -->
        <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(223, 186, 115, 0.0)" />
          <stop offset="18%" stop-color="rgba(223, 186, 115, 0.4)" />
          <stop offset="50%" stop-color="rgba(255, 240, 195, 1.0)" />
          <stop offset="82%" stop-color="rgba(223, 186, 115, 0.4)" />
          <stop offset="100%" stop-color="rgba(223, 186, 115, 0.0)" />
        </linearGradient>

        <!-- Contact shadow under bottle -->
        <radialGradient id="contactShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.95" />
          <stop offset="40%" stop-color="#000000" stop-opacity="0.75" />
          <stop offset="80%" stop-color="#000000" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>

        <!-- Pedestal base floor shadow -->
        <radialGradient id="pedestalFloorShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.88" />
          <stop offset="60%" stop-color="#000000" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 1. Background studio wall -->
      <rect width="${width}" height="${height}" fill="url(#spotlight)" />

      <!-- 2. Anime-style dynamic light rays behind bottle -->
      <polygon points="340,0 660,0 840,920 160,920" fill="url(#lightBeam)" />
      
      <!-- Anime energy aura rings -->
      <circle cx="500" cy="510" r="380" fill="none" stroke="rgba(223, 186, 115, 0.08)" stroke-width="1" stroke-dasharray="12 8" />
      <circle cx="500" cy="510" r="320" fill="none" stroke="rgba(223, 186, 115, 0.12)" stroke-width="1.5" stroke-dasharray="4 16" />
      <circle cx="500" cy="510" r="260" fill="none" stroke="rgba(223, 186, 115, 0.16)" stroke-width="1" />

      <!-- Amber back-glow behind bottle body -->
      <circle cx="500" cy="510" r="360" fill="url(#goldHalo)" />

      <!-- 4. Pedestal floor shadow -->
      <ellipse cx="500" cy="1120" rx="430" ry="60" fill="url(#pedestalFloorShadow)" />

      <!-- 5. Plinth cylindrical cylinder body -->
      <path d="M 160 910 L 840 910 L 840 1080 Q 500 1140 160 1080 Z" fill="url(#plinthFront)" />

      <!-- 6. Plinth top ellipse -->
      <ellipse cx="500" cy="910" rx="340" ry="65" fill="url(#plinthTop)" />
      <ellipse cx="500" cy="910" rx="340" ry="65" fill="none" stroke="url(#goldRim)" stroke-width="2.5" />

      <!-- 7. Ambient floor line -->
      <line x1="40" y1="910" x2="960" y2="910" stroke="rgba(255,255,255,0.05)" stroke-width="1" />

      <!-- 8. Bottle contact shadow -->
      <ellipse cx="500" cy="908" rx="145" ry="26" fill="url(#contactShadow)" />

      <!-- 9. Anime / Tech HUD crosshairs and corner ticks -->
      <g stroke="#dfba73" stroke-width="2" stroke-opacity="0.6">
        <!-- Top Left -->
        <path d="M 50 90 L 50 50 L 90 50" fill="none" />
        <!-- Top Right -->
        <path d="M 950 90 L 950 50 L 910 50" fill="none" />
        <!-- Bottom Left -->
        <path d="M 50 1110 L 50 1150 L 90 1150" fill="none" />
        <!-- Bottom Right -->
        <path d="M 950 1110 L 950 1150 L 910 1150" fill="none" />
      </g>

      <!-- Anime HUD horizontal targeting line -->
      <line x1="80" y1="510" x2="160" y2="510" stroke="#dfba73" stroke-width="1" stroke-opacity="0.4" />
      <circle cx="170" cy="510" r="3" fill="#dfba73" fill-opacity="0.6" />
      <line x1="920" y1="510" x2="840" y2="510" stroke="#dfba73" stroke-width="1" stroke-opacity="0.4" />
      <circle cx="830" cy="510" r="3" fill="#dfba73" fill-opacity="0.6" />

      <!-- Subtle Kanji luxury seal in background: 極上 (Supreme Quality) -->
      <text x="830" y="240" font-family="'Cinzel', serif" font-size="28" font-weight="900" fill="#dfba73" fill-opacity="0.18" letter-spacing="4">極上</text>
      <text x="830" y="270" font-family="'Cinzel', serif" font-size="12" font-weight="700" fill="#dfba73" fill-opacity="0.16" letter-spacing="3">RARE LOT</text>
    </svg>
  `);

  // 2. Load and resize the bottle - made taller and bolder (760px)
  const bottleHeight = 760;
  const bottleBuffer = await sharp('public/assets/products/macallan-12-year-old-double-cask-750ml.webp')
    .resize({ height: bottleHeight })
    .toBuffer();

  const bottleMeta = await sharp(bottleBuffer).metadata();
  const bottleLeft = Math.round((width - bottleMeta.width) / 2);
  const bottleTop = 910 - bottleMeta.height + 16; // grounded on plinth

  // 3. Create realistic soft reflection
  const reflectionHeight = 95;
  const bottleBaseBuffer = await sharp(bottleBuffer)
    .extract({
      left: 0,
      top: bottleMeta.height - 130,
      width: bottleMeta.width,
      height: 130
    })
    .flip()
    .resize({ width: bottleMeta.width, height: reflectionHeight })
    .toBuffer();

  const maskSvg = Buffer.from(`
    <svg width="${bottleMeta.width}" height="${reflectionHeight}">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
          <stop offset="60%" stop-color="#ffffff" stop-opacity="0.12" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)" />
    </svg>
  `);

  const reflectionMask = await sharp(maskSvg).toBuffer();

  const maskedReflection = await sharp(bottleBaseBuffer)
    .ensureAlpha()
    .composite([
      {
        input: reflectionMask,
        blend: 'dest-in'
      }
    ])
    .toBuffer();

  // 4. Composite final image
  const finalImage = await sharp(bgSvg)
    .composite([
      {
        input: maskedReflection,
        top: 911,
        left: bottleLeft
      },
      {
        input: bottleBuffer,
        top: bottleTop,
        left: bottleLeft
      }
    ])
    .webp({ quality: 95 })
    .toFile('public/assets/auction-bw-bottle.webp');

  console.log('Anime-infused luxury auction image rendered:', finalImage);
}

createAuctionImage().catch(console.error);
