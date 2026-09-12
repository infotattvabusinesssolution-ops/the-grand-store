const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Order = require('../models/Order');
const Shipment = require('../models/Shipment'); // Required so Mongoose registers the model before populate() is called
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { createInAppNotification } = require('./notificationController');

// @desc    Get Admin Finance Overview
// @route   GET /api/admin/finance
// @access  Private/Admin
const getAdminFinanceOverview = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 250, 1), 2000);
    const transactions = await Transaction.find({ status: { $nin: ['cancelled', 'failed', 'Cancelled', 'Failed'] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('customer', 'name email')
      .populate('vendor', 'name email');
    const rawShopOrders = await Order.find({
      transactionId: { $regex: /SHP/ },
      paymentStatus: { $nin: ['Cancelled', 'Failed', 'cancelled', 'failed'] },
      isPaid: true
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .populate('shipments')
      .lean();

    // Older orders did not store category snapshots. Resolve their products here so
    // category reporting remains useful for both historic and newly-created orders.
    const productReferences = [...new Set(rawShopOrders.flatMap((order) =>
      (order.orderItems || []).map((item) => String(item.product || '')).filter(Boolean)
    ))];
    const productNames = [...new Set(rawShopOrders.flatMap((order) =>
      (order.orderItems || []).map((item) => item.name).filter(Boolean)
    ))];
    const objectIdReferences = productReferences.filter((reference) => /^[0-9a-fA-F]{24}$/.test(reference));
    const productFilters = [];
    if (productReferences.length) productFilters.push({ id: { $in: productReferences } });
    if (objectIdReferences.length) productFilters.push({ _id: { $in: objectIdReferences } });
    if (productNames.length) productFilters.push({ name: { $in: productNames } });

    const categoryProducts = productFilters.length
      ? await Product.find({ $or: productFilters }).select('_id id name category subcategory').lean()
      : [];
    const productLookup = new Map();
    categoryProducts.forEach((product) => {
      if (product._id) productLookup.set(String(product._id), product);
      if (product.id) productLookup.set(String(product.id), product);
      if (product.name) productLookup.set(`name:${product.name.toLocaleLowerCase()}`, product);
    });

    const shopOrders = rawShopOrders.map((order) => ({
      ...order,
      orderItems: (order.orderItems || []).map((item) => {
        const product = productLookup.get(String(item.product || ''))
          || productLookup.get(`name:${String(item.name || '').toLocaleLowerCase()}`);
        return {
          ...item,
          category: item.category && item.category !== 'Uncategorised'
            ? item.category
            : (product?.category || 'Uncategorised'),
          subcategory: item.subcategory || product?.subcategory || '',
        };
      }),
    }));
    const auctionOrders = await Order.find({
      transactionId: { $regex: /AUC/ },
      paymentStatus: { $nin: ['Cancelled', 'Failed', 'cancelled', 'failed'] },
      isPaid: true
    }).sort({ createdAt: -1 }).limit(limit).populate('user', 'name email');
    const eventBookings = await Booking.find({
      paymentStatus: { $in: ['Paid', 'Completed'] }
    }).sort({ createdAt: -1 }).limit(limit).populate('user', 'name email');
    const vendorPayments = await Transaction.find({ module: 'vendor', type: 'payment', status: { $nin: ['cancelled', 'failed', 'Cancelled', 'Failed'] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('customer', 'name email');
    const metricRows = await Transaction.aggregate([
      { $match: { status: { $nin: ['cancelled', 'failed', 'Cancelled', 'Failed'] } } },
      { $group: { _id: { type: '$type', status: '$status' }, amount: { $sum: '$amount' } } },
    ]);

    let totalProcessed = 0;
    let totalPlatformRevenue = 0;
    let totalPendingPayables = 0;
    let totalVatCollected = 0;

    metricRows.forEach((row) => {
      if (row._id.type === 'payment' && row._id.status === 'cleared') {
        totalProcessed += row.amount;
      }
      if (row._id.type === 'commission' && row._id.status === 'cleared') {
        totalPlatformRevenue += row.amount;
      }
      if (row._id.type === 'vat' && row._id.status === 'cleared') {
        totalVatCollected += row.amount;
      }
      if (row._id.type === 'payout' && (row._id.status === 'pending' || row._id.status === 'delayed')) {
        totalPendingPayables += row.amount;
      }
    });

    res.json({
      metrics: {
        totalProcessed,
        totalPlatformRevenue,
        totalPendingPayables,
        totalVatCollected
      },
      transactions,
      orders: shopOrders,
      shopOrders,
      auctionOrders,
      eventBookings,
      vendorPayments
    });
  } catch (error) {
    console.error('Get Admin Finance Error:', error);
    res.status(500).json({ message: 'Server error retrieving finance data' });
  }
};

// @desc    Get Vendor Wallet, Banking & Payout History
// @route   GET /api/vendor/wallet
// @access  Private/Vendor
const getVendorWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ vendorId: req.user._id });
    
    // If no wallet exists yet, create or return empty structure
    if (!wallet) {
      wallet = {
        availableBalance: 0,
        pendingBalance: 0,
        pendingWithdrawalAmount: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        payoutDetails: {}
      };
    }

    const vendor = await Vendor.findOne({ userId: req.user._id }).select('bankingInfo businessInfo status');

    const transactions = await Transaction.find({ vendor: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    const payouts = await Transaction.find({ vendor: req.user._id, type: 'payout' })
      .sort({ createdAt: -1 });

    const orders = await Order.find({ 'vendorPayables.vendorId': req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const bankingInfo = vendor?.bankingInfo?.accountNumber 
      ? vendor.bankingInfo 
      : (wallet.payoutDetails?.accountNumber ? wallet.payoutDetails : null);

    res.json({
      wallet: {
        availableBalance: wallet.availableBalance || 0,
        pendingBalance: wallet.pendingBalance || 0,
        pendingWithdrawalAmount: wallet.pendingWithdrawalAmount || 0,
        totalEarned: wallet.totalEarned || 0,
        totalWithdrawn: wallet.totalWithdrawn || 0,
        payoutDetails: wallet.payoutDetails || {}
      },
      bankingInfo,
      payouts,
      transactions,
      orders
    });
  } catch (error) {
    console.error('Get Vendor Wallet Error:', error);
    res.status(500).json({ message: 'Server error retrieving wallet data' });
  }
};

// @desc    Request Vendor Payout (Withdrawal / Redemption)
// @route   POST /api/vendor/wallet/payout-request
// @access  Private/Vendor
const requestVendorPayout = async (req, res) => {
  try {
    const rawAmount = Number(req.body.amount);
    if (!rawAmount || Number.isNaN(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid payout amount.' });
    }

    const amount = Number(rawAmount.toFixed(2));
    if (amount < 50) {
      return res.status(400).json({ message: 'Minimum payout request amount is R 50.00.' });
    }

    const vendor = await Vendor.findOne({ userId: req.user._id });
    const vendorBank = vendor?.bankingInfo;

    let wallet = await Wallet.findOne({ vendorId: req.user._id });
    if (!wallet) {
      return res.status(400).json({ message: 'Wallet not initialized. No funds available.' });
    }

    const activeBank = vendorBank?.accountNumber ? vendorBank : wallet.payoutDetails;

    if (!activeBank?.bankName || !activeBank?.accountNumber) {
      return res.status(400).json({
        message: 'No registered bank account found. Please configure your bank details in the Bank Details tab before requesting a payout.'
      });
    }

    if (amount > (wallet.availableBalance || 0)) {
      return res.status(400).json({
        message: `Requested amount exceeds available balance. You have R ${(wallet.availableBalance || 0).toFixed(2)} available.`
      });
    }

    // Deduct from availableBalance and place in pendingWithdrawalAmount
    wallet.availableBalance = Math.max(0, Number((wallet.availableBalance - amount).toFixed(2)));
    wallet.pendingWithdrawalAmount = Number(((wallet.pendingWithdrawalAmount || 0) + amount).toFixed(2));
    await wallet.save();

    const timestamp = Date.now();
    const gsReference = `GS-${new Date().getFullYear().toString().slice(-2)}-VND-POUT-${timestamp.toString().slice(-6)}`;

    const transaction = await Transaction.create({
      gsReference,
      type: 'payout',
      module: 'vendor',
      amount,
      netAmount: amount,
      currency: 'ZAR',
      vendor: req.user._id,
      customer: req.user._id,
      status: 'pending',
      description: `Vendor Payout Request - ${vendor?.businessInfo?.tradingName || vendor?.businessInfo?.legalName || req.user.name} to ${activeBank.bankName} (***${String(activeBank.accountNumber).slice(-4)})`,
      payoutDetails: {
        bankName: activeBank.bankName,
        accountName: activeBank.accountName || req.user.name,
        accountNumber: activeBank.accountNumber,
        branchCode: activeBank.branchCode,
        accountType: activeBank.accountType || 'Cheque / Current',
        swiftCode: activeBank.swiftCode || '',
        bankConfirmationUrl: activeBank.bankConfirmationUrl || '',
        requestedAt: new Date(),
        adminNotes: req.body.notes ? String(req.body.notes).trim() : ''
      }
    });

    // Notify Vendor in-app
    try {
      await createInAppNotification({
        recipient: req.user._id,
        recipientType: 'vendor',
        title: 'Payout Request Submitted',
        message: `Your payout request for R ${amount.toFixed(2)} (${gsReference}) has been received and queued for finance disbursement to ${activeBank.bankName}.`,
        type: 'payout',
        link: '/vendor/wallet'
      });
    } catch (notifErr) {
      console.warn('Notification to vendor failed:', notifErr.message);
    }

    // Notify Admin in-app
    try {
      await createInAppNotification({
        recipient: null,
        recipientType: 'admin',
        title: 'New Vendor Payout Request',
        message: `${vendor?.businessInfo?.tradingName || vendor?.businessInfo?.legalName || req.user.name} requested payout of R ${amount.toFixed(2)} (${gsReference}) to ${activeBank.bankName}.`,
        type: 'payout_request',
        link: '/admin/financials'
      });
    } catch (notifErr) {
      console.warn('Notification to admin failed:', notifErr.message);
    }

    res.status(201).json({
      message: 'Payout request submitted successfully. Funds have been reserved for clearance.',
      transaction,
      wallet: {
        availableBalance: wallet.availableBalance,
        pendingBalance: wallet.pendingBalance,
        pendingWithdrawalAmount: wallet.pendingWithdrawalAmount,
        totalWithdrawn: wallet.totalWithdrawn
      }
    });
  } catch (error) {
    console.error('Request Vendor Payout Error:', error);
    res.status(500).json({ message: 'Server error processing payout request', error: error.message });
  }
};

// @desc    Get Vendor Payout & Redemption History (with Date and Status Filters)
// @route   GET /api/vendor/wallet/payout-history
// @access  Private/Vendor
const getVendorPayoutHistory = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = { vendor: req.user._id, type: 'payout' };

    if (status && status !== 'all') {
      if (status === 'cleared' || status === 'paid') {
        query.status = { $in: ['cleared', 'paid'] };
      } else {
        query.status = status;
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const payouts = await Transaction.find(query).sort({ createdAt: -1 });
    res.json(payouts);
  } catch (error) {
    console.error('Get Vendor Payout History Error:', error);
    res.status(500).json({ message: 'Server error retrieving payout history', error: error.message });
  }
};

module.exports = {
  getAdminFinanceOverview,
  getVendorWallet,
  requestVendorPayout,
  getVendorPayoutHistory
};
