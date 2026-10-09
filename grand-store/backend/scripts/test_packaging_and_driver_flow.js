const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testWorkflow() {
  await mongoose.connect(process.env.MONGO_URI);
  const Order = require('../models/Order');
  const { updateOrderPackaging, assignOrderDriver, confirmOrderDriverHandover } = require('../controllers/orderController');

  const order = await Order.findOne({ orderId: 'GS-26-SHP-ORD-000340' });
  if (!order) throw new Error('Order GS-26-SHP-ORD-000340 not found');

  console.log('--- TEST 1: ATTEMPT DRIVER ASSIGNMENT BEFORE PACKAGING ---');
  // Reset packaging for clean testing
  order.packaging = { isPacked: false };
  order.driver = { status: 'unassigned' };
  await order.save();

  let gatePassed = false;
  const mockReq1 = {
    params: { id: order._id.toString() },
    body: { courierCompany: 'Aramex South Africa', serviceType: 'ONP' }
  };
  const mockRes1 = {
    status: (code) => {
      console.log('Gating Status Code:', code);
      return {
        json: (data) => {
          console.log('Gating Response Message:', data.message);
          if (code === 400 && data.message.includes('Packaging inspection')) {
            gatePassed = true;
          }
        }
      };
    },
    json: (d) => console.log('Json unexpected:', d)
  };
  await assignOrderDriver(mockReq1, mockRes1);
  console.log('Gating Test Passed:', gatePassed);

  console.log('\n--- TEST 2: VERIFY AND SEAL PACKAGING ---');
  const mockReq2 = {
    params: { id: order._id.toString() },
    body: {
      boxType: 'Certified Wine Shipper (1 Bottle)',
      weightKg: 1.55,
      dimensions: { lengthCm: 10, widthCm: 10, heightCm: 33 },
      isFragile: true,
      isSealed: true,
      packedBy: 'Grand Store Vault Ops (Test)'
    }
  };
  let packData = null;
  const mockRes2 = {
    status: (c) => mockRes2,
    json: (d) => { packData = d; }
  };
  await updateOrderPackaging(mockReq2, mockRes2);
  console.log('Packaging Response:', {
    success: packData?.success,
    message: packData?.message,
    barcode: packData?.packaging?.packageBarcode,
    dimensions: packData?.packaging?.dimensions,
    isPacked: packData?.packaging?.isPacked
  });

  console.log('\n--- TEST 3: ASSIGN DRIVER (NOW UNLOCKED) ---');
  const mockReq3 = {
    params: { id: order._id.toString() },
    body: {
      courierCompany: 'Aramex South Africa',
      serviceType: 'ONP',
      driverName: 'Aramex Logistics Dispatch Courier',
      driverPhone: '+27 11 883 4000',
      vehicleReg: 'Aramex Fleet (Gauteng Hub)',
      pickupWindow: '13:30 - 17:00'
    }
  };
  let driverData = null;
  const mockRes3 = {
    status: (c) => mockRes3,
    json: (d) => { driverData = d; }
  };
  await assignOrderDriver(mockReq3, mockRes3);
  console.log('Driver Assignment Response:', {
    success: driverData?.success,
    message: driverData?.message,
    driverName: driverData?.driver?.driverName,
    waybillNumber: driverData?.driver?.waybillNumber,
    collectionRef: driverData?.driver?.collectionRef,
    status: driverData?.driver?.status
  });

  console.log('\n--- TEST 4: CONFIRM DRIVER HANDOVER (VIA QR SCAN SIMULATION) ---');
  const mockReq4 = {
    params: { id: order._id.toString() }
  };
  let handoverData = null;
  const mockRes4 = {
    status: (c) => mockRes4,
    json: (d) => { handoverData = d; }
  };
  await confirmOrderDriverHandover(mockReq4, mockRes4);
  console.log('Handover Confirmation Response:', {
    success: handoverData?.success,
    message: handoverData?.message,
    orderStatus: handoverData?.status,
    driverStatus: handoverData?.driver?.status
  });

  await mongoose.disconnect();
}

testWorkflow().catch(console.error);
