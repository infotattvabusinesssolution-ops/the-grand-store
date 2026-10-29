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

const sourceDir = 'C:/Users/HP/.gemini/antigravity-ide/brain/80601eef-001a-4857-b567-0843619f344d/scratch/cropped_bottles';

const targetDirs = [
  path.resolve(__dirname, '../../frontend/public/assets/auction'),
  path.resolve(__dirname, '../../../grand-storelocal/frontend/public/assets/auction')
];

const auctionProducts = [
  {
    slug: 'ballantines-30-year-old',
    fileName: 'ballantines-30-year-old.jpg',
    title: "Ballantine's 30 Year Old Blended Scotch Whisky",
    category: 'Whisky',
    distillery: "Ballantine's (Pernod Ricard)",
    expression: '30 Year Old Very Rare Blended Scotch Whisky',
    ageStatement: '30 Years Old',
    bottleSizeMl: 750,
    abv: 40,
    countryOfOrigin: 'Scotland',
    startingBid: 5500,
    reservePrice: 9900,
    currentBid: 5500,
    estimatedValueMin: 9500,
    estimatedValueMax: 12500,
    condition: 'Pristine original collector condition. Seal intact, label flawless, fill level into neck.',
    provenance: 'Consigned from an elite private cellar; stored continuously in climate-controlled bonded storage.',
    description: "An exceptional, prestigious 30-year-old blended Scotch whisky from Ballantine's. A luxurious blend of rare whiskies aged for a minimum of 30 years, offering profound notes of rich oak, honeyed fruit, subtle smoke, and velvety vanilla. One of Scotland's crowning blending achievements."
  },
  {
    slug: 'cardhu-18-year-old-blue-label',
    fileName: 'cardhu-18-year-old-blue-label.jpg',
    title: 'Cardhu 18 Years Blue Label Single Malt Scotch Whisky',
    category: 'Whisky',
    distillery: 'Cardhu Distillery (Speyside)',
    expression: '18 Year Old Speyside Single Malt (Blue Label Edition)',
    ageStatement: '18 Years Old',
    bottleSizeMl: 750,
    abv: 40,
    countryOfOrigin: 'Scotland',
    startingBid: 1500,
    reservePrice: 2590,
    currentBid: 1500,
    estimatedValueMin: 2500,
    estimatedValueMax: 3500,
    condition: 'Mint condition. Original box and capsule perfectly preserved. Liquid brilliantly clear with high fill.',
    provenance: 'Acquired directly from specialized European merchant cellar; pristine bottle presentation.',
    description: 'Elegant Speyside single malt scotch whisky from Cardhu aged 18 years, distinguished by its blue label presentation. Silky smooth and delicate, featuring notes of sweet fruit, dark chocolate, ripe plums, and subtle warming wood spice.'
  },
  {
    slug: 'glenfiddich-18-year-old-ceramic-decanter-blue',
    fileName: 'glenfiddich-18-year-old-ceramic-decanter-blue.jpg',
    title: 'Glenfiddich Ceramic Decanter 18 Years Old Blue Flagon',
    category: 'Whisky',
    distillery: 'Glenfiddich Distillery (William Grant & Sons)',
    expression: 'Ancient Reserve 18 Year Old Single Malt (Royal Blue Ceramic Decanter)',
    ageStatement: '18 Years Old',
    bottleSizeMl: 750,
    abv: 43,
    countryOfOrigin: 'Scotland',
    startingBid: 3500,
    reservePrice: 5990,
    currentBid: 3500,
    estimatedValueMin: 5800,
    estimatedValueMax: 7800,
    condition: 'Collector-grade stoneware decanter. Gold lettering and trim intact, red wax seal medallion flawless.',
    provenance: 'From an established private whisky collection; cellared in original decanter casing.',
    description: 'A highly coveted collector decanter of Glenfiddich 18 Year Old Single Malt Scotch Whisky, housed in a magnificent Royal Blue porcelain/ceramic flagon adorned with 24-carat gold filigree and a red seal. An iconic archival presentation.'
  },
  {
    slug: 'jack-daniels-white-rabbit',
    fileName: 'jack-daniels-white-rabbit.jpg',
    title: "Jack Daniel's White Rabbit Saloon Tennessee Whiskey",
    category: 'Whisky',
    distillery: 'Jack Daniel Distillery (Lynchburg, Tennessee)',
    expression: 'White Rabbit Saloon 120th Anniversary Edition',
    ageStatement: 'Special Reserve',
    bottleSizeMl: 750,
    abv: 43,
    countryOfOrigin: 'United States',
    startingBid: 1400,
    reservePrice: 2400,
    currentBid: 1400,
    estimatedValueMin: 2300,
    estimatedValueMax: 3200,
    condition: 'Flawless condition. Embossed square glass with commemorative vintage saloon label.',
    provenance: 'Single owner private collection; preserved in dry, dark climate-controlled storage.',
    description: "Commemorative limited-edition bottling honoring Mr. Jack Daniel's White Rabbit Saloon, opened in 1892 in Lynchburg's town square. Bottled at a bold 43% ABV with a distinguished retro-designed label celebrating Tennessee whiskey history."
  },
  {
    slug: 'johnnie-walker-king-george-v',
    fileName: 'johnnie-walker-king-george-v.jpg',
    title: 'Johnnie Walker King George V Blended Scotch Whisky',
    category: 'Whisky',
    distillery: 'John Walker & Sons (Diageo)',
    expression: 'King George V Blended Scotch Whisky (Crystal Decanter)',
    ageStatement: 'Royal Warrant Rare Reserve',
    bottleSizeMl: 750,
    abv: 43,
    countryOfOrigin: 'Scotland',
    startingBid: 5500,
    reservePrice: 9890,
    currentBid: 5500,
    estimatedValueMin: 9500,
    estimatedValueMax: 13000,
    condition: 'Immaculate luxury condition. Heavy crystal decanter, engraved royal warrant crest, pristine gold collar.',
    provenance: 'Consigned from a prominent private Johannesburg estate cellar; authenticated specimen.',
    description: 'Crafted to celebrate the Royal Warrant granted to John Walker & Sons by King George V in 1934. Made using only the finest whiskies from distilleries that operated during his reign, including irreplaceable casks from Port Ellen. Presented in an opulent crystal decanter.'
  }
];

