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

const sourceFile = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\06826049-49e8-4713-97b2-45b8684250f3\\chateau_chaplosi_2015_1792821209304.jpg';

const publicAuctionDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/auction'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/auction')
];

async function run() {
  console.log('1. Copying authentic photo to local public assets...');
  for (const dir of publicAuctionDirs) {
    if (fs.existsSync(dir)) {
      fs.copyFileSync(sourceFile, path.join(dir, 'chateau-chaplosi-2015.jpg'));
      console.log(` -> Copied to: ${dir}`);
    }
  }

  console.log('\n2. Uploading authentic photo to Cloudinary (grandstore-auctions folder)...');
  const uploadRes = await cloudinary.uploader.upload(sourceFile, {
    folder: 'grandstore-auctions',
    public_id: 'chateau-chaplosi-2015',
    overwrite: true,
    resource_type: 'image'
  });
  console.log(' -> Uploaded secure_url:', uploadRes.secure_url);

  console.log('\n3. Connecting to MongoDB to update Château Chaplosi auction lot...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const AuctionLot = mongoose.model('AuctionLot', new mongoose.Schema({}, { strict: false }));

  const updateRes = await AuctionLot.updateMany(
    { title: { $regex: /Ch[aâ]teau Chaplosi/i } },
    { $set: { images: [uploadRes.secure_url] } }
  );
  console.log(` -> Updated ${updateRes.modifiedCount} lot(s).`);

  const updatedLot = await AuctionLot.findOne({ title: { $regex: /Ch[aâ]teau Chaplosi/i } }, 'title images status');
  console.log('\nVerified lot in DB:', updatedLot);

  await mongoose.disconnect();
  console.log('\nDone successfully!');
}

run().catch(err => {
  console.error('Error during update:', err);
  process.exit(1);
});
