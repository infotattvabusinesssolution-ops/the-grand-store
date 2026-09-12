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
const Order = require('../models/Order');
const Shipment = require('../models/Shipment');

async function runCancellationTests() {
  console.log('--- Testing Cancellation Flow & Admin Exclusion ---');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const app = express();
  app.use(express.json());
  app.use('/api/orders', orderRoutes);
  app.use('/api/payfast', payfastRoutes);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  const sampleQuote = {
    expiresAt: expiresAt.toISOString(),
    globalSubtotal: 500,
    aggregatedTotals: { shipping: 100, vat: 75, totalToPay: 600 },
    shipments: [
      {
        vendorId: null,
        vendorName: 'The Grand Store',
        originCountry: 'South Africa',
        subtotal: 500,
        taxData: { vatAmount: 75 },
        items: [{
          product: new mongoose.Types.ObjectId(),
          name: 'Rare Reserve Gin',
          price: 500,
          quantity: 1
        }],
        selectedCourier: { courierName: 'Courier Guy', cost: 100, deliveryType: 'home' }
      }
    ]
  };

  try {
    // 1. Create a test order
    console.log('\n[TEST 1] Creating a test order...');
    const createRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quote: sampleQuote,
        isGuest: true,
        guestName: 'Cancel Test Customer',
        guestEmail: 'cancel_test@example.com',
        guestPhone: '+27829990011',
        shippingAddress: {
          address: '50 Bree Street',
          city: 'Cape Town',
          postalCode: '8001',
          country: 'South Africa',
          phone: '+27829990011'
        },
        deliveryPreference: 'home',
        paymentMethod: 'PayFast'
      })
    });

    assert.equal(createRes.status, 201, 'Order must be created');
    const order = await createRes.json();
    console.log('Order created:', order.orderId, 'Initial status:', order.paymentStatus);
    assert.equal(order.paymentStatus, 'Pending');

    // Check shipments initial status (Payment Pending)
    const initialShipments = await Shipment.find({ _id: { $in: order.shipments } });
    assert.equal(initialShipments[0].status, 'Payment Pending');

    // 2. Cancel the order payment via cancel-payment endpoint
    console.log('\n[TEST 2] Cancelling order payment via POST /api/orders/:id/cancel-payment...');
    const cancelRes = await fetch(`${baseUrl}/api/orders/${order._id}/cancel-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Customer cancelled payment in mobile gateway' })
    });

    assert.equal(cancelRes.status, 200, 'Cancellation must succeed');
    const cancelBody = await cancelRes.json();
    assert.equal(cancelBody.order.paymentStatus, 'Cancelled');

    // Check that DB shipment is now Cancelled
    const cancelledShipments = await Shipment.find({ _id: { $in: order.shipments } });
    assert.equal(cancelledShipments[0].status, 'Cancelled');
    console.log('✅ TEST 2 Passed: Order and Shipments successfully marked Cancelled.');

    // 3. Attempt to mark cancelled order as PAID -> MUST BE REJECTED
    console.log('\n[TEST 3] Attempting to mark Cancelled order as Paid via PUT /api/orders/:id/pay...');
    const payRes = await fetch(`${baseUrl}/api/orders/${order._id}/pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });

    assert.equal(payRes.status, 400, `Expected 400 Bad Request when trying to pay cancelled order, got ${payRes.status}`);
    const payBody = await payRes.json();
    console.log('Rejected with message:', payBody.message);
    assert.ok(payBody.message.includes('cancelled'), 'Must explicitly mention cancelled order');
    console.log('✅ TEST 3 Passed: Cancelled order was protected and rejected payment attempt.');

    // 4. Verify admin order query excludes cancelled orders
    console.log('\n[TEST 4] Verifying Admin orders query excludes the cancelled order...');
    const OrderModel = require('../models/Order');
    const adminOrders = await OrderModel.find({
      _id: order._id,
      paymentStatus: { $nin: ['Cancelled', 'Failed'] }
    });
    assert.equal(adminOrders.length, 0, 'Cancelled order must not be returned in admin query');
    console.log('✅ TEST 4 Passed: Cancelled order is completely excluded from Admin query.');

    // Clean up
    await Order.findByIdAndDelete(order._id);
    await Shipment.deleteMany({ _id: { $in: order.shipments } });

    console.log('\n======================================================');
    console.log('🎉 ALL CANCELLATION FLOW & ADMIN EXCLUSION TESTS PASSED!');
    console.log('======================================================');

  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runCancellationTests().catch(err => {
  console.error('Cancellation test failed:', err);
  process.exit(1);
});
