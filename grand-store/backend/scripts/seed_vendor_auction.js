const fs = require('fs');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function seedVendorAuctions() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const AuctionLot = mongoose.model('AuctionLot', new mongoose.Schema({}, { strict: false }));

  // Find active vendor
  const vendorUser = await User.findOne({ email: 'vendor@grandstore.com' });
  if (!vendorUser) {
    throw new Error('vendor@grandstore.com not found');
  }
  console.log(`Found vendor: ${vendorUser.name} (${vendorUser.email}) - ID: ${vendorUser._id}`);

  // Update vendor role to ensure it is vendor_active
  if (vendorUser.role !== 'vendor_active') {
    await User.updateOne({ _id: vendorUser._id }, { $set: { role: 'vendor_active' } });
    console.log('Updated vendor role to vendor_active');
  }

  // 1. Assign the newly created luxury whisky lots to this vendor
  const lotNumbersToAssign = [
    'GS-2026-00125', // Ballantine's 30
    'GS-2026-00126', // Cardhu 18
    'GS-2026-00127', // Glenfiddich 18 Decanter
    'GS-2026-00128', // Jack Daniel's White Rabbit
    'GS-2026-00129', // Johnnie Walker King George V
    'GS-2026-00130'  // Three Ships 13
  ];

  const updateRes = await AuctionLot.updateMany(
    { lotNumber: { $in: lotNumbersToAssign } },
    { $set: { vendor: vendorUser._id } }
  );
  console.log(`Assigned ${updateRes.modifiedCount} lots to vendor ${vendorUser.email}`);

  // 2. Ensure vendor has at least one pending_approval lot for realistic workflow testing
  const drcLot = await AuctionLot.findOne({ lotNumber: 'GS-2026-00113' });
  if (drcLot) {
    await AuctionLot.updateOne(
      { _id: drcLot._id },
      { 
        $set: { 
          vendor: vendorUser._id,
          status: 'pending_approval',
          authenticationStatus: 'Pending'
        } 
      }
    );
    console.log('Ensured GS-2026-00113 (DRC 1990) is pending_approval for vendor');
  }

  // 3. Ensure vendor has at least one upcoming lot
  const dpLot = await AuctionLot.findOne({ lotNumber: 'GS-2026-00114' });
  if (dpLot) {
    const now = new Date();
    const startSoon = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // starts in 2 days
    const endLater = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);
    await AuctionLot.updateOne(
      { _id: dpLot._id },
      { 
        $set: { 
          vendor: vendorUser._id,
          status: 'upcoming',
          startDate: startSoon,
          endDate: endLater,
          authenticationStatus: 'Authenticated'
        } 
      }
    );
    console.log('Ensured GS-2026-00114 (Dom Pérignon P2) is upcoming for vendor');
  }

  // 4. Verification: check all lots owned by this vendor
  const vendorLots = await AuctionLot.find(
    { vendor: vendorUser._id },
    { lotNumber: 1, title: 1, status: 1, startingBid: 1, reservePrice: 1, currentBid: 1 }
  ).sort({ createdAt: -1 }).lean();

  console.log(`\n=== Verified: Vendor ${vendorUser.email} now has ${vendorLots.length} auction lots ===`);
  vendorLots.forEach((l, i) => {
    console.log(`${i + 1}. [${l.lotNumber || 'Pending'}] ${l.title} | Status: ${l.status} | Start: R${l.startingBid} | Reserve: R${l.reservePrice}`);
  });

  await mongoose.disconnect();
  console.log('\nVendor auction seeding complete!');
}

seedVendorAuctions().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
