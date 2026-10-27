const fs = require('fs');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

const transSourceDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/80601eef-001a-4857-b567-0843619f344d/scratch/hd_transparent_bottles';
const blackSourceDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/80601eef-001a-4857-b567-0843619f344d/scratch/hd_black_bottles';

const targetDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/auction'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/auction')
];

const items = [
  {
    lotNumber: 'GS-2026-00125',
    slug: 'ballantines-30-year-old',
    title: "Ballantine's 30 Year Old Blended Scotch Whisky"
  },
  {
    lotNumber: 'GS-2026-00126',
    slug: 'cardhu-18-year-old-blue-label',
    title: 'Cardhu 18 Years Blue Label Single Malt Scotch Whisky'
  },
  {
    lotNumber: 'GS-2026-00127',
    slug: 'glenfiddich-18-year-old-ceramic-decanter-blue',
    title: 'Glenfiddich Ceramic Decanter 18 Years Old Blue Flagon'
  },
  {
    lotNumber: 'GS-2026-00128',
    slug: 'jack-daniels-white-rabbit',
    title: "Jack Daniel's White Rabbit Saloon Tennessee Whiskey"
  },
  {
    lotNumber: 'GS-2026-00129',
    slug: 'johnnie-walker-king-george-v',
    title: 'Johnnie Walker King George V Blended Scotch Whisky'
  }
];

async function updateHDImages() {
  console.log('=== 1. Copying HD transparent & black images to public assets ===');
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    for (const item of items) {
      // Copy transparent PNG
      const transSrc = path.join(transSourceDir, `${item.slug}.png`);
      const transDest = path.join(dir, `${item.slug}.png`);
      if (fs.existsSync(transSrc)) {
        fs.copyFileSync(transSrc, transDest);
        console.log(`Copied ${item.slug}.png -> ${dir}`);
      }
      // Copy black background JPG
      const blackSrc = path.join(blackSourceDir, `${item.slug}.jpg`);
      const blackDest = path.join(dir, `${item.slug}.jpg`);
      if (fs.existsSync(blackSrc)) {
        fs.copyFileSync(blackSrc, blackDest);
        console.log(`Copied ${item.slug}.jpg -> ${dir}`);
      }
    }
  }

  console.log('\n=== 2. Uploading HD transparent & black images to Cloudinary ===');
  const uploadedUrls = {};
  for (const item of items) {
    const transSrc = path.join(transSourceDir, `${item.slug}.png`);
    const blackSrc = path.join(blackSourceDir, `${item.slug}.jpg`);

    console.log(`Uploading ${item.slug} (transparent PNG)...`);
    const transUpload = await cloudinary.uploader.upload(transSrc, {
      folder: 'grandstore-auctions',
      public_id: `${item.slug}-transparent`,
      overwrite: true,
      resource_type: 'image'
    });

    console.log(`Uploading ${item.slug} (black studio JPG)...`);
    const blackUpload = await cloudinary.uploader.upload(blackSrc, {
      folder: 'grandstore-auctions',
      public_id: `${item.slug}-black`,
      overwrite: true,
      resource_type: 'image'
    });

    uploadedUrls[item.slug] = {
      transparent: transUpload.secure_url,
      black: blackUpload.secure_url,
      localPng: `/assets/auction/${item.slug}.png`,
      localJpg: `/assets/auction/${item.slug}.jpg`
    };
    console.log(` -> Trans: ${transUpload.secure_url}`);
    console.log(` -> Black: ${blackUpload.secure_url}`);
  }

  console.log('\n=== 3. Updating Auction Lots in MongoDB with clear transparent & black images ===');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const AuctionLot = mongoose.model('AuctionLot', new mongoose.Schema({}, { strict: false }));

  for (const item of items) {
    const urls = uploadedUrls[item.slug];
    // Put transparent PNG first so it blends seamlessly into dark background, followed by black studio version
    const updated = await AuctionLot.updateOne(
      { lotNumber: item.lotNumber },
      {
        $set: {
          images: [
            urls.transparent,
            urls.black,
            urls.localPng,
            urls.localJpg
          ],
          updatedAt: new Date()
        }
      }
    );
    console.log(`Updated lot ${item.lotNumber} (${item.title}): modifiedCount ${updated.modifiedCount}`);
  }

  console.log('\n=== 4. Verification ===');
  const verified = await AuctionLot.find({
    lotNumber: { $in: items.map(i => i.lotNumber) }
  }, { lotNumber: 1, title: 1, images: 1 }).lean();

  verified.forEach(l => {
    console.log(`[${l.lotNumber}] ${l.title}`);
    console.log(`  1. Transparent: ${l.images[0]}`);
    console.log(`  2. Black Studio: ${l.images[1]}`);
  });

  await mongoose.disconnect();
  console.log('\nAll 5 auction lots updated with clear transparent & black backgrounds!');
}

updateHDImages().catch(err => {
  console.error(err);
  process.exit(1);
});
