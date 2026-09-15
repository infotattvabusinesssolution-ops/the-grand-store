"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowCounterClockwise,
  HandGrabbing,
  Pause,
  Play,
  Sparkle,
  ArrowsClockwise,
} from "@phosphor-icons/react";

export const BOTTLE_PRESETS = [
  {
    id: "champagne",
    name: "Grand Reserve Champagne",
    badge: "Prestige Cuvée • Vintage 2018",
    category: "Champagne",
    vintage: "2018",
    points: "98 Pts",
    abv: "12.5% ABV",
    terroir: "Épernay & Western Cape",
    tagline: "Golden Brioche, White Truffle & Persistent Fine Bead",
    barrel: "Chalk Caves • 48 Mos on Lees",
    quote:
      "“From the polished cellar service to the chalk caves, every moment exudes elegance. A persistent fine bead with luminous toasted brioche and white truffle notes.”",
    sommelier: "Jean-Luc Moreau, Master Sommelier",
    glassColor: 0x0c140d, // Deep antique champagne green
    liquidColor: 0xd6a838, // Golden champagne
    foilColor: 0xd4af37, // Bright metallic gold
    accentRgb: "223, 186, 115",
    labelTitle: "CUVÉE PRESTIGE",
    labelSub: "GRAND RESERVE BRUT",
  },
  {
    id: "wine",
    name: "Heritage Reserve Cabernet",
    badge: "Stellenbosch Valley • Single Vineyard",
    category: "Fine Wine",
    vintage: "2019",
    points: "96 Pts",
    abv: "14.5% ABV",
    terroir: "Simonsberg Slopes • Granite Soil",
    tagline: "Crushed Cassis, French Cedar & Velvety Tannins",
    barrel: "French Allier Oak • 22 Mos Aged",
    quote:
      "“Deep granite soils give this vintage unforgettable tension and length. Layered blackberry compote, graphite, and seamless French oak tannins.”",
    sommelier: "Elena Van Der Merwe, Estate Cellarmaster",
    glassColor: 0x120709, // Deep burgundy tint
    liquidColor: 0x5e0f1e, // Deep ruby red wine
    foilColor: 0x781223, // Royal crimson burgundy foil
    accentRgb: "168, 50, 72",
    labelTitle: "ESTATE CABERNET",
    labelSub: "STELLENBOSCH RESERVE",
  },
  {
    id: "whisky",
    name: "Sovereign Highland Malt",
    badge: "18-Year Single Malt • Cask Strength",
    category: "Single Malt",
    vintage: "18 Year",
    points: "97 Pts",
    abv: "48.2% ABV",
    terroir: "Highland Springwater • Peat",
    tagline: "Wild Heather Honey, Candied Peels & Smoke",
    barrel: "First-Fill Oloroso Sherry Butts",
    quote:
      "“Un-chillfiltered liquid amber from first-fill Spanish oak butts. Dried Seville orange peel, honeyed heather, and an ethereal wisp of peat smoke.”",
    sommelier: "Alistair Campbell, Keeper of the Quaich",
    glassColor: 0x1a160f, // Heavy clear flint glass
    liquidColor: 0xb86c1d, // Deep amber whisky
    foilColor: 0x1a1a1a, // Matte black & gold neck wrap
    accentRgb: "217, 125, 41",
    labelTitle: "HIGHLAND RESERVE",
    labelSub: "18 YEARS OLD SINGLE MALT",
  },
  {
    id: "cognac",
    name: "Premier Cru XO Cognac",
    badge: "Grande Champagne • Master Reserve",
    category: "Cognac",
    vintage: "XO Extra",
    points: "99 Pts",
    abv: "40.0% ABV",
    terroir: "Charente Chalk Terroir",
    tagline: "Dried Figs, Orange Blossom & Ancient Rancio",
    barrel: "Ancient Limousin Oak • Tier 1",
    quote:
      "“Distilled exclusively from Premier Cru Grande Champagne grapes. An aristocratic rancio of dried Smyrna figs, cedar cigar boxes, and candied iris.”",
    sommelier: "Henri de Rochefort, Cellar Master",
    glassColor: 0x1a110a, // Rich cognac glass
    liquidColor: 0xa85618, // Glowing copper mahogany
    foilColor: 0xc47b2b, // Antique brushed copper
    accentRgb: "207, 145, 68",
    labelTitle: "XO PREMIER CRU",
    labelSub: "GRANDE CHAMPAGNE COGNAC",
  },
];

