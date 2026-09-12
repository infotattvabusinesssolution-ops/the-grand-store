const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const User = require('../models/User');
const { cancelOrderPayment, getAdminOrders } = require('../controllers/orderController');

test('Cancelled Payment Global Flow Test Suite', async (t) => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/grand-store';
  await mongoose.connect(mongoUri);

  const testEmail = `cancel_test_${Date.now()}@grandstore.co.za`;
  const user = await User.create({
    name: 'Cancel Test Patron',
    email: testEmail,
    password: 'Password123!',
    role: 'customer',
    superCoinsBalance: 50,
  });

  t.after(async () => {
    await Order.deleteMany({ user: user._id });
    await Shipment.deleteMany({ customerId: user._id });
    await User.findByIdAndDelete(user._id);
    await mongoose.disconnect();
  });

  await t.test('1. Creates order with shipment and cancels payment', async () => {
    // Create dummy shipment
    const shipment = await Shipment.create({
      shipmentId: `GS-TEST-SHP-${Date.now()}`,
      orderId: new mongoose.Types.ObjectId(),
      orderRef: `GS-ORD-REF-${Date.now()}`,
      customerId: user._id,
      customerShippingCharge: 150,
      status: 'Payment Pending',
    });

    // Create order with SuperCoins used
    const order = await Order.create({
      user: user._id,
      orderId: `GS-ORD-CANCEL-${Date.now()}`,
      invoiceNumber: `INV-CANCEL-${Date.now()}`,
      transactionId: `TXN-CANCEL-${Date.now()}`,
      paymentId: `PID-CANCEL-${Date.now()}`,
      shippingAddress: {
        fullName: 'Cancel Patron',
        address: '10 Sandton Drive',
        city: 'Johannesburg',
        postalCode: '2196',
        country: 'South Africa',
      },
      orderItems: [
        {
          name: 'Rare Single Cask Whiskey',
          product: new mongoose.Types.ObjectId(),
          price: 2500,
          quantity: 1,
        }
      ],
      totalPrice: 2450,
      subTotal: 2500,
      superCoinsUsed: 50,
      superCoinsDiscount: 50,
      shippingCost: 0,
      paymentMethod: 'PayFast',
      paymentStatus: 'Pending',
      isPaid: false,
      shipments: [shipment._id],
    });

    shipment.orderId = order._id;
    await shipment.save();

    // Deduct user superCoins as done at checkout
    user.superCoinsBalance = 0;
    await user.save();

    // Trigger payment cancellation
    const cancelledOrder = await cancelOrderPayment(order._id, 'Customer aborted PayFast gateway');

    assert.equal(cancelledOrder.paymentStatus, 'Cancelled', 'Order paymentStatus should be Cancelled');
    assert.equal(cancelledOrder.isPaid, false, 'Order isPaid should remain false');

    // Verify shipment was cancelled
    const updatedShipment = await Shipment.findById(shipment._id);
    assert.equal(updatedShipment.status, 'Cancelled', 'Shipment status should be updated to Cancelled');

    // Verify user SuperCoins refunded
    const updatedUser = await User.findById(user._id);
    assert.equal(updatedUser.superCoinsBalance, 50, 'User SuperCoins should be refunded on order cancellation');
  });

  await t.test('2. getAdminOrders strictly excludes cancelled orders', async () => {
    const cancelledOrder = await Order.findOne({ user: user._id, paymentStatus: 'Cancelled' });
    assert.ok(cancelledOrder, 'Cancelled order exists');

    // Simulate getAdminOrders for tab 'all'
    const reqAll = { query: { tab: 'all' } };
    let jsonResultAll = null;
    const resAll = {
      json: (data) => { jsonResultAll = data; },
      status: () => resAll
    };
    await getAdminOrders(reqAll, resAll);

    const foundInAll = (jsonResultAll || []).some(o => String(o._id) === String(cancelledOrder._id));
    assert.equal(foundInAll, false, 'Cancelled order must NOT appear in Admin Orders (tab: all)');

    // Simulate getAdminOrders for tab 'pending'
    const reqPending = { query: { tab: 'pending' } };
    let jsonResultPending = null;
    const resPending = {
      json: (data) => { jsonResultPending = data; },
      status: () => resPending
    };
    await getAdminOrders(reqPending, resPending);

    const foundInPending = (jsonResultPending || []).some(o => String(o._id) === String(cancelledOrder._id));
    assert.equal(foundInPending, false, 'Cancelled order must NOT appear in Admin Orders (tab: pending)');
  });
});
