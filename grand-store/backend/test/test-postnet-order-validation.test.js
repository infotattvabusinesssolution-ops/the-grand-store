const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

const express = require('express');
const mongoose = require('mongoose');
const assert = require('assert');

const orderRoutes = require('../routes/orderRoutes');
const Order = require('../models/Order');

async function runTests() {
  console.log('--- Testing PostNet Delivery vs Store Collection Order Validation ---');

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

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const sampleItem = {
    product: new mongoose.Types.ObjectId(),
    name: 'Sample Fine Wine',
    price: 350,
    quantity: 1,
    weightKg: 1.5
  };

  const createBaseQuote = (courier) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    return {
      expiresAt: expiresAt.toISOString(),
      globalSubtotal: 350,
      aggregatedTotals: {
        shipping: courier.cost,
        vat: 52.5,
        totalToPay: 350 + courier.cost
      },
      shipments: [
        {
          vendorId: null,
          vendorName: 'Grand Store Reserve',
          originCountry: 'South Africa',
          subtotal: 350,
          taxData: { vatAmount: 52.5 },
          items: [sampleItem],
          selectedCourier: courier
        }
      ]
    };
  };

  try {
    // TEST 1: Home Delivery using "PostNet Standard Delivery" (Home delivery - deliveryType: 'home')
    console.log('\n[TEST 1] Placing order with PostNet Standard Delivery (Home Delivery)...');
    const postnetHomeCourier = {
      courierName: 'PostNet',
      serviceLevel: 'PostNet Standard Delivery',
      deliveryType: 'home',
      cost: 120
    };

    const res1 = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quote: createBaseQuote(postnetHomeCourier),
        isGuest: true,
        guestName: 'Home Delivery Customer',
        guestEmail: 'postnet_home_test@example.com',
        guestPhone: '+27821112233',
        shippingAddress: {
          address: '100 Long Street',
          city: 'Cape Town',
          postalCode: '8001',
          country: 'South Africa',
          phone: '+27821112233'
        },
        deliveryPreference: 'home',
        paymentMethod: 'PayFast'
      })
    });

    const body1 = await res1.json();
    assert.equal(res1.status, 201, `Expected 201 Created for PostNet Standard Delivery, got ${res1.status}: ${JSON.stringify(body1)}`);
    assert.equal(body1.deliveryPreference, 'home', 'deliveryPreference must be home');
    assert.equal(body1.selectedPostnetStore, null, 'selectedPostnetStore must be null for home delivery');
    console.log('✅ TEST 1 Passed: PostNet Standard Home Delivery order created successfully without branch validation error!');

    // Clean up created order
    await Order.findByIdAndDelete(body1._id);

    // TEST 2: Store Collection without selecting a branch -> MUST FAIL WITH 400
    console.log('\n[TEST 2] Placing order with PostNet Store Collection WITHOUT branch selection...');
    const postnetCollectionCourier = {
      courierName: 'PostNet',
      serviceLevel: 'PostNet Store Collection',
      deliveryType: 'pickup',
      cost: 100
    };

    const res2 = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quote: createBaseQuote(postnetCollectionCourier),
        isGuest: true,
        guestName: 'Pickup Customer',
        guestEmail: 'pickup_fail_test@example.com',
        guestPhone: '+27821112233',
        shippingAddress: {
          address: 'PostNet Pickup Branch',
          city: 'Cape Town',
          postalCode: '8001',
          country: 'South Africa',
          phone: '+27821112233'
        },
        deliveryPreference: 'postnet',
        paymentMethod: 'PayFast'
      })
    });

    const body2 = await res2.json();
    assert.equal(res2.status, 400, `Expected 400 Bad Request when no branch selected, got ${res2.status}`);
    assert.ok(body2.message.includes('A PostNet branch must be selected'), 'Must mention branch selection');
    console.log('✅ TEST 2 Passed: Rejected store collection when no branch was selected as expected.');

    // TEST 3: Store Collection WITH selecting a branch -> MUST SUCCEED WITH 201
    console.log('\n[TEST 3] Placing order with PostNet Store Collection WITH branch selected...');
    const branchInfo = {
      id: 'postnet_ct_cbd',
      name: 'PostNet Cape Town CBD',
      address: 'Shop 2, Standard Bank Centre, 5 Adderley St',
      city: 'Cape Town',
      postalCode: '8001',
      telephone: '021 418 2000'
    };

    const res3 = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quote: {
          ...createBaseQuote(postnetCollectionCourier),
          selectedPostnetStore: branchInfo
        },
        selectedPostnetStore: branchInfo,
        preferredPostnetStore: branchInfo,
        isGuest: true,
        guestName: 'Pickup Customer Successful',
        guestEmail: 'pickup_success_test@example.com',
        guestPhone: '+27821112233',
        shippingAddress: {
          address: branchInfo.address,
          city: branchInfo.city,
          postalCode: branchInfo.postalCode,
          country: 'South Africa',
          phone: '+27821112233'
        },
        deliveryPreference: 'postnet',
        paymentMethod: 'PayFast'
      })
    });

    const body3 = await res3.json();
    assert.equal(res3.status, 201, `Expected 201 Created for valid PostNet collection, got ${res3.status}: ${JSON.stringify(body3)}`);
    assert.equal(body3.deliveryPreference, 'postnet', 'deliveryPreference must be postnet');
    assert.equal(body3.selectedPostnetStore?.name, branchInfo.name, 'Branch name must match');
    console.log('✅ TEST 3 Passed: PostNet Store Collection order created successfully with branch details saved!');

    // Clean up created order
    await Order.findByIdAndDelete(body3._id);

    console.log('\n========================================');
    console.log('🎉 ALL 3 POSTNET VALIDATION TESTS PASSED!');
    console.log('========================================');

  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
