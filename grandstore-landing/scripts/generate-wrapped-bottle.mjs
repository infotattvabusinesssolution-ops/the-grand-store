import sharp from 'sharp';
import fs from 'fs';

async function createWrappedBottle() {
  const width = 700;
  const height = 1200;

  // Extract the top neck of wine-bottle.png (width: 146, height: 508)
  const neckBuffer = await sharp('public/assets/bottles/wine-bottle.png')
    .extract({ left: 0, top: 0, width: 146, height: 300 })
    .toBuffer();

  const neckResized = await sharp(neckBuffer)
    .resize(200, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // 1. Back paper layer behind the bottle neck
  const svgBack = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="backPaperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#b8aa95" />
        <stop offset="45%" stop-color="#cfc2af" />
        <stop offset="100%" stop-color="#998974" />
      </linearGradient>
    </defs>
    <!-- Crumpled back paper flaring behind bottle neck, rising high like crumpled tissue -->
    <path d="M210,400 
             C160,300 145,190 215,120 
             C255,80 290,170 325,145 
             C360,120 400,75 450,110 
             C505,145 540,240 500,380 
             Z" 
          fill="url(#backPaperGrad)" />
    <!-- Deep inner shadows behind the neck -->
    <path d="M230,370 Q350,410 470,370 L480,400 Q350,440 220,400 Z" fill="rgba(25, 18, 12, 0.55)" />
  </svg>
  `;

  // 2. Front paper wrap (wrapped around the bottle with crinkles, folds, pattern & seal)
  const svgFront = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Drop shadow filter -->
      <filter id="dropShadow" x="-35%" y="-20%" width="170%" height="150%">
        <feDropShadow dx="24" dy="42" stdDeviation="30" flood-color="rgba(18, 14, 10, 0.55)" />
        <feDropShadow dx="8" dy="16" stdDeviation="14" flood-color="rgba(25, 18, 12, 0.28)" />
      </filter>

      <!-- Soft ground shadow for the white section -->
      <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="rgba(20, 15, 10, 0.70)" />
        <stop offset="42%" stop-color="rgba(32, 24, 16, 0.35)" />
        <stop offset="72%" stop-color="rgba(45, 32, 22, 0.10)" />
        <stop offset="100%" stop-color="transparent" />
      </radialGradient>

      <!-- Paper Shading Gradient -->
      <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#cfc4b4" />
        <stop offset="10%" stop-color="#ebe3d6" />
        <stop offset="32%" stop-color="#faf6f0" />
        <stop offset="68%" stop-color="#f3ece1" />
        <stop offset="88%" stop-color="#ded4c4" />
        <stop offset="100%" stop-color="#c5b9a6" />
      </linearGradient>

      <!-- Delicate Botanical Floral Pattern matching NAVÍNKO -->
      <pattern id="botanical" width="130" height="130" patternUnits="userSpaceOnUse" opacity="0.30">
        <path d="M25,50 C45,25 75,25 95,50 C75,75 45,75 25,50 Z" fill="none" stroke="#7a6750" stroke-width="1.6" />
        <circle cx="60" cy="50" r="5" fill="#8f785e" />
        <circle cx="42" cy="42" r="3.5" fill="#8f785e" />
        <circle cx="78" cy="58" r="3.5" fill="#8f785e" />
        <path d="M60,50 C70,30 90,25 105,35 C92,48 80,44 60,50 Z" fill="none" stroke="#7a6750" stroke-width="1.4" />
        <path d="M60,50 C50,70 30,75 15,65 C28,52 40,56 60,50 Z" fill="none" stroke="#7a6750" stroke-width="1.4" />
        <path d="M25,110 Q60,125 95,110 Q120,85 85,85 Z" fill="none" stroke="#7a6750" stroke-width="1.4" />
        <circle cx="60" cy="105" r="4" fill="#8f785e" />
      </pattern>

      <!-- Crinkle Facet Gradients -->
      <linearGradient id="crinkleLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.70)" />
        <stop offset="45%" stop-color="rgba(215, 205, 190, 0.12)" />
        <stop offset="100%" stop-color="rgba(55, 40, 25, 0.32)" />
      </linearGradient>

      <linearGradient id="crinkleRight" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.60)" />
        <stop offset="50%" stop-color="rgba(215, 205, 190, 0.10)" />
        <stop offset="100%" stop-color="rgba(45, 30, 18, 0.36)" />
      </linearGradient>
    </defs>

    <!-- Ground Contact Shadow for realistic 3D floor placement -->
    <ellipse cx="350" cy="1125" rx="270" ry="46" fill="url(#groundShadow)" />

    <g filter="url(#dropShadow)">
      <!-- Main Crumpled Paper Body with Organic Shoulders Rising Around Neck -->
      <path d="M195,250 
               C155,215 170,300 162,400
               C152,530 148,700 158,870
               C165,990 178,1050 230,1090
               C280,1112 365,1112 425,1095
               C480,1070 515,1030 522,940
               C532,800 528,630 532,480
               C536,360 545,265 505,215
               C470,175 455,255 410,295
               C375,325 330,325 295,290
               C260,255 235,285 195,250
               Z" 
            fill="url(#paperGrad)" />

      <!-- Botanical Pattern Overlay -->
      <path d="M195,250 
               C155,215 170,300 162,400
               C152,530 148,700 158,870
               C165,990 178,1050 230,1090
               C280,1112 365,1112 425,1095
               C480,1070 515,1030 522,940
               C532,800 528,630 532,480
               C536,360 545,265 505,215
               C470,175 455,255 410,295
               C375,325 330,325 295,290
               C260,255 235,285 195,250
               Z" 
            fill="url(#botanical)" />

      <!-- Crinkle Facet 1: Left Paper Flap -->
      <path d="M195,250 Q160,400 170,570 Q180,760 160,960 Q240,1065 285,1085 Q240,900 230,710 Q220,520 295,290 Z" 
            fill="url(#crinkleLeft)" opacity="0.88" />

      <!-- Crinkle Facet 2: Right Paper Flap Overlap -->
      <path d="M505,215 Q535,380 525,550 Q515,740 520,940 Q455,1075 415,1095 Q460,910 450,720 Q440,530 410,295 Z" 
            fill="url(#crinkleRight)" opacity="0.88" />

      <!-- Realistic Crumple Ridges and Highlights -->
      <!-- Center Main Ridge -->
      <path d="M350,310 Q320,465 360,615 Q400,765 360,915 Q330,1030 355,1105" 
            fill="none" stroke="rgba(60, 40, 25, 0.38)" stroke-width="5.5" />
      <path d="M353,310 Q323,465 363,615 Q403,765 363,915 Q333,1030 358,1105" 
            fill="none" stroke="rgba(255, 255, 255, 0.80)" stroke-width="3.5" />

      <!-- Left Diagonal Creases -->
      <path d="M162,400 Q250,445 350,410 Q230,540 175,570" 
            fill="none" stroke="rgba(65, 45, 30, 0.28)" stroke-width="3.5" />
      <path d="M164,400 Q252,445 352,410 Q232,540 177,570" 
            fill="none" stroke="rgba(255, 255, 255, 0.50)" stroke-width="2" />

      <!-- Right Diagonal Creases -->
      <path d="M528,430 Q440,475 360,440 Q460,580 522,610" 
            fill="none" stroke="rgba(65, 45, 30, 0.28)" stroke-width="3.5" />
      <path d="M530,430 Q442,475 362,440 Q462,580 524,610" 
            fill="none" stroke="rgba(255, 255, 255, 0.50)" stroke-width="2" />

      <!-- Waist Crease -->
      <path d="M158,680 Q270,720 370,675 Q465,715 528,670" 
            fill="none" stroke="rgba(60, 40, 25, 0.35)" stroke-width="4.5" />
      <path d="M160,680 Q272,720 372,675 Q467,715 530,670" 
            fill="none" stroke="rgba(255, 255, 255, 0.70)" stroke-width="2.5" />

      <!-- Lower Body Crumples -->
      <path d="M160,880 Q285,915 385,870 Q475,910 520,875" 
            fill="none" stroke="rgba(60, 40, 25, 0.30)" stroke-width="4" />
      <path d="M162,880 Q287,915 387,870 Q477,910 522,875" 
            fill="none" stroke="rgba(255, 255, 255, 0.60)" stroke-width="2" />

      <!-- Authentic Red Brand Stamp (Matching NAVÍNKO) -->
      <g transform="translate(245, 720) rotate(-11)">
        <rect x="-14" y="-24" width="225" height="68" rx="8" 
              fill="none" stroke="rgba(220, 42, 20, 0.88)" stroke-width="3" stroke-dasharray="175 8 30 6" />
        <text x="100" y="15" 
              text-anchor="middle" 
              fill="rgba(220, 42, 20, 0.95)" 
              font-family="'Playfair Display', Georgia, serif" 
              font-size="27" 
              font-weight="bold" 
              letter-spacing="5.5">
          GRAND STORE
        </text>
        <text x="100" y="32" 
              text-anchor="middle" 
              fill="rgba(220, 42, 20, 0.88)" 
              font-family="sans-serif" 
              font-size="10.5" 
              font-weight="700" 
              letter-spacing="3.5">
          PRIVATE CELLAR · ZA
        </text>
      </g>

      <!-- Crisp Flared Paper Collar Rim (Torn paper edges opening around neck) -->
      <path d="M195,250 
               C230,195 265,260 295,290
               C330,325 375,325 410,295
               C455,255 470,175 505,215
               L490,245 
               C460,205 440,275 405,315
               C365,345 325,345 290,310
               C255,275 225,225 195,250
               Z" 
            fill="#ffffff" 
            opacity="0.92" />

      <!-- Shadow Cast by Collar Onto Neck Opening -->
      <path d="M290,310 Q350,350 410,300 L405,315 Q350,360 290,325 Z" fill="rgba(25, 16, 8, 0.55)" />
    </g>
  </svg>
  `;

  // Composite: Neck placed between back and front
  const compositeMid = await sharp(Buffer.from(svgBack))
    .composite([
      {
        input: neckResized,
        top: 25,
        left: 250,
      },
      {
        input: Buffer.from(svgFront),
        top: 0,
        left: 0,
      }
    ])
    .png()
    .toFile('public/assets/wrapped-wine-bottle.png');

  console.log('Created ultra wrapped-wine-bottle.png successfully:', compositeMid);
}

createWrappedBottle().catch(console.error);
