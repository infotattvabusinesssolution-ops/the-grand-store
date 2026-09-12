const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const AuctionLot = require('../models/AuctionLot');
const Booking = require('../models/Booking');
const BidderDeposit = require('../models/BidderDeposit');
const { processOrderPayment, cancelOrderPayment } = require('./orderController');
const { processAuctionPayment, processBidderDepositPayment } = require('./auctionController');
const { processEventPayment } = require('./eventControllerV2');
const { processVendorPayment } = require('./vendorController');

const trimTrailingSlashes = (url) => url.replace(/\/+$/, '');

// PayFast's custom integration uses PHP urlencode (RFC 1738), which differs
// from encodeURIComponent for characters such as apostrophes and tildes.
const payfastUrlEncode = (value) => encodeURIComponent(String(value))
  .replace(/[!'()*~]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
  .replace(/%20/g, '+');

const getFrontendUrl = (req) => trimTrailingSlashes(
  process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173'
);

const getBackendUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return trimTrailingSlashes(process.env.BACKEND_URL);
  }

  // In production the API host that received this authenticated request is
  // also the public host PayFast must call. This avoids silently emitting a
  // localhost notify_url when BACKEND_URL has not been configured.
  const forwardedProtocol = req.get('x-forwarded-proto')?.split(',')[0].trim();
  return `${forwardedProtocol || req.protocol}://${req.get('host')}`;
};

// Helper to generate PayFast signature
const generateSignature = (data, passphrase = null) => {
  // 1. Create parameter string
  let pfOutput = '';
  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key] !== undefined && data[key] !== null && data[key] !== '') {
      pfOutput += `${key}=${payfastUrlEncode(data[key].toString().trim())}&`;
    }
  }

  // 2. Remove last ampersand
  let getString = pfOutput.slice(0, -1);
  if (passphrase) {
    getString += `&passphrase=${payfastUrlEncode(passphrase.trim())}`;
  }

  // 3. Hash using MD5
  return crypto.createHash('md5').update(getString).digest('hex');
};

const getPayfastConfig = () => {
  const isLive = process.env.PAYFAST_IS_LIVE === 'true';
  return {
    merchant_id: isLive ? process.env.PAYFAST_LIVE_MERCHANT_ID : process.env.PAYFAST_TEST_MERCHANT_ID,
    merchant_key: isLive ? process.env.PAYFAST_LIVE_MERCHANT_KEY : process.env.PAYFAST_TEST_MERCHANT_KEY,
    passphrase: isLive ? process.env.PAYFAST_LIVE_PASSPHRASE : process.env.PAYFAST_TEST_PASSPHRASE,
    url: isLive ? 'https://www.payfast.co.za/eng/process' : 'https://sandbox.payfast.co.za/eng/process'
  };
};

