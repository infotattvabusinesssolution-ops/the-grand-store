const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = require('../models/Product');
  const Order = require('../models/Order');
  const User = require('../models/User');

  const products = await Product.find({ name: { $regex: 'Ridge', $options: 'i' } }).lean();
  console.log('--- RIDGE PRODUCTS ---');
  console.log(JSON.stringify(products.map(p => ({
    id: p.id,
    _id: p._id,
    name: p.name,
    price: p.price,
    shipping: p.shipping
  })), null, 2));

  const users = await User.find({ email: 'hazardtoxic3@gmail.com' }).lean();
  console.log('--- USER hazardtoxic3@gmail.com ---');
  console.log(JSON.stringify(users.map(u => ({
    id: u._id,
    email: u.email,
    name: u.name,
    role: u.role
  })), null, 2));

  const userOrders = await Order.find({
    $or: [
      { user: '6a95257745b59d5176ba7592' },
      { customer: '6a95257745b59d5176ba7592' },
      { 'customer.id': '6a95257745b59d5176ba7592' },
      { 'customer._id': '6a95257745b59d5176ba7592' }
    ]
  }).sort({ createdAt: -1 }).lean();
  console.log(`--- ORDERS BY USER ID (${userOrders.length} found) ---`);
  console.log(JSON.stringify(userOrders.map(o => ({
    _id: o._id,
    orderId: o.orderId,
    invoiceNumber: o.invoiceNumber,
    depositReference: o.depositReference,
    customer: o.customer,
    user: o.user,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    status: o.status
  })), null, 2));

  const targetOrder = await Order.findOne({ orderId: 'GS-26-SHP-ORD-000340' }).lean();
  console.log('--- TARGET ORDER 000340 ---');
  console.log(JSON.stringify(targetOrder, null, 2));

  await mongoose.disconnect();
}
check().catch(console.error);
