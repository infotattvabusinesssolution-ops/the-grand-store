const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const dummyLotIds = [
  '6a958695b26c07f4848aebc0', // "best wine "
  '6a9584e6b26c07f4848aea03', // "wine auction"
  '6a95896cd59ce399e7017eb7', // "wine"
  '6a9918a49c4aca90f9431118', // "wdqd"
  '6a9edb94537d52a425cc4b5c', // "Desi pilaaa"
  '6a82dfc5964d0d826d9e9643', // "Old monk 30"
  '6a9915b01ae3487f8d88ed19', // "Test Macallan 25"
  '6a9915c091ce804187ca9c08', // "Test Macallan 25"
  '6a9af465f4d1577a4ee7ab7b', // "dwqdq"
  '6a9f044dff4ad58ffeb90f27', // "dwqvdqhvdq"
  '6a86adaa3fe575871ab0a6fd', // "Old wine - 1880"
  '6a86bc207522705b7bd5c814', // "Champagne Premium"
  '6a86bfd92eda9edd1a18d7d8'  // "Champagne - 2025"
];

async function cleanupDummyAuctions() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const AuctionLot = mongoose.model('AuctionLot', new mongoose.Schema({}, { strict: false }));
  const Bid = mongoose.model('Bid', new mongoose.Schema({}, { strict: false }));
  const AuctionLedger = mongoose.model('AuctionLedger', new mongoose.Schema({}, { strict: false }));

  const objectIds = dummyLotIds.map(id => new mongoose.Types.ObjectId(id));

  // Find lots to be deleted for logging
  const toDelete = await AuctionLot.find({ _id: { $in: objectIds } }, 'title lotNumber status images');
  console.log(`Found ${toDelete.length} dummy/test auction lots to delete:`);
  toDelete.forEach(lot => {
    console.log(` - [${lot.lotNumber || 'N/A'}] "${lot.title}" (${lot.status})`);
  });

  // Delete AuctionLots
  const lotResult = await AuctionLot.deleteMany({ _id: { $in: objectIds } });
  console.log(`Deleted ${lotResult.deletedCount} AuctionLot record(s).`);

  // Delete associated bids
  const bidResult = await Bid.deleteMany({ lot: { $in: objectIds } });
  console.log(`Deleted ${bidResult.deletedCount} associated Bid record(s).`);

  // Delete associated ledgers
  const ledgerResult = await AuctionLedger.deleteMany({ lot: { $in: objectIds } });
  console.log(`Deleted ${ledgerResult.deletedCount} associated AuctionLedger record(s).`);

  // List remaining lots
  const remaining = await AuctionLot.find({}).sort({ endDate: 1 });
  console.log(`\nRemaining authentic auction lots in database (${remaining.length}):`);
  remaining.forEach((lot, idx) => {
    console.log(` ${idx + 1}. [${lot.lotNumber || 'N/A'}] "${lot.title}" | Status: ${lot.status} | Image: ${lot.images && lot.images[0]}`);
  });

  await mongoose.disconnect();
  console.log('\nCleanup completed successfully.');
}

cleanupDummyAuctions().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
