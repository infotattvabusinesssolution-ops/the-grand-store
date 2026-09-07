const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

const express = require('express');
const mongoose = require('mongoose');
const assert = require('assert');

const orderRoutes = require('../routes/orderRoutes');
const payfastRoutes = require('../routes/payfastRoutes');
const authRoutes = require('../routes/authRoutes');
const Order = require('../models/Order');
const User = require('../models/User');
const Shipment = require('../models/Shipment');
const SuperCoinLedger = require('../models/SuperCoinLedger');

async function runTest() {
  console.log('--- Starting Frictionless Guest Checkout Automated Tests ---');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const testEmail = 'guest_tester_' + Date.now() + '@example.com';

  // Setup test Express server
  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);
  app.use('/api/payfast', payfastRoutes);
  app.use('/api/auth', authRoutes);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Prepare Quote Payload
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const testQuote = {
      expiresAt: expiresAt.toISOString(),
      globalSubtotal: 750,
      aggregatedTotals: {
        shipping: 100,
        vat: 112.5,
        estimatedImportDuties: 0,
        estimatedImportTaxes: 0,
        estimatedCustomsFees: 0,
        totalToPay: 850
      },
      shipments: [
        {
          vendorId: null,
          vendorName: 'The Grand Store Reserve',
          originCountry: 'South Africa',
          subtotal: 750,
          taxData: { vatAmount: 112.5 },
          items: [
            {
              product: new mongoose.Types.ObjectId(),
              name: 'Reserve Single Malt Whisky',
              price: 750,
              quantity: 1,
              qty: 1,
              weightKg: 1.5
            }
          ],
          selectedCourier: {
            courierName: 'Courier Guy',
            cost: 100,
            deliveryType: 'door_delivery'
          }
        }
      ]
    };

    const guestOrderPayload = {
      quote: testQuote,
      isGuest: true,
      guestName: 'Sir Reginald Guest',
      guestEmail: testEmail,
      guestPhone: '+27829998877',
      isAgeConfirmed: true,
      shippingAddress: {
        address: '42 Sandton Boulevard',
        city: 'Johannesburg',
        postalCode: '2196',
        country: 'South Africa',
        phone: '+27829998877'
      },
      deliveryPreference: 'home',
      paymentMethod: 'PayFast'
    };

    // TEST 1: Place Order as Unauthenticated Guest
    console.log('\n[TEST 1] Placing order as unauthenticated guest via POST /api/orders...');
    const createRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestOrderPayload)
    });

    assert.equal(createRes.status, 201, `Expected 201 Created, got ${createRes.status}`);
    const createdOrder = await createRes.json();

    assert.ok(createdOrder._id, 'Order must have an _id');
    assert.equal(createdOrder.user, null, 'Guest order user must be null');
    assert.equal(createdOrder.isGuest, true, 'isGuest must be true');
    assert.equal(createdOrder.guestInfo.email, testEmail, 'guestInfo.email must match');
    assert.equal(createdOrder.guestInfo.name, 'Sir Reginald Guest', 'guestInfo.name must match');
    assert.equal(createdOrder.isAgeConfirmed, true, 'isAgeConfirmed must be true');
    assert.ok(createdOrder.guestAccessToken, 'guestAccessToken must be generated');
    console.log('✅ TEST 1 Passed: Guest order created safely without auth barriers. Order ID:', createdOrder.orderId);

    // TEST 2: Fetch Guest Order Details without Auth
    console.log('\n[TEST 2] Fetching guest order receipt via GET /api/orders/:id...');
    const getRes = await fetch(`${baseUrl}/api/orders/${createdOrder._id}`);
    assert.equal(getRes.status, 200, `Expected 200 OK, got ${getRes.status}`);
    const fetchedOrder = await getRes.json();
    assert.equal(fetchedOrder._id, createdOrder._id);
    assert.equal(fetchedOrder.isGuest, true);
    assert.equal(fetchedOrder.guestInfo.email, testEmail);
    console.log('✅ TEST 2 Passed: Guest order fetched without 401 Unauthorized.');

    // TEST 3: Generate PayFast Payload for Guest Order
    console.log('\n[TEST 3] Generating PayFast payload for guest order via POST /api/payfast/generate-shop...');
    const pfRes = await fetch(`${baseUrl}/api/payfast/generate-shop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: createdOrder._id })
    });
    assert.equal(pfRes.status, 200, `Expected 200 OK, got ${pfRes.status}`);
    const pfData = await pfRes.json();
    assert.ok(pfData.url, 'Must return PayFast gateway url');
    assert.equal(pfData.data.email_address, testEmail, 'PayFast email must match guest email');
    assert.equal(pfData.data.name_first, 'Sir', 'First name extracted properly');
    assert.match(pfData.data.return_url, /order-success.*guest=true/, 'Guest return URL must point to order-success with guest=true');
    console.log('✅ TEST 3 Passed: PayFast payload generated for guest order with correct return URLs and customer data.');

    // TEST 4: Upload Bank Transfer Proof without Auth
    console.log('\n[TEST 4] Uploading proof of payment via POST /api/orders/:orderId/bank-transfer/upload...');
    const proofRes = await fetch(`${baseUrl}/api/orders/${createdOrder._id}/bank-transfer/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proofUrl: 'https://cdn.grandstore.co.za/proofs/test-proof-123.pdf' })
    });
    assert.equal(proofRes.status, 200, `Expected 200 OK, got ${proofRes.status}`);
    const proofData = await proofRes.json();
    assert.equal(proofData.order.paymentStatus, 'Awaiting_Approval', 'Payment status must be Awaiting_Approval');
    assert.equal(proofData.order.proofUrl, 'https://cdn.grandstore.co.za/proofs/test-proof-123.pdf');
    console.log('✅ TEST 4 Passed: Guest bank transfer proof uploaded successfully.');

    // TEST 5: 1-Click Post-Order Account Creation (Section 6 & Quick Buyer)
    console.log('\n[TEST 5] Converting guest order to registered account via POST /api/auth/convert-guest...');
    const convertRes = await fetch(`${baseUrl}/api/auth/convert-guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: createdOrder._id,
        password: 'GrandPassword2026!'
      })
    });
    assert.equal(convertRes.status, 201, `Expected 201 Created, got ${convertRes.status}`);
    const authData = await convertRes.json();

    assert.ok(authData._id, 'User account must have _id');
    assert.ok(authData.token, 'JWT token must be returned for automatic login');
    assert.equal(authData.email, testEmail);
    assert.equal(authData.name, 'Sir Reginald Guest');

    // Verify User in DB has 100 Welcome Super Coins
    const dbUser = await User.findById(authData._id);
    assert.ok(dbUser, 'User must exist in DB');
    assert.equal(dbUser.superCoinsBalance, 100, 'User must receive 100 Welcome Super Coins');

    // Verify Order is now linked to the user
    const updatedOrder = await Order.findById(createdOrder._id);
    assert.equal(updatedOrder.user.toString(), dbUser._id.toString(), 'Order must be linked to new user');
    assert.equal(updatedOrder.isGuest, false, 'Order isGuest flag should be converted to false');

    // Verify SuperCoinLedger entry was logged
    const ledgerEntry = await SuperCoinLedger.findOne({ userId: dbUser._id, activity: 'registration' });
    assert.ok(ledgerEntry, 'SuperCoinLedger registration entry must exist');
    assert.equal(ledgerEntry.amount, 100, 'Ledger entry must be 100 coins');
    console.log('✅ TEST 5 Passed: 1-click account conversion created user, linked order, and awarded 100 Welcome Super Coins!');

    // Cleanup
    await Order.findByIdAndDelete(createdOrder._id);
    await Shipment.deleteMany({ orderId: createdOrder._id });
    await User.findByIdAndDelete(dbUser._id);
    await SuperCoinLedger.deleteMany({ userId: dbUser._id });
    console.log('\n🧹 Cleaned up test data.');

    console.log('\n🎉 ALL 5 GUEST CHECKOUT AUTOMATED TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTest().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
