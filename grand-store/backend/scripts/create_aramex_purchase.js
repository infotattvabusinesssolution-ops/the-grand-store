const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Order = require('../models/Order');
const Shipment = require('../models/Shipment');
const User = require('../models/User');
const Product = require('../models/Product');
const { generateOrderReceiptBuffer } = require('../utils/pdfService');
const { orderConfirmationTemplate } = require('../utils/emailTemplates');
const { sendEmail } = require('../utils/emailService');

async function createAramexPurchase() {
  console.log('--- CONNECTING TO MONGODB ---');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB successfully.');

  const targetEmail = 'hazardtoxic3@gmail.com';
  const user = await User.findOne({ email: targetEmail });
  if (!user) {
    throw new Error(`User with email ${targetEmail} not found`);
  }
  console.log(`Found user: ${user.name} (${user.email}), ID: ${user._id}`);

  const product = await Product.findOne({ name: /Metanoia Klein Karoo Single Malt Whisky/i });
  if (!product) {
    throw new Error('Metanoia Klein Karoo Single Malt Whisky product not found');
  }
  console.log(`Found product: ${product.name}, Price: R ${product.price}, Stock: ${product.stock}`);

  // Find latest sequence
  const lastOrder = await Order.findOne({ orderId: /^GS-26-SHP-ORD-/ }).sort({ createdAt: -1 });
  let nextSeq = 341;
  if (lastOrder && lastOrder.orderId) {
    const m = lastOrder.orderId.match(/(\d+)$/);
    if (m) {
      nextSeq = Math.max(nextSeq, parseInt(m[1], 10) + 1);
    }
  }

  const seqStr = String(nextSeq).padStart(6, '0');
  const orderId = `GS-26-SHP-ORD-${seqStr}`;
  const invoiceNumber = `GS-26-SHP-INV-${seqStr}`;
  const transactionId = `GS-26-SHP-PAY-${seqStr}`;
  const depositReference = `GS-${seqStr}`;
  const paymentId = `PAY-${seqStr}-${Date.now()}`;

  // Aramex waybill number (11-digit format starting with 31)
  const waybillNumber = `3198${Math.floor(1000000 + Math.random() * 9000000)}`;
  const collectionRef = `COL-${Math.floor(100000 + Math.random() * 900000)}`;
  const packageBarcode = `GS-PKG-${seqStr}-${Math.floor(1000 + Math.random() * 9000)}`;

  const itemPrice = Number(product.price || 1608.85);
  const qty = 1;
  const subTotal = itemPrice * qty;
  const vatAmount = parseFloat((subTotal * (15 / 115)).toFixed(2));
  const shippingCost = 0.00; // Free promotional luxury courier
  const totalPrice = subTotal;

  console.log('--- CREATING ORDER ---');
  const orderData = {
    user: user._id,
    isGuest: false,
    orderId,
    invoiceNumber,
    transactionId,
    paymentId,
    depositReference,
    orderItems: [
      {
        product: product.id || String(product._id),
        vendorId: product.vendorId || null,
        name: product.name,
        category: product.category || 'Whisky',
        subcategory: product.subcategory || 'Single Malt',
        quantity: qty,
        price: itemPrice,
        option: 'Pack of 1',
        image: product.image
      }
    ],
    shippingAddress: {
      address: '14 Oxford Road, Rosebank',
      city: 'Johannesburg',
      postalCode: '2196',
      country: 'South Africa',
      phone: '+27765809522',
      phoneNumber: '+27765809522',
      phoneCountry: 'ZA',
      phoneCountryCode: '+27'
    },
    paymentMethod: 'Instant Card / PayFast (Verified)',
    subTotal,
    vatAmount,
    vatPct: 15,
    shippingCost,
    totalPrice,
    paymentStatus: 'Paid',
    status: 'Awaiting Dispatch',
    isPaid: true,
    paidAt: new Date(),
    deliveryPreference: 'home',
    aramexWaybillNumber: waybillNumber,
    packaging: {
      isPacked: true,
      boxType: 'Certified Wine & Spirits Shipper (1 Bottle)',
      weightKg: 1.85,
      dimensions: {
        lengthCm: 12,
        widthCm: 12,
        heightCm: 34
      },
      isFragile: true,
      isSealed: true,
      packageBarcode: packageBarcode,
      packedAt: new Date(),
      packedBy: 'Grand Store Vault Ops (Aramex Express)'
    },
    driver: {
      courierCompany: 'Aramex South Africa',
      serviceType: 'ONP Priority Air Express',
      driverName: 'Aramex Air Express Courier',
      driverPhone: '+27 11 883 4000',
      vehicleReg: 'Aramex Fleet (JNB Air Hub)',
      waybillNumber: waybillNumber,
      collectionRef: collectionRef,
      pickupWindow: '13:30 - 17:00',
      assignedAt: new Date(),
      status: 'assigned',
      handoverConfirmedAt: null
    }
  };

  const newOrder = await Order.create(orderData);
  console.log(`Order created successfully: ${newOrder.orderId} (ID: ${newOrder._id})`);

  // Create Linked Shipment record
  console.log('--- CREATING SHIPMENT RECORD ---');
  const shipment = await Shipment.create({
    shipmentId: `GS-26-SHP-DEL-${seqStr}`,
    orderId: newOrder._id,
    orderRef: newOrder.orderId,
    customerId: user._id,
    vendorId: null,
    deliveryMethod: 'aramex_delivery',
    courierName: 'Aramex South Africa',
    aramexWaybillNumber: waybillNumber,
    aramexServiceType: 'ONP',
    aramexCollectionRef: collectionRef,
    mainTrackingNumber: waybillNumber,
    mainTrackingUrl: `https://api.grandstoreglobal.com/api/aramex/waybill-pdf/${waybillNumber}`,
    customerShippingCharge: shippingCost,
    status: 'Preparing',
    packageDetails: {
      weight: 1.85,
      length: 12,
      width: 12,
      height: 34
    },
    deliveryAddress: {
      address: newOrder.shippingAddress.address,
      city: newOrder.shippingAddress.city,
      postalCode: newOrder.shippingAddress.postalCode,
      country: newOrder.shippingAddress.country
    },
    legs: [
      {
        courierName: 'Aramex South Africa',
        serviceLevel: 'Aramex Overnight Express (ONP)',
        trackingNumber: waybillNumber,
        trackingUrl: `https://api.grandstoreglobal.com/api/aramex/waybill-pdf/${waybillNumber}`,
        cost: 125,
        origin: 'Grand Store Vault (Gauteng Hub)',
        destination: newOrder.shippingAddress.city,
        status: 'Pending'
      }
    ]
  });

  newOrder.shipments = [shipment._id];
  await newOrder.save();
  console.log(`Shipment created and linked: ${shipment.shipmentId} (Aramex Waybill: ${waybillNumber})`);

  // Generate Official Tax Invoice & Consignment Waybill PDF
  console.log('--- GENERATING TAX INVOICE & DISPATCH SLIP PDF ---');
  const pdfBuffer = await generateOrderReceiptBuffer(newOrder, user);
  console.log(`Generated PDF Tax Invoice (Size: ${pdfBuffer.length} bytes) with QR code`);

  // Send Email with Updated Responsive Layout
  console.log(`--- SENDING CONFIRMATION EMAIL TO ${targetEmail} ---`);
  const emailHtml = orderConfirmationTemplate(newOrder);

  const emailResult = await sendEmail({
    to: targetEmail,
    subject: `Payment Receipt & Aramex Consignment #${newOrder.invoiceNumber} - The Grand Store`,
    html: emailHtml,
    attachments: [
      {
        filename: `Receipt-${newOrder.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });

  console.log('Email sent successfully! MessageId:', emailResult.messageId);

  console.log('\n======================================================');
  console.log('ORDER GENERATION COMPLETE:');
  console.log(`Order ID:          ${newOrder.orderId}`);
  console.log(`Invoice Number:    ${newOrder.invoiceNumber}`);
  console.log(`User:              ${user.name} (${user.email})`);
  console.log(`Product:           ${product.name}`);
  console.log(`Total:             R ${newOrder.totalPrice.toFixed(2)}`);
  console.log(`Courier:           Aramex South Africa (ONP)`);
  console.log(`Aramex Waybill:    ${waybillNumber}`);
  console.log(`Collection Ref:    ${collectionRef}`);
  console.log(`Package Barcode:   ${packageBarcode}`);
  console.log(`Sealed & Verified: YES`);
  console.log(`QR Code in PDF:    YES (Driver Handover & Security QR)`);
  console.log(`Admin Order URL:   https://grandstoreglobal.com/admin/orders/${newOrder._id}`);
  console.log(`Tax Invoice PDF:   https://api.grandstoreglobal.com/api/orders/${newOrder._id}/receipt-pdf`);
  console.log(`Thermal Waybill:   https://api.grandstoreglobal.com/api/aramex/waybill-pdf/${waybillNumber}`);
  console.log('======================================================\n');

  await mongoose.disconnect();
}

createAramexPurchase().catch((err) => {
  console.error('FAILED TO CREATE PURCHASE:', err);
  process.exit(1);
});
