const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

async function cleanupTestUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Starting test user cleanup audit...');

  const usersCollection = mongoose.connection.collection('users');
  const ordersCollection = mongoose.connection.collection('orders');
  const lotsCollection = mongoose.connection.collection('auctionlots');

  const allUsers = await usersCollection.find({}).toArray();
  const allOrders = await ordersCollection.find({}).toArray();
  const allLots = await lotsCollection.find({}).toArray();

  const userIdsWithOrders = new Set(allOrders.map(o => String(o.user)));
  const userIdsWithBids = new Set();
  allLots.forEach(lot => {
    if (lot.bids) lot.bids.forEach(b => userIdsWithBids.add(String(b.bidder || b.user)));
    if (lot.winner) userIdsWithBids.add(String(lot.winner));
  });

  const protectedEmails = [
    'hazardtoxic3@gmail.com',
    'crmadmin@grandstore.com',
    'admin@grandstore.com',
    'admin1@grandstore.com',
    'accountant@grandstore.com',
    'productmanager@grandstore.com',
    'pm@grandstore.com',
    'customer@grandstore.com',
    'vendor@grandstore.com',
    'vendor1@grandstore.com',
    'vendor2@grandstore.com',
    'customer_48038244@grandstore.co.za' // has legitimate order
  ];

  const protectedRoles = ['super_admin', 'admin', 'accountant', 'product_manager', 'auction_host', 'event_host'];

  const usersToDelete = [];

  for (const u of allUsers) {
    const email = (u.email || '').toLowerCase().trim();
    const name = (u.name || '').toLowerCase().trim();
    const idStr = String(u._id);

    // Safety checks: skip protected accounts
    if (protectedEmails.includes(email)) continue;
    if (protectedRoles.includes(u.role)) continue;
    if (userIdsWithOrders.has(idStr)) continue;
    if (userIdsWithBids.has(idStr)) continue;

    // Check test patterns
    const isTest = 
      /test|dummy|fake|sample/i.test(email) ||
      email.startsWith('mobile_test_') ||
      ['customer_21234567@grandstore.co.za', 'customer_29998877@grandstore.co.za', 'customer_45550123@grandstore.co.za'].includes(email) ||
      /@(cazlq\.com|mailinator\.com)/i.test(email) ||
      /\btest\b|\btesting\b|\btester\b|\btestuser\b|\bdummy\b|\bfake\b/i.test(name) ||
      name.startsWith('gateway mobile') ||
      name === 'test vip patron' ||
      name === 'test patron';

    if (isTest) {
      usersToDelete.push({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      });
    }
  }

  console.log(`Initial total users: ${allUsers.length}`);
  console.log(`Identified ${usersToDelete.length} confirmed test users for safe deletion.`);

  usersToDelete.forEach((u, i) => {
    console.log(`  [${i + 1}] Deleting: ${u.name} <${u.email}> (${u.role}) - ID: ${u._id}`);
  });

  if (usersToDelete.length > 0) {
    const ids = usersToDelete.map(u => u._id);
    const result = await usersCollection.deleteMany({ _id: { $in: ids } });
    console.log(`\nSuccessfully deleted ${result.deletedCount} test users from database.`);
  }

  const finalUserCount = await usersCollection.countDocuments();
  console.log(`Final remaining users in database: ${finalUserCount}`);

  await mongoose.disconnect();
}

cleanupTestUsers().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