// --------------------------------------------------------------------------
// Procedural Ultra-Crisp Canvas Label Generator
// Generates genuine luxury metallic gold labels for front and back of bottle
// --------------------------------------------------------------------------
function generateFrontLabel(preset) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Rich parchment / textured charcoal background
  ctx.fillStyle = "#12100d";
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle paper grain overlay
  const grad = ctx.createRadialGradient(512, 512, 100, 512, 512, 520);
  grad.addColorStop(0, "rgba(28, 23, 17, 1)");
  grad.addColorStop(1, "rgba(12, 10, 8, 1)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Gold foil gradients
  const goldGrad = ctx.createLinearGradient(100, 100, 924, 924);
  goldGrad.addColorStop(0, "#fae7be");
  goldGrad.addColorStop(0.35, "#dfba73");
  goldGrad.addColorStop(0.7, "#9e7a2b");
  goldGrad.addColorStop(1, "#f7dfa3");

  // Double ornate borders
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 36, 952, 952);

  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, 920, 920);

  // Decorative corner corner-pieces
  const drawCorner = (x, y, flipX, flipY) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX, flipY);
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(30, 30);
    ctx.lineTo(30, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(42, 42, 12, 0, Math.PI * 2);
    ctx.fillStyle = goldGrad;
    ctx.fill();
    ctx.restore();
  };

  drawCorner(60, 60, 1, 1);
  drawCorner(964, 60, -1, 1);
  drawCorner(60, 964, 1, -1);
  drawCorner(964, 964, -1, -1);

  // Luxury Coat of Arms / Crest
  ctx.save();
  ctx.translate(512, 220);
  ctx.fillStyle = goldGrad;
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 3;

  // Crown / Tiara
  ctx.beginPath();
  ctx.moveTo(-45, -50);
  ctx.lineTo(-35, -20);
  ctx.lineTo(0, -45);
  ctx.lineTo(35, -20);
  ctx.lineTo(45, -50);
  ctx.lineTo(30, 5);
  ctx.lineTo(-30, 5);
  ctx.closePath();
  ctx.fill();

  // Shield outline
  ctx.beginPath();
  ctx.moveTo(-60, 15);
  ctx.lineTo(60, 15);
  ctx.bezierCurveTo(60, 90, 0, 125, 0, 140);
  ctx.bezierCurveTo(0, 125, -60, 90, -60, 15);
  ctx.stroke();

  // Monogram GS
  ctx.font = "italic bold 52px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GS", 0, 70);

  // Laurel branches left & right
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const yStep = 25 + i * 18;
    // Left leaf
    ctx.beginPath();
    ctx.ellipse(-78, yStep, 10, 5, -0.6, 0, Math.PI * 2);
    ctx.fill();
    // Right leaf
    ctx.beginPath();
    ctx.ellipse(78, yStep, 10, 5, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Brand Name
  ctx.fillStyle = goldGrad;
  ctx.textAlign = "center";
  ctx.font = "600 36px 'Cormorant Garamond', Georgia, serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("THE GRAND STORE", 512, 430);

  // Dividing line
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(280, 460);
  ctx.lineTo(744, 460);
  ctx.stroke();

  // Vintage Year Star
  ctx.font = "700 24px 'Manrope', sans-serif";
  ctx.fillStyle = "#dfba73";
  ctx.fillText(`★  EST. ${preset.vintage}  ★`, 512, 510);

  // Cuvée Title
  ctx.font = "italic 700 74px 'Cormorant Garamond', Georgia, serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(preset.labelTitle, 512, 600);

  // Category Sub-label
  ctx.font = "700 28px 'Manrope', sans-serif";
  ctx.fillStyle = goldGrad;
  ctx.letterSpacing = "4px";
  ctx.fillText(preset.labelSub, 512, 665);

  // Terroir & Appellation
  ctx.font = "italic 26px 'Cormorant Garamond', Georgia, serif";
  ctx.fillStyle = "#c9beab";
  ctx.fillText(preset.terroir, 512, 730);

  // Quality Tier Guarantee
  ctx.font = "600 20px 'Manrope', sans-serif";
  ctx.fillStyle = "#8a7b64";
  ctx.letterSpacing = "3px";
  ctx.fillText("MIS EN BOUTEILLE AU CHÂTEAU • PRIVATE RESERVE", 512, 800);

  // Volume & ABV
  ctx.font = "700 22px 'Manrope', sans-serif";
  ctx.fillStyle = goldGrad;
  ctx.fillText(`${preset.volume}  •  ${preset.abv}`, 512, 880);

  return canvas;
}

