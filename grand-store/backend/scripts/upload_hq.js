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
  console.log('Uploading 35 HQ bottles to Cloudinary...');
  const bottleDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/4ce32301-11db-4daa-92c6-38a25997fac5/scratch/hq_products';
  const bottleFiles = fs.readdirSync(bottleDir).filter(f => f.endsWith('.png'));
  const bottleUrls = {};
  
  for (let i = 0; i < bottleFiles.length; i++) {
    const f = bottleFiles[i];
    const slug = f.replace('.png', '');
    const p = path.join(bottleDir, f);
    try {
      const url = await uploadFile(p, 'grandstore-uploads/products/bruno-andreu', slug);
      bottleUrls[slug] = url;
      console.log(`[${i+1}/${bottleFiles.length}] Uploaded bottle ${slug}`);
    } catch (e) {
      console.error(`Failed ${slug}:`, e.message);
    }
  }

  console.log('Uploading Estate imagery to Cloudinary...');
  const estateDir = 'd:/Grand Store/the-grand-store/grand-store/frontend/public/assets/estate/bruno-andreu';
  const estateFiles = fs.readdirSync(estateDir);
  const estateUrls = {};

  for (let i = 0; i < estateFiles.length; i++) {
    const f = estateFiles[i];
    const name = f.replace(/\.[^.]+$/, '');
    const p = path.join(estateDir, f);
    try {
      const url = await uploadFile(p, 'grandstore-uploads/estate/bruno-andreu', name);
      estateUrls[name] = url;
      console.log(`[${i+1}/${estateFiles.length}] Uploaded estate photo ${name}`);
    } catch (e) {
      console.error(`Failed estate photo ${name}:`, e.message);
    }
  }

  fs.writeFileSync('C:/Users/HP/.gemini/antigravity-ide/brain/4ce32301-11db-4daa-92c6-38a25997fac5/scratch/hq_cloudinary_urls.json', JSON.stringify({ bottleUrls, estateUrls }, null, 2));
  console.log('Done uploading all assets!');
}

main();
