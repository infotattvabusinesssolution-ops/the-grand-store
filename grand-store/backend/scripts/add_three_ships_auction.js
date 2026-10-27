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

async function run() {
  const slug = 'three-ships-13-year-old';
  console.log('=== 1. Copying Three Ships HD images to public assets ===');
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(transSourceDir, `${slug}.png`), path.join(dir, `${slug}.png`));
    fs.copyFileSync(path.join(blackSourceDir, `${slug}.jpg`), path.join(dir, `${slug}.jpg`));
    console.log(`Copied ${slug}.png and .jpg to ${dir}`);
  }

  console.log('\n=== 2. Uploading Three Ships to Cloudinary ===');
  const transUpload = await cloudinary.uploader.upload(path.join(transSourceDir, `${slug}.png`), {
    folder: 'grandstore-auctions',
    public_id: `${slug}-transparent`,
    overwrite: true,
    resource_type: 'image'
  });
  console.log(' -> Transparent URL:', transUpload.secure_url);

  const blackUpload = await cloudinary.uploader.upload(path.join(blackSourceDir, `${slug}.jpg`), {
    folder: 'grandstore-auctions',
    public_id: `${slug}-black`,
    overwrite: true,
    resource_type: 'image'
  });
  console.log(' -> Black Studio URL:', blackUpload.secure_url);

  console.log('\n=== 3. Upserting Three Ships in MongoDB ===');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const AuctionLot = mongoose.model('AuctionLot', new mongoose.Schema({}, { strict: false }));

  const adminVendorId = new mongoose.Types.ObjectId('6a82d96f3576df8b5680e526');
  const now = new Date();
  const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

  const lotNumber = 'GS-2026-00130';
  const title = 'Three Ships 13 Year Old Cape Ruby Cask Single Malt Whisky';

  const existing = await AuctionLot.findOne({
    $or: [
      { lotNumber: lotNumber },
      { title: /Three Ships/i }
    ]
  });

  const lotData = {
    lotNumber,
    title,
    description: "A celebrated collector bottling from the James Sedgwick Distillery in Wellington, South Africa, crafted by Master Distiller Andy Watts. Finished in authentic Cape Ruby port-style casks, yielding opulent notes of sun-dried fruit, dark cherries, Christmas cake, and warming nutmeg. An outstanding benchmark of South African whisky heritage.",
    category: 'Whisky',
    startingBid: 1000,
    reservePrice: 1550,
    currentBid: 1000,
    bidIncrement: 250,
    startDate: now,
    endDate: endDate,
    originalEndDate: endDate,
    condition: 'Pristine limited edition bottling. Flawless capsule with vertical special release strip, immaculate label, into-neck fill.',
    provenance: 'Acquired from private collector cellar in the Western Cape; stored continuously in optimal cellar conditions.',
    images: [
      transUpload.secure_url,
      blackUpload.secure_url,
      `/assets/auction/${slug}.png`,
      `/assets/auction/${slug}.jpg`
    ],
    vendor: adminVendorId,
    status: 'live',
    distillery: 'James Sedgwick Distillery (Wellington, South Africa)',
    expression: '13 Year Old Single Malt (Cape Ruby Cask Finish)',
    ageStatement: '13 Years Old',
    bottleSizeMl: 750,
    abv: 46.5,
    countryOfOrigin: 'South Africa',
    fillLevel: 'Into Neck',
    boxCondition: 'Original Box / Case Pristine',
    sealCondition: 'Intact & Pristine',
    estimatedValueMin: 1500,
    estimatedValueMax: 2200,
    reserveType: 'confidential',
    reserveMet: false,
    authenticationStatus: 'Authenticated',
    custodyLocation: 'Grand Store Bonded Vault',
    bidCount: 0,
    extensionCount: 0,
    isExtended: false,
    fulfilmentStatus: 'Awaiting Payment',
    paymentStatus: 'Pending',
    isPaid: false,
    updatedAt: now
  };

  if (existing) {
    await AuctionLot.updateOne({ _id: existing._id }, { $set: lotData });
    console.log(`Updated existing lot: ${lotNumber}`);
  } else {
    lotData.createdAt = now;
    await AuctionLot.create(lotData);
    console.log(`Created new lot: ${lotNumber}`);
  }

  console.log('\n=== 4. Checking Both Lots (Ballantines 30 & Three Ships 13) ===');
  const checkLots = await AuctionLot.find({
    lotNumber: { $in: ['GS-2026-00125', 'GS-2026-00130'] }
  }, { lotNumber: 1, title: 1, startingBid: 1, reservePrice: 1, status: 1, images: 1 }).lean();

  checkLots.forEach(l => {
    console.log(`[${l.lotNumber}] ${l.title} | Starting: R${l.startingBid} | Status: ${l.status}`);
    console.log(`  Transparent Image: ${l.images[0]}`);
    console.log(`  Black Studio Image: ${l.images[1]}`);
  });

  await mongoose.disconnect();
  console.log('\nBoth products are now active in the auction!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
