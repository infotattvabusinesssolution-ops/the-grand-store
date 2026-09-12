const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

process.env.PAYFAST_IS_LIVE = 'false';
process.env.PAYFAST_TEST_MERCHANT_ID = '10000100';
process.env.PAYFAST_TEST_MERCHANT_KEY = 'test-key';
process.env.PAYFAST_TEST_PASSPHRASE = 'test-passphrase';

const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const AuctionLot = require('../models/AuctionLot');
const BidderDeposit = require('../models/BidderDeposit');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const payfastRoutes = require('../routes/payfastRoutes');

test('Comprehensive Payment Gateway (Mobile & Cancellation Flow across all modules)', async (t) => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/grand-store';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB in test');

  const testUser = await User.create({
    name: 'Gateway Mobile Patron',
    email: `mobile_test_${Date.now()}@grandstore.co.za`,
    password: 'Password123!',
    role: 'customer',
  });
  console.log('Created testUser:', testUser._id);

  const testVendorUser = await User.create({
    name: 'Gateway Vendor Partner',
    email: `vendor_test_${Date.now()}@grandstore.co.za`,
    password: 'Password123!',
    role: 'vendor_active',
  });

  const testVendor = await Vendor.create({
    userId: testVendorUser._id,
    storeName: 'Test Winery Boutique',
    registrationFee: 2500,
    paymentStatus: 'unpaid',
  });

  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET || 'fallback_secret_for_tests');

  // Setup Express server for routing tests
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/payfast', payfastRoutes);

  let server;
  let baseUrl;
  try {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
    console.log('Test server ready at', baseUrl);
  } catch (err) {
    console.error('SETUP ERROR:', err);
    throw err;
  }

  t.after(async () => {
    if (server) {
      if (server.closeAllConnections) server.closeAllConnections();
      await new Promise((res) => server.close(res));
    }
    await User.deleteMany({ _id: { $in: [testUser._id, testVendorUser._id] } });
    await Vendor.deleteMany({ _id: testVendor._id });
    await Booking.deleteMany({ user: testUser._id });
    await AuctionLot.deleteMany({ winner: testUser._id });
    await BidderDeposit.deleteMany({ bidder: testUser._id });
    await Order.deleteMany({ user: testUser._id });
    await mongoose.disconnect();
  });

  // --- 1. VIP Bidder Deposit Payment Generation with isMobile ---
  await t.test('1. generateDepositPayment supports isMobile and points to mobile-return', async () => {
    try {
      const deposit = await BidderDeposit.create({
        bidder: testUser._id,
        amount: 5000,
        paymentStatus: 'pending',
        paymentReference: `DEP-TEST-${Date.now()}`,
      });

      const res = await fetch(`${baseUrl}/api/payfast/generate-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ depositId: deposit._id, isMobile: true }),
      });

      const resText = await res.text();
      if (res.status !== 200) {
        console.error('Test 1 failed with status', res.status, resText);
      }
      assert.equal(res.status, 200);
      const body = JSON.parse(resText);
      assert.ok(body.data, 'Data payload generated');
      assert.ok(body.data.return_url.includes('/api/payfast/mobile-return?type=deposit'), 'Mobile return URL correct');
      assert.ok(body.data.cancel_url.includes('status=cancel'), 'Mobile cancel URL correct');
      assert.equal(body.data.m_payment_id, `DEP-${deposit._id}`);
    } catch (e) {
      console.error('ERROR IN TEST 1:', e);
      throw e;
    }
  });

  // --- 2. Event Ticket Payment Generation with isMobile and Seat Cancellation ---
  await t.test('2. Event Ticket: isMobile generator and seat release upon payment cancellation', async () => {
    const event = await Event.create({
      title: 'Cape Winelands Gala Dinner',
      description: 'Exclusive Grand Tasting Dinner in Cape Winelands',
      type: 'Wine Tasting',
      format: 'Physical',
      capacity: 50,
      location: 'Stellenbosch Estate, Western Cape',
      startTime: '18:00',
      endTime: '22:00',
      vendorId: testVendorUser._id,
      date: new Date(Date.now() + 86400000 * 7),
      ticketTiers: [
        {
          name: 'VIP Reserve Table',
          price: 1500,
          quantity: 20,
          sold: 0,
          reserved: 4, // 4 seats currently held by this booking
        }
      ],
      approvalStatus: 'approved',
    });
    const tier = event.ticketTiers[0];

    const booking = await Booking.create({
      user: testUser._id,
      event: event._id,
      vendor: testVendorUser._id,
      ticketType: tier.name,
      ticketTierId: tier._id,
      unitPrice: 1500,
      quantity: 4,
      subTotal: 6000,
      totalPrice: 6000,
      ticketId: `TCK-TEST-${Date.now()}`,
      gsReference: `GS-26-EVT-BKG-TEST`,
      paymentMethod: 'PayFast',
      paymentStatus: 'Pending',
      ticketStatus: 'Pending',
      inventoryStatus: 'reserved',
      reservationExpiresAt: new Date(Date.now() + 3600000),
    });

    // Test generator with isMobile
    const genRes = await fetch(`${baseUrl}/api/payfast/generate-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ bookingId: booking._id, isMobile: true }),
    });
    assert.equal(genRes.status, 200);
    const genData = await genRes.json();
    assert.ok(genData.data.return_url.includes('/api/payfast/mobile-return?type=event'), 'Event mobile return configured');

    // Test explicit cancellation endpoint
    const cancelRes = await fetch(`${baseUrl}/api/payfast/cancel-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking._id, reason: 'Patron cancelled checkout on mobile' }),
    });
    assert.equal(cancelRes.status, 200);
    const cancelBody = await cancelRes.json();
    assert.equal(cancelBody.success, true);

    // Verify booking updated
    const updatedBooking = await Booking.findById(booking._id);
    assert.equal(updatedBooking.paymentStatus, 'Cancelled');
    assert.equal(updatedBooking.ticketStatus, 'Cancelled');
    assert.equal(updatedBooking.inventoryStatus, 'released');

    // Verify reserved seats released in Event model
    const updatedEvent = await Event.findById(event._id);
    const updatedTier = updatedEvent.ticketTiers.id(tier._id);
    assert.equal(updatedTier.reserved, 0, 'Reserved seats should be released back to 0');
  });

  // --- 3. Auction Won Lot: isMobile generator and cancellation ---
  await t.test('3. Auction Won Lot: isMobile generator, order cancellation, and status handling', async () => {
    const lot = await AuctionLot.create({
      title: '1982 Chateau Lafite Rothschild',
      description: 'Pauillac Premier Grand Cru Classe, original wooden case',
      category: 'Wine',
      vendor: testVendorUser._id,
      winner: testUser._id,
      startingBid: 10000,
      reservePrice: 20000,
      winningBid: 25000,
      currentBid: 25000,
      totalPaidByBuyer: 31250,
      status: 'sold',
      paymentStatus: 'Pending',
      lotNumber: 101,
    });

    // Associated pending order
    const order = await Order.create({
      user: testUser._id,
      orderId: `AUC-ORD-${Date.now()}`,
      invoiceNumber: `INV-AUC-${Date.now()}`,
      transactionId: `TXN-AUC-TEST-${Date.now()}`,
      paymentId: `PAY-AUC-${Date.now()}`,
      orderItems: [{
        product: lot._id,
        name: lot.title,
        quantity: 1,
        price: 25000,
      }],
      totalPrice: 31250,
      paymentMethod: 'PayFast',
      paymentStatus: 'Pending',
      isPaid: false,
      shippingAddress: { address: 'Cape Town', city: 'Cape Town', postalCode: '8001', country: 'South Africa' },
    });

    // Test generator with isMobile
    const genRes = await fetch(`${baseUrl}/api/payfast/generate-auction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ auctionId: lot._id, isMobile: true }),
    });
    assert.equal(genRes.status, 200);
    const genData = await genRes.json();
    assert.ok(genData.data.return_url.includes('/api/payfast/mobile-return?type=auction'), 'Auction mobile return configured');

    // Test cancellation
    const cancelRes = await fetch(`${baseUrl}/api/payfast/cancel-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auctionId: lot._id, reason: 'Aborted checkout' }),
    });
    assert.equal(cancelRes.status, 200);

    const updatedOrder = await Order.findById(order._id);
    assert.equal(updatedOrder.paymentStatus, 'Cancelled', 'Associated Order must be marked Cancelled so admin orders exclude it');

    const updatedLot = await AuctionLot.findById(lot._id);
    assert.equal(updatedLot.paymentStatus, 'Pending', 'Lot paymentStatus remains Pending for retry');
  });

  // --- 4. Mobile Return WebView HTML & postMessage for all types ---
  await t.test('4. mobileReturnHandler renders postMessage with correct itemType and cancellation payload', async () => {
    // Mobile cancel for deposit
    const depCancelRes = await fetch(`${baseUrl}/api/payfast/mobile-return?type=deposit&depositId=DEP-123&status=cancel`);
    assert.equal(depCancelRes.status, 200);
    const depHtml = await depCancelRes.text();
    assert.ok(depHtml.includes('ReactNativeWebView.postMessage'), 'Contains ReactNative postMessage');
    assert.ok(depHtml.includes('"type":"PAYFAST_CANCEL"'), 'Contains PAYFAST_CANCEL type');
    assert.ok(depHtml.includes('"itemType":"deposit"'), 'Contains deposit itemType');
    assert.ok(depHtml.includes('Payment Cancelled'), 'Shows Payment Cancelled UI');

    // Mobile cancel for event
    const evtCancelRes = await fetch(`${baseUrl}/api/payfast/mobile-return?type=event&bookingId=EVT-456&status=cancel`);
    assert.equal(evtCancelRes.status, 200);
    const evtHtml = await evtCancelRes.text();
    assert.ok(evtHtml.includes('"itemType":"event"'), 'Contains event itemType');
    assert.ok(evtHtml.includes('"status":"cancel"'), 'Contains cancel status');
  });
});