// @desc    Generate PayFast payload for a Shop Order
// @route   POST /api/payfast/generate-shop
// @access  Private
exports.generateShopPayment = async (req, res) => {
  try {
    const { orderId, isMobile } = req.body;
    let order = null;
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).populate('user', 'name email');
    }
    if (!order && orderId) {
      order = await Order.findOne({ $or: [{ orderId: orderId }, { invoiceNumber: orderId }] }).populate('user', 'name email');
    }
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.isPaid) return res.status(400).json({ message: 'Order already paid' });

    if (order.paymentStatus === 'Cancelled' || order.paymentStatus === 'Failed') {
      order.paymentStatus = 'Pending';
      await order.save();
    }

    const config = getPayfastConfig();
    const frontendUrl = getFrontendUrl(req);
    const backendUrl = getBackendUrl(req);

    const customerName = order.user?.name || order.guestInfo?.name || order.shippingAddress?.name || order.shippingAddress?.fullName || 'Guest Customer';
    const customerEmail = order.user?.email || order.guestInfo?.email || order.shippingAddress?.email || 'customer@grandstoreglobal.com';
    const nameParts = customerName.trim().split(/\s+/);

    let returnUrl = order.isGuest 
      ? `${frontendUrl}/order-success/${order._id}?payment=success&guest=true`
      : `${frontendUrl}/customer/order/${order._id}?payment=success`;
    let cancelUrl = order.isGuest
      ? `${frontendUrl}/order-success/${order._id}?payment=cancel&guest=true`
      : `${frontendUrl}/customer/order/${order._id}?payment=cancel`;

    if (isMobile) {
      returnUrl = `${backendUrl}/api/payfast/mobile-return?type=shop&orderId=${order._id}&status=success`;
      cancelUrl = `${backendUrl}/api/payfast/mobile-return?type=shop&orderId=${order._id}&status=cancel`;
    }
    
    const data = {
      merchant_id: config.merchant_id,
      merchant_key: config.merchant_key,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: `${backendUrl}/api/payfast/itn`,
      name_first: nameParts[0] || 'Customer',
      name_last: nameParts.slice(1).join(' ') || 'Guest',
      email_address: customerEmail,
      m_payment_id: `SHP-${order._id}`,
      amount: order.totalPrice.toFixed(2),
      item_name: `Order ${order.orderId}`
    };

    const signature = generateSignature(data, config.passphrase);
    data.signature = signature;
    
    res.json({ url: config.url, data });
  } catch (error) {
    console.error('Error generating PayFast shop payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate PayFast payload for an Auction Win
// @route   POST /api/payfast/generate-auction
// @access  Private
exports.generateAuctionPayment = async (req, res) => {
  try {
    const { auctionId, isMobile, shippingCost } = req.body;
    const lot = await AuctionLot.findById(auctionId).populate('winner', 'name email');
    
    if (!lot) return res.status(404).json({ message: 'Lot not found' });
    if (lot.paymentStatus === 'Paid') return res.status(400).json({ message: 'Lot already paid' });
    
    const winnerId = lot.winner ? (lot.winner._id ? lot.winner._id.toString() : lot.winner.toString()) : null;
    if (!winnerId || winnerId !== req.user._id.toString()) {
       return res.status(403).json({ message: 'Only the winner can pay for this lot' });
    }

    const config = getPayfastConfig();
    const frontendUrl = getFrontendUrl(req);
    const backendUrl = getBackendUrl(req);
    
    const fullName = (lot.winner && lot.winner.name) || req.user.name || 'Grand Customer';
    const email = (lot.winner && lot.winner.email) || req.user.email || '';
    const nameParts = fullName.trim().split(/\s+/);
    
    const hammer = Number(lot.winningBid || lot.currentBid || 0);
    const buyerPremium = lot.buyerPremiumAmount || Math.round(hammer * 0.05);
    const barCharge = lot.barChargeAmount || Math.round(hammer * 0.02);
    const vat = lot.vatAmount || Math.round(hammer * 0.15);
    const shipping = Number(shippingCost || 0);
    const computedTotal = hammer + buyerPremium + barCharge + vat + shipping;
    const totalAmount = Number(lot.totalPaidByBuyer || computedTotal || hammer).toFixed(2);

    let returnUrl = `${frontendUrl}/auction/${lot._id}?payment=success`;
    let cancelUrl = `${frontendUrl}/auction/${lot._id}?payment=cancel`;
    if (isMobile) {
      returnUrl = `${backendUrl}/api/payfast/mobile-return?type=auction&auctionId=${lot._id}&status=success`;
      cancelUrl = `${backendUrl}/api/payfast/mobile-return?type=auction&auctionId=${lot._id}&status=cancel`;
    }

    const data = {
      merchant_id: config.merchant_id,
      merchant_key: config.merchant_key,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: `${backendUrl}/api/payfast/itn`,
      name_first: nameParts[0] || 'Customer',
      name_last: nameParts.slice(1).join(' ') || 'Winner',
      email_address: email,
      m_payment_id: `AUC-${lot._id}`,
      amount: totalAmount,
      item_name: `Auction Lot ${lot.lotNumber || lot._id.toString().slice(-6)}`
    };

    const signature = generateSignature(data, config.passphrase);
    data.signature = signature;
    
    res.json({ url: config.url, data });
  } catch (error) {
    console.error('Error generating PayFast auction payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate PayFast payload for an Event Booking
// @route   POST /api/payfast/generate-event
// @access  Private
exports.generateEventPayment = async (req, res) => {
  try {
    const { bookingId, isMobile } = req.body;
    const booking = await Booking.findById(bookingId).populate('user', 'name email').populate('event', 'title');
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (['Paid', 'Completed'].includes(booking.paymentStatus)) return res.status(400).json({ message: 'Booking already paid' });
    if (booking.paymentMethod === 'Bank Transfer') {
      return res.status(400).json({ message: 'This booking uses bank transfer. Upload proof from the ticket payment page.' });
    }
    if (booking.user._id.toString() !== req.user._id.toString()) {
       return res.status(403).json({ message: 'Only the ticket holder can pay for this booking' });
    }
    if (booking.paymentStatus !== 'Pending' || (booking.reservationExpiresAt && booking.reservationExpiresAt <= new Date())) {
      return res.status(410).json({ message: 'This ticket reservation has expired. Please book again.' });
    }

    const config = getPayfastConfig();
    const frontendUrl = getFrontendUrl(req);
    const backendUrl = getBackendUrl(req);
    
    let returnUrl = `${frontendUrl}/customer/event-order/${booking._id}?payment=success`;
    let cancelUrl = `${frontendUrl}/customer/event-order/${booking._id}?payment=cancel`;
    if (isMobile) {
      returnUrl = `${backendUrl}/api/payfast/mobile-return?type=event&bookingId=${booking._id}&status=success`;
      cancelUrl = `${backendUrl}/api/payfast/mobile-return?type=event&bookingId=${booking._id}&status=cancel`;
    }

    const data = {
      merchant_id: config.merchant_id,
      merchant_key: config.merchant_key,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: `${backendUrl}/api/payfast/itn`,
      name_first: booking.user.name.split(' ')[0],
      name_last: booking.user.name.split(' ').slice(1).join(' ') || 'Customer',
      email_address: booking.user.email,
      m_payment_id: `EVT-${booking._id}`,
      amount: booking.totalPrice.toFixed(2),
      item_name: `Event Ticket - ${booking.event.title}`
    };

    const signature = generateSignature(data, config.passphrase);
    data.signature = signature;
    
    res.json({ url: config.url, data });
  } catch (error) {
    console.error('Error generating PayFast event payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate PayFast payload for Vendor Registration
// @route   POST /api/payfast/generate-vendor
// @access  Private
exports.generateVendorPayment = async (req, res) => {
  try {
    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findOne({ userId: req.user._id }).populate('userId');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor application not found' });
    }

    const config = getPayfastConfig();
    const frontendUrl = getFrontendUrl(req);
    const backendUrl = getBackendUrl(req);

    const data = {
      merchant_id: config.merchant_id,
      merchant_key: config.merchant_key,
      return_url: `${frontendUrl}/vendor/payment?success=true`,
      cancel_url: `${frontendUrl}/vendor/payment?success=false`,
      notify_url: `${backendUrl}/api/payfast/itn`,
      name_first: vendor.userId.name.split(' ')[0],
      name_last: vendor.userId.name.split(' ').slice(1).join(' ') || 'Vendor',
      email_address: vendor.userId.email,
      m_payment_id: `VND-${vendor._id}`,
      amount: (vendor.registrationFee || 0).toFixed(2),
      item_name: 'Vendor Registration Fee'
    };

    const signature = generateSignature(data, config.passphrase);
    data.signature = signature;
    
    res.json({ url: config.url, data });
  } catch (error) {
    console.error('Error generating PayFast vendor payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate PayFast payload for Vendor Monthly Maintenance Fee
// @route   POST /api/payfast/generate-maintenance
// @access  Private
exports.generateMaintenancePayment = async (req, res) => {
  try {
    const Vendor = require('../models/Vendor');
    const PlatformSettings = require('../models/PlatformSettings');
    const vendor = await Vendor.findOne({ userId: req.user._id }).populate('userId');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor application not found' });
    }

    let monthlyFee = 500;
    try {
      const settings = await PlatformSettings.findOne();
      if (settings && settings.vendorMonthlyMaintenanceFee !== undefined) {
        monthlyFee = settings.vendorMonthlyMaintenanceFee;
      }
    } catch (e) {
      console.error('Error reading platform settings for maintenance fee', e);
    }

    const feeAmount = vendor.maintenanceFee?.amount || monthlyFee;
    const config = getPayfastConfig();
    const frontendUrl = getFrontendUrl(req);
    const backendUrl = getBackendUrl(req);

    const data = {
      merchant_id: config.merchant_id,
      merchant_key: config.merchant_key,
      return_url: `${frontendUrl}/vendor/dashboard?payment=success&fee=paid`,
      cancel_url: `${frontendUrl}/vendor/dashboard?payment=cancelled`,
      notify_url: `${backendUrl}/api/payfast/itn`,
      name_first: vendor.userId?.name?.split(' ')[0] || 'Vendor',
      name_last: vendor.userId?.name?.split(' ').slice(1).join(' ') || 'Partner',
      email_address: vendor.userId?.email || req.user.email,
      m_payment_id: `MNF-${vendor._id}-${Date.now()}`,
      amount: Number(feeAmount).toFixed(2),
      item_name: 'Vendor Monthly Maintenance Fee'
    };

    const signature = generateSignature(data, config.passphrase);
    data.signature = signature;

    res.json({ url: config.url, data });
  } catch (error) {
    console.error('Error generating PayFast maintenance payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Generate PayFast payload for a VIP Bidding Refundable Deposit
// @route   POST /api/payfast/generate-deposit
// @access  Private
exports.generateDepositPayment = async (req, res) => {
  try {
    const { depositId } = req.body;
    const deposit = await BidderDeposit.findById(depositId).populate('bidder', 'name email');

    if (!deposit) return res.status(404).json({ message: 'Deposit record not found' });
    if (deposit.paymentStatus === 'paid') return res.status(400).json({ message: 'Deposit already paid' });
    if (deposit.bidder._id.toString() !== req.user._id.toString()) {
       return res.status(403).json({ message: 'Only the account holder can pay for this deposit' });
    }

    const config = getPayfastConfig();
    const frontendUrl = getFrontendUrl(req);
    const backendUrl = getBackendUrl(req);

    const data = {
      merchant_id: config.merchant_id,
      merchant_key: config.merchant_key,
      return_url: `${frontendUrl}/auction/vip-checkout?payment=success&ref=${deposit._id}`,
      cancel_url: `${frontendUrl}/auction/vip-checkout?payment=cancel&ref=${deposit._id}`,
      notify_url: `${backendUrl}/api/payfast/itn`,
      name_first: deposit.bidder.name.split(' ')[0],
      name_last: deposit.bidder.name.split(' ').slice(1).join(' ') || 'Patron',
      email_address: deposit.bidder.email,
      m_payment_id: `DEP-${deposit._id}`,
      amount: deposit.amount.toFixed(2),
      item_name: 'VIP Auction Bidding Refundable Guarantee Deposit'
    };

    const signature = generateSignature(data, config.passphrase);
    data.signature = signature;

    res.json({ url: config.url, data });
  } catch (error) {
    console.error('Error generating PayFast deposit payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Handle PayFast ITN Webhook
// @route   POST /api/payfast/itn
// @access  Public
exports.itnWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const config = getPayfastConfig();

    console.log('PayFast ITN received', {
      paymentId: payload?.m_payment_id,
      status: payload?.payment_status,
    });

    if (!payload || typeof payload !== 'object' || !payload.m_payment_id || !payload.payment_status) {
      console.error('PayFast ITN missing required form fields');
      return res.status(400).send('Invalid payload');
    }
    
    // We will verify the ITN by doing a POST back to PayFast's validation endpoint
    // NOTE: PayFast requires the signature field to be excluded when validating
    const axios = require('axios');
    let pfParamString = '';
    for (let key in payload) {
      if (key !== 'signature' && payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
        pfParamString += `${key}=${payfastUrlEncode(payload[key].toString().trim())}&`;
      }
    }
    pfParamString = pfParamString.slice(0, -1);

    const isLive = process.env.PAYFAST_IS_LIVE === 'true';
    const validateUrl = isLive ? 'https://www.payfast.co.za/eng/query/validate' : 'https://sandbox.payfast.co.za/eng/query/validate';

    try {
      const validateResponse = await axios.post(validateUrl, pfParamString, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      if (validateResponse.data !== 'VALID') {
        console.error('PayFast ITN signature mismatch (Validation failed):', validateResponse.data);
        return res.status(400).send('Invalid signature');
      }
    } catch (valErr) {
      console.error('Error contacting PayFast validation endpoint:', valErr.message);
      return res.status(500).send('Validation network error');
    }

    if (String(payload.merchant_id) !== String(config.merchant_id)) {
      console.error('PayFast ITN merchant mismatch');
      return res.status(400).send('Invalid merchant');
    }

    if (payload.payment_status === 'COMPLETE') {
       const reference = payload.m_payment_id;
       if (reference.startsWith('SHP-')) {
          const orderId = reference.replace('SHP-', '');
          await processOrderPayment(orderId);
          console.log(`Successfully processed shop order payment for ${orderId}`);
       } else if (reference.startsWith('AUC-')) {
          const auctionId = reference.replace('AUC-', '');
          await processAuctionPayment(auctionId);
          console.log(`Successfully processed auction payment for ${auctionId}`);
       } else if (reference.startsWith('EVT-')) {
          const bookingId = reference.replace('EVT-', '');
          await processEventPayment(bookingId, {
            gatewayTransactionId: payload.pf_payment_id,
          });
          console.log(`Successfully processed event payment for ${bookingId}`);
       } else if (reference.startsWith('VND-')) {
          const vendorId = reference.replace('VND-', '');
          await processVendorPayment(vendorId);
          console.log(`Successfully processed vendor payment for ${vendorId}`);
       } else if (reference.startsWith('DEP-')) {
          const depositId = reference.replace('DEP-', '');
          await processBidderDepositPayment(depositId, payload.pf_payment_id);
          console.log(`Successfully processed VIP bidder deposit payment for ${depositId}`);
       } else if (reference.startsWith('MNF-')) {
          const parts = reference.replace('MNF-', '').split('-');
          const vendorId = parts[0];
          const { processMaintenanceFeePayment } = require('./vendorController');
          await processMaintenanceFeePayment(vendorId, {
            paymentMethod: 'PayFast',
            reference: payload.pf_payment_id || reference,
            amount: Number(payload.amount_gross || 0) || null
          });
          console.log(`Successfully processed vendor maintenance fee payment for ${vendorId}`);
       }
    } else if (payload.payment_status === 'CANCELLED' || payload.payment_status === 'FAILED') {
       const reference = payload.m_payment_id;
       if (reference && reference.startsWith('SHP-')) {
          const orderId = reference.replace('SHP-', '');
          await cancelOrderPayment(orderId, `PayFast ITN status: ${payload.payment_status}`);
          console.log(`Successfully cancelled shop order ${orderId} due to ITN status: ${payload.payment_status}`);
       }
    }

    // Always respond 200 OK so PayFast knows we received it
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in PayFast ITN webhook:', error);
    res.status(500).send('Error');
  }
};

// @desc    Confirm order payment via PayFast (invoked upon client gateway success or webhook)
// @route   POST /api/payfast/confirm-order
// @access  Private
exports.confirmOrderPayment = async (req, res) => {
  try {
    const { orderId, bookingId, auctionId, depositId } = req.body;
    const mongoose = require('mongoose');

    // 1. Event / Cellar Tasting Booking Confirmation
    if (bookingId) {
      const Booking = require('../models/Booking');
      let booking = null;
      if (mongoose.Types.ObjectId.isValid(bookingId)) {
        booking = await Booking.findById(bookingId);
      }
      if (!booking) {
        booking = await Booking.findOne({ $or: [{ ticketId: bookingId }, { gsReference: bookingId }] });
      }
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      await processEventPayment(booking._id, {
        gatewayTransactionId: req.body.pfPaymentId || `PF-APP-${Date.now()}`
      });
      const updatedBooking = await Booking.findById(booking._id).populate('event');
      return res.json({ success: true, booking: updatedBooking });
    }

    // 2. Auction Winning Lot Confirmation
    if (auctionId) {
      const AuctionLot = require('../models/AuctionLot');
      let lot = null;
      if (mongoose.Types.ObjectId.isValid(auctionId)) {
        lot = await AuctionLot.findById(auctionId);
      }
      if (!lot) {
        lot = await AuctionLot.findOne({ lotNumber: auctionId });
      }
      if (!lot) {
        return res.status(404).json({ message: 'Auction lot not found' });
      }
      await processAuctionPayment(lot._id);
      const updatedLot = await AuctionLot.findById(lot._id);
      return res.json({ success: true, lot: updatedLot });
    }

    // 3. VIP Bidding Escrow Deposit Confirmation
    if (depositId) {
      const BidderDeposit = require('../models/BidderDeposit');
      let deposit = null;
      if (mongoose.Types.ObjectId.isValid(depositId)) {
        deposit = await BidderDeposit.findById(depositId);
      }
      if (!deposit) {
        deposit = await BidderDeposit.findOne({ reference: depositId });
      }
      if (!deposit) {
        return res.status(404).json({ message: 'Deposit record not found' });
      }
      await processBidderDepositPayment(deposit._id, req.body.pfPaymentId || `PF-DEP-${Date.now()}`);
      const updatedDeposit = await BidderDeposit.findById(deposit._id);
      return res.json({ success: true, deposit: updatedDeposit });
    }

    // 4. Vendor Maintenance Fee Confirmation
    if (req.body.maintenanceVendorId || req.body.maintenanceFee) {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findOne({
        $or: [
          { _id: req.body.maintenanceVendorId },
          { userId: req.user?._id }
        ]
      });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor application not found' });
      }
      const { processMaintenanceFeePayment } = require('./vendorController');
      const updatedVendor = await processMaintenanceFeePayment(vendor._id, {
        paymentMethod: 'PayFast',
        reference: req.body.pfPaymentId || `PF-MNF-${Date.now().toString().slice(-6)}`
      });
      return res.json({ success: true, vendor: updatedVendor });
    }

    // 5. Shop Order Confirmation
    let order = null;
    if (orderId) {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId);
      }
      if (!order) {
        order = await Order.findOne({ orderId });
      }
    }
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Process payment ledger, wallet, events, isPaid
    if (!order.isPaid) {
      if (order.paymentStatus === 'Cancelled' || order.paymentStatus === 'Failed') {
        return res.status(400).json({ message: 'Cannot confirm a cancelled or failed order' });
      }
      await processOrderPayment(order._id);
    }

    const updated = await Order.findById(order._id);
    return res.json(updated);
  } catch (error) {
    console.error('Error confirming PayFast order:', error);
    return res.status(500).json({ message: 'Error confirming PayFast order', error: error.message });
  }
};

// @desc    Mobile Return Callback Endpoint for In-App WebView
// @route   GET /api/payfast/mobile-return
// @access  Public
exports.mobileReturnHandler = async (req, res) => {
  try {
    const { type, status, orderId, auctionId, bookingId } = req.query;
    const isSuccess = status === 'success';

    if (isSuccess) {
      if (type === 'shop' && orderId) {
        try {
          await processOrderPayment(orderId, 'PayFast', req.query);
        } catch (e) {
          console.error('Error in mobileReturnHandler processOrderPayment:', e);
        }
      } else if (type === 'auction' && auctionId) {
        try {
          await processAuctionPayment(auctionId, 'PayFast', req.query);
        } catch (e) {
          console.error('Error in mobileReturnHandler processAuctionPayment:', e);
        }
      } else if (type === 'event' && bookingId) {
        try {
          await processEventPayment(bookingId, req.query);
        } catch (e) {
          console.error('Error in mobileReturnHandler processEventPayment:', e);
        }
      }
    } else {
      // Payment was cancelled or failed on mobile gateway
      if (type === 'shop' && orderId) {
        try {
          await cancelOrderPayment(orderId, 'Customer cancelled payment on mobile gateway');
          console.log(`mobileReturnHandler: Cancelled shop order ${orderId} upon mobile gateway cancel return`);
        } catch (e) {
          console.error('Error in mobileReturnHandler cancelOrderPayment:', e);
        }
      }
    }

    const payload = JSON.stringify({
      type: isSuccess ? 'PAYFAST_SUCCESS' : 'PAYFAST_CANCEL',
      status: isSuccess ? 'success' : 'cancel',
      itemType: type || 'shop',
      orderId: orderId || null,
      auctionId: auctionId || null,
      bookingId: bookingId || null,
    });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment ${isSuccess ? 'Confirmed' : 'Cancelled'} • The Grand Store</title>
  <style>
    body {
      background-color: #0c0b0a;
      color: #f5c242;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      text-align: center;
      box-sizing: border-box;
    }
    .badge {
      width: 64px;
      height: 64px;
      border-radius: 32px;
      background: rgba(245, 194, 66, 0.15);
      border: 2px solid #f5c242;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-bottom: 20px;
    }
    h2 {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin: 0 0 10px;
      color: ${isSuccess ? '#f5c242' : '#e74c3c'};
    }
    p {
      font-size: 14px;
      color: #aaa;
      margin: 0 0 20px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="badge">${isSuccess ? '✓' : '✕'}</div>
  <h2>${isSuccess ? 'Payment Successful' : 'Payment Cancelled'}</h2>
  <p>${isSuccess ? 'Returning securely to The Grand Store application...' : 'Returning to checkout...'}</p>
  <script>
    (function() {
      var messageData = ${payload};
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(messageData));
      }
      setTimeout(function() {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(messageData));
        }
      }, 300);
    })();
  </script>
</body>
</html>`;

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Error in mobileReturnHandler:', err);
    res.status(500).send('Internal Server Error');
  }
};