async function run() {
  console.log('=== Step 1: Copy images to public asset directories ===');
  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    for (const item of auctionProducts) {
      const src = path.join(sourceDir, item.fileName);
      const dest = path.join(dir, item.fileName);
      fs.copyFileSync(src, dest);
      console.log(`Copied ${item.fileName} -> ${dir}`);
    }
  }

  console.log('\n=== Step 2: Upload images to Cloudinary (grandstore-auctions) ===');
  const uploadedUrls = {};
  for (const item of auctionProducts) {
    const src = path.join(sourceDir, item.fileName);
    console.log(`Uploading ${item.slug} to Cloudinary...`);
    const uploadRes = await cloudinary.uploader.upload(src, {
      folder: 'grandstore-auctions',
      public_id: item.slug,
      overwrite: true,
      resource_type: 'image'
    });
    uploadedUrls[item.slug] = uploadRes.secure_url;
    console.log(` -> URL: ${uploadRes.secure_url}`);
  }

  console.log('\n=== Step 3: Insert / Update Auction Lots in MongoDB ===');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const AuctionLot = mongoose.model('AuctionLot', new mongoose.Schema({}, { strict: false }));
  
  const adminVendorId = new mongoose.Types.ObjectId('6a82d96f3576df8b5680e526');
  const now = new Date();
  const endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

  let lotCount = await AuctionLot.countDocuments();

  const lotNumberMap = {
    'ballantines-30-year-old': 'GS-2026-00125',
    'cardhu-18-year-old-blue-label': 'GS-2026-00126',
    'glenfiddich-18-year-old-ceramic-decanter-blue': 'GS-2026-00127',
    'jack-daniels-white-rabbit': 'GS-2026-00128',
    'johnnie-walker-king-george-v': 'GS-2026-00129'
  };

  for (const item of auctionProducts) {
    const lotNumber = lotNumberMap[item.slug];
    const existing = await AuctionLot.findOne({
      title: { $regex: new RegExp(item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    });

    const cdnUrl = uploadedUrls[item.slug];
    const localUrl = `/assets/auction/${item.fileName}`;

    if (existing) {
      console.log(`Updating lot ${lotNumber} for ${item.title}...`);
      await AuctionLot.updateOne(
        { _id: existing._id },
        {
          $set: {
            lotNumber: lotNumber,
            images: [cdnUrl, localUrl],
            startingBid: item.startingBid,
            reservePrice: item.reservePrice,
            currentBid: item.currentBid,
            status: 'live',
            startDate: now,
            endDate: endDate,
            distillery: item.distillery,
            expression: item.expression,
            ageStatement: item.ageStatement,
            bottleSizeMl: item.bottleSizeMl,
            abv: item.abv,
            countryOfOrigin: item.countryOfOrigin,
            condition: item.condition,
            provenance: item.provenance,
            description: item.description,
            custodyLocation: 'Grand Store Bonded Vault',
            authenticationStatus: 'Authenticated',
            updatedAt: new Date()
          }
        }
      );
      console.log(` -> Updated lot: ${lotNumber}`);
    } else {
      lotCount++;
      const lotNumber = `GS-2026-${String(lotCount + 100).padStart(5, '0')}`;
      console.log(`Creating new lot ${lotNumber} for ${item.title}...`);
      await AuctionLot.create({
        lotNumber,
        title: item.title,
        description: item.description,
        category: item.category,
        startingBid: item.startingBid,
        reservePrice: item.reservePrice,
        currentBid: item.currentBid,
        bidIncrement: 500,
        startDate: now,
        endDate: endDate,
        originalEndDate: endDate,
        condition: item.condition,
        provenance: item.provenance,
        images: [cdnUrl],
        vendor: adminVendorId,
        status: 'live',
        distillery: item.distillery,
        expression: item.expression,
        ageStatement: item.ageStatement,
        bottleSizeMl: item.bottleSizeMl,
        abv: item.abv,
        countryOfOrigin: item.countryOfOrigin,
        fillLevel: 'Into Neck',
        boxCondition: 'Original Box / Case Pristine',
        sealCondition: 'Intact & Pristine',
        estimatedValueMin: item.estimatedValueMin,
        estimatedValueMax: item.estimatedValueMax,
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
        createdAt: now,
        updatedAt: now
      });
      console.log(` -> Created lot: ${lotNumber}`);
    }
  }

  console.log('\n=== Verifying All Lots in DB ===');
  const allUpdated = await AuctionLot.find({
    title: { $in: auctionProducts.map(p => p.title) }
  }, { lotNumber: 1, title: 1, startingBid: 1, reservePrice: 1, status: 1, images: 1 }).lean();

  allUpdated.forEach(l => {
    console.log(`[${l.lotNumber}] ${l.title} | Starting: R${l.startingBid} | Status: ${l.status} | Img: ${(l.images || [])[0]}`);
  });

  await mongoose.disconnect();
  console.log('\nAll 5 auction products successfully added & verified!');
}

run().catch(err => {
  console.error('Failed to add auction products:', err);
  process.exit(1);
});
