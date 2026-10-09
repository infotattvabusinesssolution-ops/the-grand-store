require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

const SOURCE_DIR = 'c:/office/store-new';
const TMP_DIR = path.resolve(__dirname, '../uploads/tmp_dobbe');

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Map the 9 raw files to distinct public IDs and roles
const IMAGE_DEFINITIONS = [
  {
    filePattern: /COGNAC DOBBE VS HR\.jpg$/i,
    publicId: 'dobbe-cognac-vs-750ml',
    productKey: 'dobbe_vs',
    role: 'primary',
    isTransparentSource: false
  },
  {
    filePattern: /COGNAC DOBBE VSOP HR\.jpg$/i,
    publicId: 'dobbe-cognac-vsop-750ml',
    productKey: 'dobbe_vsop',
    role: 'primary',
    isTransparentSource: false
  },
  {
    filePattern: /Cognac Dobbe 10 ANS Petite Champagne\.jpg$/i,
    publicId: 'dobbe-cognac-10-ans-petite-champagne-750ml',
    productKey: 'dobbe_10_ans',
    role: 'primary',
    isTransparentSource: false
  },
  {
    filePattern: /Cognac DOBBE.*XO FG HR\.jpg$/i,
    publicId: 'dobbe-cognac-xo-fine-gastronomie-750ml',
    productKey: 'dobbe_xo',
    role: 'primary',
    isTransparentSource: false
  },
  {
    filePattern: /Cognac DOBBE.*Mille.*1999 FB HR\.jpg$/i,
    publicId: 'dobbe-cognac-millesime-1999-vintage-750ml',
    productKey: 'dobbe_millesime_1999',
    role: 'primary',
    isTransparentSource: false
  },
  {
    filePattern: /COGNAC DOBBE EXTRA GB OPEN\.png$/i,
    publicId: 'dobbe-cognac-extra-rare-gift-box-open-750ml',
    productKey: 'dobbe_extra',
    role: 'primary',
    isTransparentSource: true // Has alpha channel already
  },
  {
    filePattern: /COGNAC DOBBE EXTRA with Gift Box WHT\.tif$/i,
    publicId: 'dobbe-cognac-extra-rare-gift-box-white-750ml',
    productKey: 'dobbe_extra',
    role: 'gallery',
    isTransparentSource: false
  },
  {
    filePattern: /DOBBE O COGNAC DOBBE HR\.jpg$/i,
    publicId: 'dobbe-o-liqueur-cognac-orange-750ml',
    productKey: 'dobbe_o_liqueur',
    role: 'primary',
    isTransparentSource: false
  },
  {
    filePattern: /Whisky DOBBE Peated Single Malt HR\.jpg$/i,
    publicId: 'dobbe-whisky-peated-single-malt-750ml',
    productKey: 'dobbe_whisky_peated',
    role: 'primary',
    isTransparentSource: false
  }
];

const waitForUrl = async (url, maxAttempts = 15, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: 'image/png,image/*;q=0.8' } });
      if (res.ok && String(res.headers.get('content-type') || '').startsWith('image/')) {
        return { ok: true, status: res.status, contentType: res.headers.get('content-type') };
      }
      console.log(`  [Attempt ${attempt}/${maxAttempts}] Transformation processing... HTTP ${res.status}`);
    } catch (e) {
      console.log(`  [Attempt ${attempt}/${maxAttempts}] Fetch error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return { ok: false };
};

async function processAndUpload() {
  console.log('=== Starting Dobbé Images Optimization & Cloudinary Upload ===');
  const allFiles = fs.readdirSync(SOURCE_DIR);
  const manifest = {};

  for (const def of IMAGE_DEFINITIONS) {
    const matchedFile = allFiles.find(f => def.filePattern.test(f));
    if (!matchedFile) {
      console.error(`❌ Could not find file matching pattern: ${def.filePattern}`);
      continue;
    }

    const fullSrcPath = path.join(SOURCE_DIR, matchedFile);
    const tmpOptimizedPath = path.join(TMP_DIR, `${def.publicId}.png`);

    console.log(`\n📸 Processing: "${matchedFile}"`);
    console.log(`   Source: ${fullSrcPath}`);

    // 1. Optimize and resize using sharp
    const sharpInstance = sharp(fullSrcPath);
    const meta = await sharpInstance.metadata();
    console.log(`   Original Dimensions: ${meta.width}x${meta.height}, Format: ${meta.format}`);

    // Resize to max 2000px on largest side
    await sharpInstance
      .resize({
        width: 2000,
        height: 2000,
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: 95, compressionLevel: 8 })
      .toFile(tmpOptimizedPath);

    const tmpStats = fs.statSync(tmpOptimizedPath);
    console.log(`   Optimized Size: ${(tmpStats.size / (1024 * 1024)).toFixed(2)} MB -> Ready for Cloudinary`);

    // 2. Upload to Cloudinary
    console.log(`   ☁️ Uploading to Cloudinary (public_id: grand-store/catalog-originals/dobbe/${def.publicId})...`);
    const uploadRes = await cloudinary.uploader.upload(tmpOptimizedPath, {
      folder: 'grand-store/catalog-originals/dobbe',
      public_id: def.publicId,
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
      tags: ['grand-store-catalog', 'dobbe', 'cognac']
    });

    console.log(`   ✓ Uploaded! Version: ${uploadRes.version}, Secure URL: ${uploadRes.secure_url}`);

    // 3. Build transparent background-removed URL
    // If it's already a transparent PNG, we can use it directly or with background_removal
    const transparentUrl = cloudinary.url(uploadRes.public_id, {
      secure: true,
      version: uploadRes.version,
      format: 'png',
      transformation: [
        ...(def.isTransparentSource ? [] : [{ effect: 'background_removal' }]),
        { width: 1200, height: 1600, crop: 'limit' }
      ]
    });

    console.log(`   🎨 Transparent URL: ${transparentUrl}`);
    console.log(`   ⏳ Verifying transformation availability on CDN...`);
    const check = await waitForUrl(transparentUrl);

    if (check.ok) {
      console.log(`   ✅ CDN Transformation Confirmed: HTTP ${check.status} (${check.contentType})`);
    } else {
      console.warn(`   ⚠️ CDN Transformation timed out, will still be processed asynchronously by Cloudinary.`);
    }

    // Clean up temporary local optimized file
    if (fs.existsSync(tmpOptimizedPath)) {
      fs.unlinkSync(tmpOptimizedPath);
    }

    if (!manifest[def.productKey]) {
      manifest[def.productKey] = {
        productKey: def.productKey,
        images: []
      };
    }

    manifest[def.productKey].images.push({
      role: def.role,
      publicId: uploadRes.public_id,
      version: uploadRes.version,
      originalUrl: uploadRes.secure_url,
      transparentUrl: transparentUrl,
      sourceFileName: matchedFile
    });
  }

  // Write manifest file
  const manifestPath = path.resolve(__dirname, 'dobbe_cloudinary_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n🎉 All images processed and uploaded! Manifest saved to: ${manifestPath}`);

  // Clean up tmp dir
  try {
    if (fs.existsSync(TMP_DIR)) fs.rmdirSync(TMP_DIR);
  } catch (e) {}

  process.exit(0);
}

processAndUpload().catch(err => {
  console.error('Fatal upload error:', err);
  process.exit(1);
});
