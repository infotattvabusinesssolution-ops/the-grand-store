import sharp from 'sharp';
import fs from 'fs';

async function createWineEventPack() {
  const width = 800;
  const height = 650;

  // 1. Extract bottle from wine-bottle.png and resize
  const wineBottle = await sharp('public/assets/bottles/wine-bottle.png')
    .resize(null, 440)
    .toBuffer();

  // 2. Extract wrapped bottle from wrapped-wine-bottle.png and resize
  const wrappedBottle = await sharp('public/assets/wrapped-wine-bottle.png')
    .resize(null, 460)
    .toBuffer();

  // 3. SVG Box & Interior & Labeling
  const svgBox = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Shadow -->
      <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="rgba(0, 0, 0, 0.75)" />
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgba(212, 175, 55, 0.15)" />
      </filter>

      <!-- Soft ground shadow -->
      <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(0, 0, 0, 0.85)" />
        <stop offset="50%" stop-color="rgba(0, 0, 0, 0.35)" />
        <stop offset="80%" stop-color="rgba(0, 0, 0, 0.05)" />
        <stop offset="100%" stop-color="transparent" />
      </radialGradient>

      <!-- Luxury Matte Black Box Gradient -->
      <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#18191e" />
        <stop offset="40%" stop-color="#121316" />
        <stop offset="100%" stop-color="#0a0b0d" />
      </linearGradient>

      <!-- Velvet Tray Gradient -->
      <linearGradient id="velvetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0e0f12" />
        <stop offset="100%" stop-color="#1a1b20" />
      </linearGradient>

      <!-- Gold Foil Gradient -->
      <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#dfba73" />
        <stop offset="50%" stop-color="#f5e1a8" />
        <stop offset="100%" stop-color="#c49b42" />
      </linearGradient>
    </defs>

    <!-- Ground Contact Shadow -->
    <ellipse cx="400" cy="580" rx="360" ry="40" fill="url(#groundShadow)" />

    <!-- Main Presentation Box Body -->
    <g filter="url(#boxShadow)">
      <!-- Outer Box Base -->
      <rect x="70" y="140" width="660" height="420" rx="14" fill="url(#boxGrad)" stroke="rgba(212, 175, 55, 0.35)" stroke-width="1.5" />

      <!-- Inset Gold Hairline Border -->
      <rect x="82" y="152" width="636" height="396" rx="10" fill="none" stroke="rgba(212, 175, 55, 0.18)" stroke-width="1" />

      <!-- Inner Velvet Recessed Compartment for Bottles -->
      <rect x="96" y="166" width="608" height="368" rx="8" fill="url(#velvetGrad)" stroke="#050608" stroke-width="2" />

      <!-- Luxury Gold Foil Stamp Top Header on Box Rim -->
      <text x="400" y="125" text-anchor="middle" fill="url(#goldFoil)" font-family="'Cormorant Garamond', Georgia, serif" font-size="16" letter-spacing="4" font-weight="600">
        PRIVATE TASTING EVENT COLLECTION
      </text>

      <!-- Left Bottle Cradle Slot -->
      <rect x="130" y="190" width="220" height="320" rx="12" fill="rgba(0,0,0,0.4)" stroke="rgba(212, 175, 55, 0.1)" stroke-width="1" />
      
      <!-- Right Bottle Cradle Slot -->
      <rect x="450" y="190" width="220" height="320" rx="12" fill="rgba(0,0,0,0.4)" stroke="rgba(212, 175, 55, 0.1)" stroke-width="1" />

      <!-- Center Divider Ribbon & Seal -->
      <rect x="396" y="166" width="8" height="368" fill="rgba(212, 175, 55, 0.25)" />

      <!-- Gold Wax Seal Stamp in Center -->
      <g transform="translate(400, 350)">
        <circle cx="0" cy="0" r="28" fill="#121316" stroke="url(#goldFoil)" stroke-width="2" />
        <circle cx="0" cy="0" r="24" fill="none" stroke="rgba(212, 175, 55, 0.4)" stroke-width="1" stroke-dasharray="3 3" />
        <text x="0" y="5" text-anchor="middle" fill="url(#goldFoil)" font-family="'Cormorant Garamond', Georgia, serif" font-size="16" font-weight="bold">
          GS
        </text>
      </g>

      <!-- Sommelier Envelope Card inside box -->
      <g transform="translate(470, 420) rotate(-4)">
        <rect x="0" y="0" width="180" height="90" rx="4" fill="#f8f5ee" stroke="#d5ccbe" stroke-width="1" />
        <rect x="6" y="6" width="168" height="78" rx="2" fill="none" stroke="#e8e2d5" stroke-width="1" />
        <text x="90" y="36" text-anchor="middle" fill="#1b1c1e" font-family="'Cormorant Garamond', Georgia, serif" font-size="12" letter-spacing="2" font-weight="bold">
          TASTING FLIGHT NOTES
        </text>
        <text x="90" y="54" text-anchor="middle" fill="#756f62" font-family="sans-serif" font-size="8" letter-spacing="1">
          2 × ESTATE ALLOCATIONS
        </text>
        <circle cx="90" cy="70" r="5" fill="#d4af37" />
      </g>
    </g>
  </svg>
  `;

  // 4. Composite the bottles onto the box
  const boxBase = await sharp(Buffer.from(svgBox))
    .png()
    .toBuffer();

  const finalPack = await sharp(boxBase)
    .composite([
      {
        input: wineBottle,
        top: 80,
        left: 175,
      },
      {
        input: wrappedBottle,
        top: 65,
        left: 455,
      },
    ])
    .png()
    .toFile('public/assets/wine-event-pack.png');

  console.log('Created wine-event-pack.png successfully:', finalPack);
}

createWineEventPack().catch(console.error);
