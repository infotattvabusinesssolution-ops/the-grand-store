const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

describe('Admin Exclusion & Gmail Template Verification for Failed Tickets & Auctions', () => {
  let Booking, Order, AuctionLot, AuctionLedger, BidderDeposit, User;
  let financeController, auctionController, adminController, orderController;
  let testUser, testEventBooking, testAuctionOrder, testAuctionLot, testLedger, testDeposit;

  before(async () => {
    require('dotenv').config();
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/grand-store';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    Booking = require('../models/Booking');
    Order = require('../models/Order');
    AuctionLot = require('../models/AuctionLot');
    AuctionLedger = require('../models/AuctionLedger');
    BidderDeposit = require('../models/BidderDeposit');
    User = require('../models/User');

    financeController = require('../controllers/financeController');
    auctionController = require('../controllers/auctionController');
    adminController = require('../controllers/adminController');
    orderController = require('../controllers/orderController');

    // Create test user
    testUser = await User.create({
      name: 'Verification Patron',
      email: `patron-${Date.now()}@example.com`,
      password: 'password123',
      role: 'admin' // role admin for testing admin controllers
    });

    // 1. Create a Cancelled Ticket Booking
    testEventBooking = await Booking.create({
      user: testUser._id,
      customerName: testUser.name,
      customerEmail: testUser.email,
      event: new mongoose.Types.ObjectId(),
      vendor: testUser._id,
      ticketTierId: new mongoose.Types.ObjectId(),
      unitPrice: 750,
      subTotal: 1500,
      ticketId: `TCK-TEST-${Date.now()}`,
      gsReference: `GS-EVT-${Date.now()}`,
      ticketType: 'VIP Cellar Pass',
      quantity: 2,
      totalPrice: 1500,
      paymentStatus: 'Cancelled',
      ticketStatus: 'Cancelled'
    });

    // 2. Create an Auction Lot & an associated Cancelled Won Order
    testAuctionLot = await AuctionLot.create({
      title: '1982 Chateau Lafite Rothschild Magnum',
      description: 'Rare vintage wine stored in temperature controlled cellar',
      category: 'Wine & Spirits',
      lotNumber: Math.floor(1000 + Math.random() * 9000),
      currentBid: 25000,
      startingBid: 10000,
      reservePrice: 15000,
      status: 'sold',
      paymentStatus: 'Pending',
      winner: testUser._id,
      vendor: testUser._id
    });

    testAuctionOrder = await Order.create({
      user: testUser._id,
      orderId: `AUC-ORD-${Date.now()}`,
      invoiceNumber: `INV-AUC-${Date.now()}`,
      transactionId: `GS-26-AUC-${Date.now()}`,
      paymentId: `PID-AUC-${Date.now()}`,
      paymentMethod: 'PayFast',
      paymentStatus: 'Cancelled',
      isPaid: false,
      totalPrice: 28750,
      shippingAddress: {
        fullName: 'Test Patron',
        address: '10 Oxford Road',
        city: 'Rosebank',
        postalCode: '2196',
        country: 'South Africa'
      },
      orderItems: [{
        name: `Auction Lot #${testAuctionLot.lotNumber}: ${testAuctionLot.title}`,
        quantity: 1,
        price: 25000,
        product: testAuctionLot._id,
        category: 'Auction'
      }]
    });

    // 3. Create a cancelled/awaiting AuctionLedger entry
    testLedger = await AuctionLedger.create({
      lot: testAuctionLot._id,
      transactionRef: `GS-AUC-LEDGER-${Date.now()}`,
      buyer: testUser._id,
      vendor: testUser._id,
      hammerPrice: 25000,
      buyerPremiumAmount: 3750,
      totalPaidByBuyer: 28750,
      sellerCommissionAmount: 2500,
      vendorPayable: 22500,
      grandStoreGrossRevenue: 6250,
      settlementStatus: 'REFUNDED' // cancelled auction ledger
    });

    // 4. Create a Cancelled Bidder Deposit
    testDeposit = await BidderDeposit.create({
      bidder: testUser._id,
      amount: 5000,
      paymentReference: `DEP-TEST-${Date.now()}`,
      paymentStatus: 'cancelled'
    });
  });

  after(async () => {
    if (testUser) await User.deleteOne({ _id: testUser._id });
    if (testEventBooking) await Booking.deleteOne({ _id: testEventBooking._id });
    if (testAuctionOrder) await Order.deleteOne({ _id: testAuctionOrder._id });
    if (testAuctionLot) await AuctionLot.deleteOne({ _id: testAuctionLot._id });
    if (testLedger) await AuctionLedger.deleteOne({ _id: testLedger._id });
    if (testDeposit) await BidderDeposit.deleteOne({ _id: testDeposit._id });
    await mongoose.disconnect();
  });

  it('1. Cancelled ticket bookings do NOT appear in Admin Finance Overview eventBookings', async () => {
    let responseData = null;
    const req = { query: {} };
    const res = {
      json: (data) => { responseData = data; return res; },
      status: () => res
    };

    await financeController.getAdminFinanceOverview(req, res);
    assert(responseData && responseData.eventBookings, 'Response should have eventBookings');
    
    const foundBooking = responseData.eventBookings.find(b => String(b._id) === String(testEventBooking._id));
    assert.strictEqual(foundBooking, undefined, 'Cancelled ticket booking MUST NOT appear in Admin Finance eventBookings');
  });

  it('2. Cancelled auction orders do NOT appear in Admin Finance Overview auctionOrders', async () => {
    let responseData = null;
    const req = { query: {} };
    const res = {
      json: (data) => { responseData = data; return res; },
      status: () => res
    };

    await financeController.getAdminFinanceOverview(req, res);
    assert(responseData && responseData.auctionOrders, 'Response should have auctionOrders');

    const foundAuctionOrder = responseData.auctionOrders.find(o => String(o._id) === String(testAuctionOrder._id));
    assert.strictEqual(foundAuctionOrder, undefined, 'Cancelled auction order MUST NOT appear in Admin Finance auctionOrders');
  });

  it('3. Cancelled orders do NOT appear in getAdminOrders', async () => {
    let responseData = null;
    const req = { query: { tab: 'all' } };
    const res = {
      json: (data) => { responseData = data; return res; },
      status: () => res
    };

    await orderController.getAdminOrders(req, res);
    assert(Array.isArray(responseData), 'Expected array of orders');

    const foundOrder = responseData.find(o => String(o._id) === String(testAuctionOrder._id));
    assert.strictEqual(foundOrder, undefined, 'Cancelled auction order MUST NOT appear in getAdminOrders');
  });

  it('4. Cancelled/refunded auction ledgers do NOT appear in getAuctionLedger', async () => {
    let responseData = null;
    const req = { user: { role: 'admin', _id: testUser._id } };
    const res = {
      json: (data) => { responseData = data; return res; },
      status: () => res
    };

    await auctionController.getAuctionLedger(req, res);
    assert(Array.isArray(responseData), 'Expected array of ledger entries');

    const foundLedger = responseData.find(l => String(l._id) === String(testLedger._id));
    assert.strictEqual(foundLedger, undefined, 'Cancelled/REFUNDED ledger MUST NOT appear in getAuctionLedger');
  });

  it('5. Cancelled bidder deposits do NOT appear in getAdminDeposits', async () => {
    let responseData = null;
    const req = { user: { role: 'admin', _id: testUser._id } };
    const res = {
      json: (data) => { responseData = data; return res; },
      status: () => res
    };

    await auctionController.getAdminDeposits(req, res);
    assert(Array.isArray(responseData), 'Expected array of deposits');

    const foundDeposit = responseData.find(d => String(d._id) === String(testDeposit._id));
    assert.strictEqual(foundDeposit, undefined, 'Cancelled deposit MUST NOT appear in getAdminDeposits');
  });

  it('6. Gmail failed payment template has 100% inline styles and correct details', () => {
    const { paymentFailedEmailTemplate } = require('../utils/emailTemplates');
    const html = paymentFailedEmailTemplate({
      customerName: 'Sir Ritesh',
      reference: 'GS-AUC-9999',
      itemName: '1982 Chateau Lafite Rothschild Magnum',
      amount: 28750,
      retryUrl: 'https://grandstoreglobal.com/auction/checkout/101?payment=cancel',
      reason: 'Your payment attempt was cancelled on PayFast. No funds were debited.'
    });

    // Check critical content
    assert(html.includes('No Funds Have Been Debited'), 'Should include reassuring banner');
    assert(html.includes('1982 Chateau Lafite Rothschild Magnum'), 'Should include exact item name');
    assert(html.includes('GS-AUC-9999'), 'Should include reference');
    assert(html.includes('https://grandstoreglobal.com/auction/checkout/101?payment=cancel'), 'Should include retry URL');
    assert(html.includes('Sir Ritesh'), 'Should address customer by name');

    // Check Gmail inline styling compatibility
    assert(html.includes('style="background-color: #1a1212; border: 1px solid #991b1b;'), 'Reassurance box must have inline hex styling');
    assert(html.includes('style="background-color: #111111; border: 1px solid #2a2a2a;'), 'Details box must have inline hex styling');
    assert(html.includes('style="background-color: #c9a35b; color: #000000;'), 'Retry button must have inline hex styling');
  });
});
