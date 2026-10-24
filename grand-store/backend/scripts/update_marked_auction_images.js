const fs = require('fs');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const macallanSource = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\06826049-49e8-4713-97b2-45b8684250f3\\macallan_1926_adami_1792820779123.jpg';
const lafiteSource = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\06826049-49e8-4713-97b2-45b8684250f3\\chateau_lafite_1982_1792820802747.jpg';

const publicAuctionDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/auction'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/auction')
];

async function run() {
  console.log('1. Copying generated authentic images to local public assets...');
  for (const dir of publicAuctionDirs) {
    if (fs.existsSync(dir)) {
      fs.copyFileSync(macallanSource, path.join(dir, 'macallan-1926-valerio-adami.jpg'));
      fs.copyFileSync(lafiteSource, path.join(dir, 'chateau-lafite-rothschild-1982.jpg'));
      console.log(` -> Copied images to: ${dir}`);
    }
  }

  console.log('\n2. Uploading authentic photos to Cloudinary (grandstore-auctions folder)...');
  const macallanUpload = await cloudinary.uploader.upload(macallanSource, {
    folder: 'grandstore-auctions',
    public_id: 'macallan-1926-valerio-adami',
    overwrite: true,
    resource_type: 'image'
  });
  console.log(' -> Macallan 1926 Adami uploaded:', macallanUpload.secure_url);

  const lafiteUpload = await cloudinary.uploader.upload(lafiteSource, {
    folder: 'grandstore-auctions',
    public_id: 'chateau-lafite-rothschild-1982',
    overwrite: true,
    resource_type: 'image'
  });
  console.log(' -> Chateau Lafite 1982 uploaded:', lafiteUpload.secure_url);

  console.log('\n3. Connecting to MongoDB to update AuctionLot documents...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const AuctionLot = mongoose.model('AuctionLot', new mongoose.Schema({}, { strict: false }));

  // Update Macallan 1926
  const macallanUpdate = await AuctionLot.updateMany(
    { title: { $regex: /Macallan 1926.*Valerio Adami/i } },
    { $set: { images: [macallanUpload.secure_url] } }
  );
  console.log(` -> Updated ${macallanUpdate.modifiedCount} lot(s) for The Macallan 1926 Valerio Adami.`);

  // Update Chateau Lafite 1982
  const lafiteUpdate = await AuctionLot.updateMany(
    { title: { $regex: /1982 Ch[aâ]teau Lafite Rothschild/i } },
    { $set: { images: [lafiteUpload.secure_url] } }
  );
  console.log(` -> Updated ${lafiteUpdate.modifiedCount} lot(s) for 1982 Château Lafite Rothschild.`);

  // Verify updated lots
  const updatedLots = await AuctionLot.find({
    title: { $in: [
      'The Macallan 1926 60-Year-Old Valerio Adami Edition',
      '1982 Château Lafite Rothschild Pauillac Premier Grand Cru 750ml'
    ]}
  }, 'title images status');

  console.log('\nVerified updated lots in DB:');
  updatedLots.forEach(l => {
    console.log(` - "${l.title}": ${l.images[0]}`);
  });

  await mongoose.disconnect();
  console.log('\nDone successfully!');
}

run().catch(err => {
  console.error('Error during image update:', err);
  process.exit(1);
});