function generateBackLabel(preset) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Rich charcoal
  ctx.fillStyle = "#12100d";
  ctx.fillRect(0, 0, 1024, 1024);

  const goldGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
  goldGrad.addColorStop(0, "#dfba73");
  goldGrad.addColorStop(1, "#9e7a2b");

  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, 944, 944);

  ctx.fillStyle = goldGrad;
  ctx.textAlign = "center";
  ctx.font = "700 32px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("THE GRAND STORE PRIVATE CELLAR", 512, 130);

  ctx.font = "600 20px 'Manrope', sans-serif";
  ctx.fillStyle = "#c9beab";
  ctx.fillText("CURATOR'S TASTING NOTES & CELLAR SPECIFICATIONS", 512, 180);

  ctx.strokeStyle = "rgba(212,175,55,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, 215);
  ctx.lineTo(874, 215);
  ctx.stroke();

  // Quote & Sommelier
  ctx.font = "italic 28px 'Cormorant Garamond', Georgia, serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";

  // Wrap text helper
  const words = preset.quote.split(" ");
  let line = "";
  let y = 300;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (testLine.length > 38 && n > 0) {
      ctx.fillText(line, 512, y);
      line = words[n] + " ";
      y += 42;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 512, y);

  ctx.font = "700 22px 'Manrope', sans-serif";
  ctx.fillStyle = goldGrad;
  ctx.fillText(`— ${preset.sommelier}`, 512, y + 60);

  // Barrel aging details
  ctx.font = "600 20px 'Manrope', sans-serif";
  ctx.fillStyle = "#c9beab";
  ctx.fillText(`CASK MATURATION: ${preset.barrel}`, 512, y + 130);
  ctx.fillText(`POINTS RATING: ${preset.points} • CERTIFIED AUTHENTIC`, 512, y + 170);

  // Fake Barcode
  ctx.fillStyle = "#ffffff";
  const barY = 820;
  const barHeight = 80;
  let curX = 260;
  ctx.fillRect(curX, barY, 504, barHeight);
  ctx.fillStyle = "#000000";
  for (let i = 0; i < 48; i++) {
    const w = (i % 3 === 0 ? 6 : i % 2 === 0 ? 3 : 2);
    ctx.fillRect(curX + 16 + i * 10, barY, w, barHeight);
  }
  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  ctx.fillText("6 0 0 9 8 1 2 4 5 7 0 9 3", 512, barY + barHeight + 25);

  return canvas;
}

function generateNeckFoilTexture(preset) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#15130f";
  ctx.fillRect(0, 0, 512, 1024);

  // Diagonal cross-hatch embossed gold foil pattern
  const gold = ctx.createLinearGradient(0, 0, 512, 1024);
  gold.addColorStop(0, "#fae7be");
  gold.addColorStop(0.3, "#dfba73");
  gold.addColorStop(0.7, "#87661e");
  gold.addColorStop(1, "#fae7be");
  ctx.fillStyle = gold;
  ctx.fillRect(0, 0, 512, 1024);

  ctx.strokeStyle = "rgba(100, 75, 20, 0.45)";
  ctx.lineWidth = 1.5;
  for (let i = -1024; i < 1536; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 1024, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 1024);
    ctx.lineTo(i + 1024, 0);
    ctx.stroke();
  }

  // Medallion Neck Band
  ctx.fillStyle = "#100e0b";
  ctx.fillRect(0, 480, 512, 140);
  ctx.strokeStyle = "#fae7be";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 484, 512, 132);

  ctx.fillStyle = "#fae7be";
  ctx.font = "bold 32px 'Cormorant Garamond', Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("THE GRAND STORE", 256, 560);

  return canvas;
}

