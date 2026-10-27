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

const domPerignonSource = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\b9888562-21b7-4819-9e7b-6f4a3171dcdf\\dom_perignon_p2_1793077631752.jpg';
const drcSource = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\b9888562-21b7-4819-9e7b-6f4a3171dcdf\\drc_romanee_conti_1990_1793077661207.jpg';

const publicAuctionDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/auction'),
  path.resolve(__dirname, '../../frontend/dist/assets/auction'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/auction')
];

async function run() {
  console.log('1. Copying generated authentic images to local public assets...');
  for (const dir of publicAuctionDirs) {
    if (fs.existsSync(dir)) {
      fs.copyFileSync(domPerignonSource, path.join(dir, 'dom-perignon-p2-2004.jpg'));
      fs.copyFileSync(drcSource, path.join(dir, 'drc-romanee-conti-1990.jpg'));
      console.log(` -> Copied images to: ${dir}`);
    }
  }

  console.log('\n2. Uploading authentic photos to Cloudinary (grandstore-auctions folder)...');
  const dpUpload = await cloudinary.uploader.upload(domPerignonSource, {
    folder: 'grandstore-auctions',
    public_id: 'dom-perignon-p2-2004',
    overwrite: true,
    resource_type: 'image'
  });
  console.log(' -> Dom Pérignon P2 uploaded:', dpUpload.secure_url);

  const drcUpload = await cloudinary.uploader.upload(drcSource, {
    folder: 'grandstore-auctions',
    public_id: 'drc-romanee-conti-1990',
    overwrite: true,
    resource_type: 'image'
  });
  console.log(' -> DRC Romanée-Conti 1990 uploaded:', drcUpload.secure_url);

  console.log('\n3. Connecting to MongoDB to update AuctionLot documents...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const AuctionLot = mongoose.model('AuctionLot', new mongoose.Schema({}, { strict: false }));

  // Update Dom Pérignon P2
  const dpUpdate = await AuctionLot.updateMany(
    {
      $or: [
        { lotNumber: 'GS-2026-00114' },
        { title: { $regex: /Dom P[eé]rignon.*P2/i } }
      ]
    },
    {
      $set: {
        images: [
          dpUpload.secure_url,
          '/assets/auction/dom-perignon-p2-2004.jpg'
        ],
        updatedAt: new Date()
      }
    }
  );
  console.log(` -> Updated ${dpUpdate.modifiedCount} lot(s) for Dom Pérignon P2.`);

  // Update DRC 1990
  const drcUpdate = await AuctionLot.updateMany(
    {
      $or: [
        { lotNumber: 'GS-2026-00113' },
        { title: { $regex: /Roman[eé]e-Conti/i } }
      ]
    },
    {
      $set: {
        images: [
          drcUpload.secure_url,
          '/assets/auction/drc-romanee-conti-1990.jpg'
        ],
        updatedAt: new Date()
      }
    }
  );
  console.log(` -> Updated ${drcUpdate.modifiedCount} lot(s) for DRC Romanée-Conti 1990.`);

  // Verify updated lots
  const updatedLots = await AuctionLot.find({
    lotNumber: { $in: ['GS-2026-00113', 'GS-2026-00114'] }
  }, 'lotNumber title images status').lean();

  console.log('\nVerified updated lots in DB:');
  updatedLots.forEach(l => {
    console.log(` - [${l.lotNumber}] "${l.title}": ${l.images[0]}`);
  });

  await mongoose.disconnect();
  console.log('\nDone successfully!');
}

run().catch(err => {
  console.error('Error during image update:', err);
  process.exit(1);
});
