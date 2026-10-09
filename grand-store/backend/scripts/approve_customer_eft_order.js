const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function approveCustomerOrder() {
  await mongoose.connect(process.env.MONGO_URI);
  const Order = require('../models/Order');
  const User = require('../models/User');
  const { processOrderPayment } = require('../controllers/orderController');

  const customerEmail = 'hazardtoxic3@gmail.com';
  const customer = await User.findOne({ email: customerEmail });
  if (!customer) throw new Error(`User not found for ${customerEmail}`);

  console.log(`Found Customer: ${customer.name} (${customer._id})`);

  // Locate the latest bank transfer order for this user
  const order = await Order.findOne({
    $or: [
      { user: customer._id },
      { customer: customer._id },
      { 'customer.email': customerEmail },
      { 'shippingAddress.email': customerEmail }
    ],
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Pending'
  }).sort({ createdAt: -1 });

  if (!order) {
    console.log('No pending Bank Transfer order found. Checking if already paid or finding by orderId:');
    const recentOrder = await Order.findOne({ orderId: 'GS-26-SHP-ORD-000340' });
    console.log('Order GS-26-SHP-ORD-000340 current status:', {
      orderId: recentOrder?.orderId,
      isPaid: recentOrder?.isPaid,
      paymentStatus: recentOrder?.paymentStatus,
      status: recentOrder?.status,
      paidAt: recentOrder?.paidAt
    });
    await mongoose.disconnect();
    return;
  }

  console.log(`Processing EFT Payment Approval for Order: ${order.orderId} (ID: ${order._id})...`);

  // Dynamically approve payment
  await processOrderPayment(order._id);

  // Re-fetch updated order
  const updatedOrder = await Order.findById(order._id);
  console.log('--- PAYMENT CLEARED & ORDER UPDATED SUCCESSFULLY ---');
  console.log({
    orderId: updatedOrder.orderId,
    invoiceNumber: updatedOrder.invoiceNumber,
    customer: customerEmail,
    isPaid: updatedOrder.isPaid,
    paymentStatus: updatedOrder.paymentStatus,
    status: updatedOrder.status,
    paidAt: updatedOrder.paidAt,
    totalPrice: updatedOrder.totalPrice
  });

  await mongoose.disconnect();
}

approveCustomerOrder().catch(console.error);