// --------------------------------------------------------------------------
// 3D Procedural Volumetric Bottle Scene Component
// --------------------------------------------------------------------------
export default function BottleScene({
  reduceMotion,
  activeBottleIndex = 0,
  onBottleChange,
  onHoverState,
  onTelemetry,
}) {
  const container = useRef(null);
  const controller = useRef(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentPreset = BOTTLE_PRESETS[activeBottleIndex] || BOTTLE_PRESETS[0];

  useEffect(() => {
    const host = container.current;
    if (!host) return;

    let disposed = false;
    let cleanup = () => {};

    const init = async () => {
      try {
        const [THREE, { gsap }, { ScrollTrigger }] = await Promise.all([
          import("./sceneEngine.js"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);

        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
        camera.position.set(0, 0.2, 10.5);
        camera.lookAt(0, 0, 0);

        // Environment Map via PMREM
        const pmrem = new THREE.PMREMGenerator(renderer);
        const room = new THREE.RoomEnvironment();
        const env = pmrem.fromScene(room, 0.04, 0.1, 100);
        scene.environment = env.texture;
        room.dispose();
        pmrem.dispose();

        // Atmospheric Studio Lighting
        const hemiLight = new THREE.HemisphereLight(0xfff7e8, 0x18140f, 2.0);
        scene.add(hemiLight);

        // Key light from top left
        const keyLight = new THREE.DirectionalLight(0xffecd0, 3.8);
        keyLight.position.set(-4, 6, 5);
        scene.add(keyLight);

        // Warm gold specular rim light from back right
        const rimLight = new THREE.DirectionalLight(0xd4af37, 5.2);
        rimLight.position.set(4.5, 2.5, -4);
        scene.add(rimLight);

        // Fill light to catch glass curvature
        const fillLight = new THREE.DirectionalLight(0xffffff, 2.2);
        fillLight.position.set(0, -3, 4);
        scene.add(fillLight);

        const world = new THREE.Group();
        scene.add(world);

        const bottleGroup = new THREE.Group();
        world.add(bottleGroup);

        // ------------------------------------------------------------------
        // TRUE 3D VOLUMETRIC LATHE BOTTLE GEOMETRY
        // ------------------------------------------------------------------
        // Precise silhouette points for champagne/wine profile (from punt up to lip)
        const bottleProfile = [
          new THREE.Vector2(0.0, -2.15), // Deep bottom punt indentation
          new THREE.Vector2(0.18, -1.95), // Punt curve
          new THREE.Vector2(0.38, -2.06), // Inner base bevel
          new THREE.Vector2(0.56, -2.14), // Base heel rim
          new THREE.Vector2(0.61, -2.04), // Outer base fillet
          new THREE.Vector2(0.62, -1.85), // Lower cylindrical body start
          new THREE.Vector2(0.62, 0.42), // Main body cylinder (label zone)
          new THREE.Vector2(0.60, 0.68), // Shoulder swell start
          new THREE.Vector2(0.54, 0.98), // Graceful champagne slope
          new THREE.Vector2(0.42, 1.28), // Shoulder inflection
          new THREE.Vector2(0.28, 1.54), // Neck junction
          new THREE.Vector2(0.21, 1.74), // Lower neck
          new THREE.Vector2(0.19, 2.08), // Neck cylinder
          new THREE.Vector2(0.21, 2.16), // Lip collar bead
          new THREE.Vector2(0.22, 2.23), // Crown mouth rim
          new THREE.Vector2(0.16, 2.25), // Inner mouth bore
          new THREE.Vector2(0.14, 2.0), // Inner neck hollow
        ];

        const glassGeo = new THREE.LatheGeometry(bottleProfile, 64);
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: currentPreset.glassColor,
          metalness: 0.08,
          roughness: 0.05,
          transmission: 0.88,
          thickness: 0.9,
          ior: 1.52, // Genuine optical glass refraction index
          reflectivity: 0.95,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
          envMapIntensity: 2.2,
          transparent: true,
          depthWrite: true,
        });
        const glassMesh = new THREE.Mesh(glassGeo, glassMat);
        bottleGroup.add(glassMesh);

        // ------------------------------------------------------------------
        // INNER LIQUID VOLUME
        // ------------------------------------------------------------------
        const liquidProfile = [
          new THREE.Vector2(0.0, -2.05),
          new THREE.Vector2(0.16, -1.88),
          new THREE.Vector2(0.35, -1.98),
          new THREE.Vector2(0.53, -2.05),
          new THREE.Vector2(0.58, -1.8),
          new THREE.Vector2(0.58, 0.4),
          new THREE.Vector2(0.56, 0.65),
          new THREE.Vector2(0.50, 0.94),
          new THREE.Vector2(0.38, 1.24),
          new THREE.Vector2(0.24, 1.5),
          new THREE.Vector2(0.17, 1.7),
          new THREE.Vector2(0.0, 1.7), // Liquid fill meniscus level
        ];
        const liquidGeo = new THREE.LatheGeometry(liquidProfile, 48);
        const liquidMat = new THREE.MeshStandardMaterial({
          color: currentPreset.liquidColor,
          roughness: 0.15,
          metalness: 0.25,
          transparent: true,
          opacity: 0.82,
        });
        const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
        bottleGroup.add(liquidMesh);

        // ------------------------------------------------------------------
        // 3D WRAPPED CYLINDRICAL LABELS (FRONT & BACK)
        // ------------------------------------------------------------------
        // Front Label: Curved 3D sheet matching cylinder body curvature
        const labelRadius = 0.626;
        const frontLabelGeo = new THREE.CylinderGeometry(
          labelRadius,
          labelRadius,
          1.85,
          48,
          1,
          true,
          -Math.PI * 0.38,
          Math.PI * 0.76
        );

        const frontLabelTex = new THREE.CanvasTexture(generateFrontLabel(currentPreset));
        frontLabelTex.colorSpace = THREE.SRGBColorSpace;
        frontLabelTex.anisotropy = 8;

        const frontLabelMat = new THREE.MeshStandardMaterial({
          map: frontLabelTex,
          roughness: 0.28,
          metalness: 0.42,
          side: THREE.DoubleSide,
        });
        const frontLabelMesh = new THREE.Mesh(frontLabelGeo, frontLabelMat);
        frontLabelMesh.position.y = -0.66;
        bottleGroup.add(frontLabelMesh);

        // Back Label: Wrapped on opposite 180° side
        const backLabelGeo = new THREE.CylinderGeometry(
          labelRadius,
          labelRadius,
          1.45,
          48,
          1,
          true,
          Math.PI * 0.68,
          Math.PI * 0.64
        );
        const backLabelTex = new THREE.CanvasTexture(generateBackLabel(currentPreset));
        backLabelTex.colorSpace = THREE.SRGBColorSpace;
        backLabelTex.anisotropy = 8;

        const backLabelMat = new THREE.MeshStandardMaterial({
          map: backLabelTex,
          roughness: 0.35,
          metalness: 0.2,
          side: THREE.DoubleSide,
        });
        const backLabelMesh = new THREE.Mesh(backLabelGeo, backLabelMat);
        backLabelMesh.position.y = -0.66;
        bottleGroup.add(backLabelMesh);

        // ------------------------------------------------------------------
        // METALLIC GOLD EMBOSSED NECK FOIL CAPSULE
        // ------------------------------------------------------------------
        const foilGeo = new THREE.CylinderGeometry(0.225, 0.265, 0.95, 48, 1, false);
        const foilTex = new THREE.CanvasTexture(generateNeckFoilTexture(currentPreset));
        foilTex.colorSpace = THREE.SRGBColorSpace;

        const foilMat = new THREE.MeshStandardMaterial({
          map: foilTex,
          color: currentPreset.foilColor,
          metalness: 0.85,
          roughness: 0.24,
        });
        const foilMesh = new THREE.Mesh(foilGeo, foilMat);
        foilMesh.position.y = 1.72;
        bottleGroup.add(foilMesh);

        // ------------------------------------------------------------------
        // 3D CHAMPAGNE CORK & GOLD WIRE CAGE (MUSELET)
        // ------------------------------------------------------------------
        const corkGeo = new THREE.CylinderGeometry(0.18, 0.155, 0.32, 32);
        const corkMat = new THREE.MeshStandardMaterial({
          color: 0xa88556,
          roughness: 0.8,
          metalness: 0.05,
        });
        const corkMesh = new THREE.Mesh(corkGeo, corkMat);
        corkMesh.position.y = 2.36;
        bottleGroup.add(corkMesh);

        // Wire Ring around Cork
        const wireRingGeo = new THREE.TorusGeometry(0.182, 0.01, 8, 32);
        const wireMat = new THREE.MeshStandardMaterial({
          color: 0xdfba73,
          metalness: 0.9,
          roughness: 0.2,
        });
        const wireRing = new THREE.Mesh(wireRingGeo, wireMat);
        wireRing.rotation.x = Math.PI / 2;
        wireRing.position.y = 2.32;
        bottleGroup.add(wireRing);

        // Top Gold Medallion Cap
        const capGeo = new THREE.CylinderGeometry(0.178, 0.178, 0.03, 32);
        const capMesh = new THREE.Mesh(capGeo, wireMat);
        capMesh.position.y = 2.52;
        bottleGroup.add(capMesh);

        // ------------------------------------------------------------------
        // SWIRLING GOLD CELLAR DUST PARTICLES
        // ------------------------------------------------------------------
        const particleCount = 260;
        const particleGeo = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleVelocities = [];

        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 1.3 + Math.random() * 2.4;
          particlePositions[i * 3] = Math.cos(angle) * radius;
          particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 5.2;
          particlePositions[i * 3 + 2] = Math.sin(angle) * radius - 0.4;

          particleVelocities.push({
            speed: 0.003 + Math.random() * 0.007,
            radius,
            angle,
            yVel: 0.002 + Math.random() * 0.005,
          });
        }
        particleGeo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(particlePositions, 3)
        );

        const pCanvas = document.createElement("canvas");
        pCanvas.width = 32;
        pCanvas.height = 32;
        const pCtx = pCanvas.getContext("2d");
        const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
        pGrad.addColorStop(0, "rgba(255, 238, 175, 1)");
        pGrad.addColorStop(0.35, "rgba(212, 175, 55, 0.75)");
        pGrad.addColorStop(1, "rgba(212, 175, 55, 0)");
        pCtx.fillStyle = pGrad;
        pCtx.fillRect(0, 0, 32, 32);

        const pMat = new THREE.PointsMaterial({
          size: 0.12,
          map: new THREE.CanvasTexture(pCanvas),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.75,
        });
        const particles = new THREE.Points(particleGeo, pMat);
        world.add(particles);

        // ------------------------------------------------------------------
        // 3D ORBITAL GOLD RINGS
        // ------------------------------------------------------------------
        const ring1 = new THREE.Mesh(
          new THREE.TorusGeometry(2.5, 0.012, 10, 100),
          new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.85,
            roughness: 0.25,
            emissive: 0x3d2f0a,
          })
        );
        ring1.rotation.set(1.15, -0.4, 0.15);
        ring1.position.set(0, -0.65, -0.5);
        world.add(ring1);

        const ring2 = new THREE.Mesh(
          new THREE.TorusGeometry(2.05, 0.008, 8, 90),
          new THREE.MeshStandardMaterial({
            color: 0xb89547,
            metalness: 0.75,
            roughness: 0.35,
          })
        );
        ring2.rotation.set(0.45, 0.7, -0.2);
        ring2.position.set(0, 0.45, -0.85);
        world.add(ring2);

        // Ground Pedestal Contact Shadow
        const sCanvas = document.createElement("canvas");
        sCanvas.width = 256;
        sCanvas.height = 256;
        const sCtx = sCanvas.getContext("2d");
        const sGrad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
        sGrad.addColorStop(0, "rgba(8, 6, 4, 0.95)");
        sGrad.addColorStop(0.35, "rgba(212, 175, 55, 0.14)");
        sGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        sCtx.fillStyle = sGrad;
        sCtx.fillRect(0, 0, 256, 256);

        const shadowMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(5.4, 2.2),
          new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(sCanvas),
            transparent: true,
            depthWrite: false,
          })
        );
        shadowMesh.rotation.x = -Math.PI / 2 + 0.08;
        shadowMesh.position.set(0, -2.45, 0);
        scene.add(shadowMesh);

        // ------------------------------------------------------------------
        // INTERACTIVE HOVER & SPIN PHYSICS ENGINE
        // ------------------------------------------------------------------
        const pointer = {
          x: 0,
          y: 0,
          targetX: 0,
          targetY: 0,
          down: false,
          lastX: 0,
          hovered: false,
        };

        let currentRotation = 0;
        let spinVelocity = 0.005; // Idle drift
        let targetSpinVelocity = 0.005;
        let isPaused = false;
        let visible = true;
        let time = 0;
        let lastTime = 0;
        let frame = 0;

        // Switcher for active vintage preset
        const updatePresetMaterials = (idx) => {
          const p = BOTTLE_PRESETS[idx] || BOTTLE_PRESETS[0];
          glassMat.color.setHex(p.glassColor);
          liquidMat.color.setHex(p.liquidColor);
          foilMat.color.setHex(p.foilColor);

          // Update Canvas Textures
          const newFrontCanvas = generateFrontLabel(p);
          frontLabelMat.map.image = newFrontCanvas;
          frontLabelMat.map.needsUpdate = true;

          const newBackCanvas = generateBackLabel(p);
          backLabelMat.map.image = newBackCanvas;
          backLabelMat.map.needsUpdate = true;

          const newFoilCanvas = generateNeckFoilTexture(p);
          foilMat.map.image = newFoilCanvas;
          foilMat.map.needsUpdate = true;

          // High-speed rotational impulse on vintage switch
          spinVelocity = 0.16;
        };

        const draw = (now) => {
          if (disposed) return;
          const dt = Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;

          if (visible && !document.hidden) {
            if (!isPaused && !reduceMotion) time += dt;

            // HOVER ACCELERATION:
            // When hovering, spin velocity ramps up dramatically ("spinning wild")
            // with realistic inertia and smooth deceleration damping
            if (pointer.hovered) {
              targetSpinVelocity = 0.09 + Math.abs(pointer.x) * 0.07;
            } else {
              targetSpinVelocity = 0.005;
            }

            spinVelocity += (targetSpinVelocity - spinVelocity) * 0.06;

            if (!pointer.down) {
              currentRotation += spinVelocity;
            }

            // Pointer Tilt easing
            pointer.x += (pointer.targetX - pointer.x) * 0.08;
            pointer.y += (pointer.targetY - pointer.y) * 0.08;

            // 3D rotation & perspective tilt
            bottleGroup.rotation.y = currentRotation;
            bottleGroup.rotation.x = pointer.y * 0.28;
            bottleGroup.rotation.z = -pointer.x * 0.18;

            // Levitation & breathing
            const levitation = Math.sin(time * 1.6) * 0.08;
            bottleGroup.position.y = (pointer.hovered ? 0.08 : 0) + levitation;

            // Scale pulse on hover
            const targetScale = pointer.hovered ? 1.03 : 1.0;
            bottleGroup.scale.x += (targetScale - bottleGroup.scale.x) * 0.1;
            bottleGroup.scale.y += (targetScale - bottleGroup.scale.y) * 0.1;
            bottleGroup.scale.z += (targetScale - bottleGroup.scale.z) * 0.1;

            // Rotate Orbital Rings
            ring1.rotation.z = time * 0.12;
            ring2.rotation.z = -time * 0.09;

            // Swirl Gold Particles
            const posAttr = particles.geometry.attributes.position;
            const pArray = posAttr.array;
            const pSpeedFactor = pointer.hovered ? 2.6 : 1.0;

            for (let i = 0; i < particleCount; i++) {
              const pVel = particleVelocities[i];
              pVel.angle += pVel.speed * pSpeedFactor;
              const curRadius =
                pVel.radius + (pointer.hovered ? Math.sin(time * 2 + i) * 0.25 : 0);

              pArray[i * 3] = Math.cos(pVel.angle) * curRadius;
              pArray[i * 3 + 1] += pVel.yVel;
              pArray[i * 3 + 2] = Math.sin(pVel.angle) * curRadius - 0.3;

              if (pArray[i * 3 + 1] > 3.2) {
                pArray[i * 3 + 1] = -2.5;
              }
            }
            posAttr.needsUpdate = true;

            // Telemetry callback
            if (onTelemetry && now % 6 < 1) {
              const deg = Math.round(((currentRotation % (Math.PI * 2)) * 180) / Math.PI);
              const normDeg = deg < 0 ? deg + 360 : deg;
              const rpm = Math.round(spinVelocity * 60 * (60 / (Math.PI * 2)));
              onTelemetry({
                angle: normDeg,
                rpm,
                isSpinning: pointer.hovered,
                spinSpeedText: pointer.hovered ? "360° HIGH-VELOCITY SCAN" : "AURA DRIFT",
              });
            }

            renderer.render(scene, camera);
          }

          frame = requestAnimationFrame(draw);
        };

        const resize = () => {
          const { width, height } = host.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.position.z = camera.aspect < 0.9 ? 12.0 : 10.5;
          camera.updateProjectionMatrix();
        };

        const observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();

        const visibility = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        visibility.observe(host);

        // Pointer event listeners
        const handlePointerEnter = () => {
          pointer.hovered = true;
          setIsHovered(true);
          if (onHoverState) onHoverState(true);
        };

        const handlePointerMove = (e) => {
          const rect = host.getBoundingClientRect();
          pointer.targetX = (e.clientX - rect.left) / rect.width - 0.5;
          pointer.targetY = (e.clientY - rect.top) / rect.height - 0.5;

          if (pointer.down) {
            const deltaX = (e.clientX - pointer.lastX) * 0.016;
            currentRotation += deltaX;
            spinVelocity = deltaX * 1.5;
            pointer.lastX = e.clientX;
          }
        };

        const handlePointerDown = (e) => {
          pointer.down = true;
          pointer.lastX = e.clientX;
          host.setPointerCapture(e.pointerId);
        };

        const handlePointerUp = () => {
          pointer.down = false;
        };

        const handlePointerLeave = () => {
          pointer.hovered = false;
          pointer.targetX = 0;
          pointer.targetY = 0;
          pointer.down = false;
          setIsHovered(false);
          if (onHoverState) onHoverState(false);
        };

        host.addEventListener("pointerenter", handlePointerEnter);
        host.addEventListener("pointermove", handlePointerMove);
        host.addEventListener("pointerdown", handlePointerDown);
        host.addEventListener("pointerup", handlePointerUp);
        host.addEventListener("pointercancel", handlePointerUp);
        host.addEventListener("pointerleave", handlePointerLeave);

        const onContextLost = (e) => {
          e.preventDefault();
          visible = false;
          setReady(false);
          setFailed(true);
        };
        renderer.domElement.addEventListener("webglcontextlost", onContextLost);

        // GSAP ScrollTrigger Parallax
        const trigger = reduceMotion
          ? null
          : gsap.to(bottleGroup.position, {
              y: -1.0,
              z: -1.2,
              ease: "none",
              scrollTrigger: {
                trigger: host.closest(".hero"),
                start: "top top",
                end: "bottom top",
                scrub: 1.2,
              },
            });

        controller.current = {
          pause(val) {
            isPaused = val;
          },
          spinBoost(amount = 0.25) {
            spinVelocity += amount;
          },
          setBottle(idx) {
            updatePresetMaterials(idx);
          },
          reset() {
            currentRotation = 0;
            spinVelocity = 0.005;
            pointer.targetX = 0;
            pointer.targetY = 0;
          },
        };

        setReady(true);
        frame = requestAnimationFrame(draw);

        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          visibility.disconnect();
          trigger?.scrollTrigger?.kill();
          trigger?.kill();

          host.removeEventListener("pointerenter", handlePointerEnter);
          host.removeEventListener("pointermove", handlePointerMove);
          host.removeEventListener("pointerdown", handlePointerDown);
          host.removeEventListener("pointerup", handlePointerUp);
          host.removeEventListener("pointercancel", handlePointerUp);
          host.removeEventListener("pointerleave", handlePointerLeave);
          renderer.domElement.removeEventListener("webglcontextlost", onContextLost);

          scene.traverse((obj) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
              else obj.material.dispose();
            }
          });
          env.dispose();
          renderer.dispose();
          renderer.domElement.remove();
          controller.current = null;
        };
      } catch (err) {
        if (!disposed) {
          setFailed(true);
          setReady(false);
        }
        console.warn("3D bottle scene initialization fallback:", err.message);
      }
    };

    init();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (controller.current && ready) {
      controller.current.setBottle(activeBottleIndex);
    }
  }, [activeBottleIndex, ready]);

  const handleNextBottle = useCallback(() => {
    const next = (activeBottleIndex + 1) % BOTTLE_PRESETS.length;
    if (onBottleChange) onBottleChange(next);
  }, [activeBottleIndex, onBottleChange]);

  const handlePrevBottle = useCallback(() => {
    const prev = (activeBottleIndex - 1 + BOTTLE_PRESETS.length) % BOTTLE_PRESETS.length;
    if (onBottleChange) onBottleChange(prev);
  }, [activeBottleIndex, onBottleChange]);

  return (
    <div
      className={`bottle-scene luxury-scene ${ready ? "is-ready" : ""} ${
        isHovered ? "is-hover-spinning" : ""
      }`}
    >
      {/* Golden Halo Spotlight & Light Beams */}
      <div
        className="scene-halo luxury-halo"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(${currentPreset.accentRgb}, 0.22) 0%, rgba(${currentPreset.accentRgb}, 0.08) 45%, transparent 72%)`,
        }}
        aria-hidden="true"
      />

      {/* Realistic Glass Glow on Hover */}
      <div className="scene-specular-flare" aria-hidden="true" />

      {/* 3D Canvas Mount */}
      <div
        ref={container}
        className="scene-canvas"
        role="img"
        aria-label={`Interactive 3D volumetric bottle presentation of ${currentPreset.name}`}
      />

      {/* Floating Interactive 3D Badge */}
      <div className={`scene-hover-badge ${isHovered ? "active" : ""}`}>
        <Sparkle size={14} weight="fill" className="badge-sparkle" />
        <span>{isHovered ? "360° HIGH VELOCITY 3D SPIN" : "HOVER TO SPIN & INSPECT 3D"}</span>
      </div>

      {/* Cellar Vintage Switcher Controls */}
      <div className="scene-bottle-selector">
        <div className="bottle-pill-track">
          {BOTTLE_PRESETS.map((bottle, idx) => (
            <button
              key={bottle.id}
              type="button"
              className={`bottle-tab-pill ${idx === activeBottleIndex ? "is-active" : ""}`}
              onClick={() => onBottleChange && onBottleChange(idx)}
              aria-label={`Select ${bottle.name}`}
            >
              <span
                className="pill-dot"
                style={{ backgroundColor: `rgb(${bottle.accentRgb})` }}
              />
              <span className="pill-label">{bottle.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {ready && !failed && (
          <div className="scene-controls luxury-controls">
            <button
              type="button"
              onClick={handlePrevBottle}
              aria-label="Previous vintage bottle"
              title="Previous bottle"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => controller.current?.spinBoost(0.35)}
              aria-label="Spin bottle fast"
              title="Spin bottle"
              className="spin-boost-btn"
            >
              <ArrowsClockwise size={15} />
            </button>
            <button
              type="button"
              onClick={handleNextBottle}
              aria-label="Next vintage bottle"
              title="Next bottle"
            >
              →
            </button>
            <button
              type="button"
              aria-label="Reset position"
              title="Reset angle"
              onClick={() => controller.current?.reset()}
            >
              <ArrowCounterClockwise size={15} />
            </button>
            {!reduceMotion && (
              <button
                type="button"
                aria-label={paused ? "Resume idle drift" : "Pause idle drift"}
                aria-pressed={paused}
                onClick={() => {
                  controller.current?.pause(!paused);
                  setPaused(!paused);
                }}
              >
                {paused ? <Play size={13} /> : <Pause size={13} />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
