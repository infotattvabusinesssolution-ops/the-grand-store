require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

async function cleanAuctionLots() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const AuctionLot = mongoose.model('AuctionLot', new mongoose.Schema({}, { strict: false }));

  // Lots that had 4 duplicates (transparent, black, localPng, localJpg)
  const lotNumbersToSingle = [
    'GS-2026-00125',
    'GS-2026-00126',
    'GS-2026-00127',
    'GS-2026-00128', // Jack Daniel's White Rabbit
    'GS-2026-00129',
    'GS-2026-00130',
    'GS-2026-00113', // DRC Romanee-Conti (was [cdn, local])
    'GS-2026-00114'  // Dom Perignon P2 (was [cdn, local])
  ];

  for (const lotNum of lotNumbersToSingle) {
    const lot = await AuctionLot.findOne({ lotNumber: lotNum });
    if (lot && Array.isArray(lot.images) && lot.images.length > 1) {
      const primaryImage = lot.images[0];
      await AuctionLot.updateOne(
        { _id: lot._id },
        { $set: { images: [primaryImage] } }
      );
      console.log(`✅ Set lot ${lotNum} (${lot.title}) to single primary image: ${primaryImage}`);
    }
  }

  // Also specifically check lot by _id from user's screenshot: 6adf3809d723d14c19369944
  const jackLot = await AuctionLot.findById('6adf3809d723d14c19369944');
  if (jackLot && Array.isArray(jackLot.images) && jackLot.images.length > 1) {
    const primaryImg = jackLot.images[0];
    await AuctionLot.updateOne(
      { _id: jackLot._id },
      { $set: { images: [primaryImg] } }
    );
    console.log(`✅ Verified Jack Daniel's White Rabbit (_id: 6adf3809d723d14c19369944) set to:`, [primaryImg]);
  }

  // Verify all
  const verified = await AuctionLot.find({
    lotNumber: { $in: lotNumbersToSingle }
  }).select('lotNumber title images');

  console.log('\n--- Verification ---');
  verified.forEach(l => {
    console.log(`[${l.lotNumber}] ${l.title} -> ${l.images?.length} image(s): ${l.images?.[0]}`);
  });

  await mongoose.disconnect();
  console.log('\nDone cleaning auction lot images!');
}

cleanAuctionLots().catch(err => {
  console.error(err);
  process.exit(1);
});
