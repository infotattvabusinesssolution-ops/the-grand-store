const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

async function uploadFile(filePath, folder, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      folder: folder,
      public_id: publicId,
      overwrite: true,
      resource_type: 'image'
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
  });
}

async function main() {
  console.log('--- Uploading Dogliotti 1870 Products to Cloudinary ---');
  const prodDir = 'd:/Grand Store/the-grand-store/grand-store/frontend/public/assets/products/dogliotti-1870';
  const prodFiles = fs.readdirSync(prodDir).filter(f => f.endsWith('.png'));
  const prodUrls = {};
  
  for (let i = 0; i < prodFiles.length; i++) {
    const f = prodFiles[i];
    const slug = f.replace('.png', '');
    const p = path.join(prodDir, f);
    try {
      const url = await uploadFile(p, 'grandstore-uploads/products/dogliotti-1870', slug);
      prodUrls[slug] = url;
      console.log(`[${i+1}/${prodFiles.length}] Uploaded product: ${slug}`);
    } catch (e) {
      console.error(`Failed ${slug}:`, e.message);
    }
  }

  console.log('\n--- Uploading Dogliotti 1870 Estate Imagery to Cloudinary ---');
  const estateDir = 'd:/Grand Store/the-grand-store/grand-store/frontend/public/assets/estate/dogliotti-1870';
  const estateFiles = fs.readdirSync(estateDir);
  const estateUrls = {};

  for (let i = 0; i < estateFiles.length; i++) {
    const f = estateFiles[i];
    const name = f.replace(/\.[^.]+$/, '');
    const p = path.join(estateDir, f);
    try {
      const url = await uploadFile(p, 'grandstore-uploads/estate/dogliotti-1870', name);
      estateUrls[name] = url;
      console.log(`[${i+1}/${estateFiles.length}] Uploaded estate photo: ${name}`);
    } catch (e) {
      console.error(`Failed estate photo ${name}:`, e.message);
    }
  }

  const manifest = {
    products: prodUrls,
    estate: estateUrls
  };

  const manifestPath = path.join(__dirname, 'dogliotti_cloudinary_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Successfully saved manifest to ${manifestPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
