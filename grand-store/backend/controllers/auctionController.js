const AuctionLot = require('../models/AuctionLot');
const Bid = require('../models/Bid');
const User = require('../models/User');
const AuctionFraudAlert = require('../models/AuctionFraudAlert');
const AuctionLedger = require('../models/AuctionLedger');
const BidderDeposit = require('../models/BidderDeposit');
const PlatformSettings = require('../models/PlatformSettings');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const { getNextSequence } = require('../utils/sequenceGenerator');
const { sendEmail } = require('../utils/emailService');
const { auctionWinTemplate } = require('../utils/emailTemplates');
const { generateAuctionCertificateBuffer } = require('../utils/pdfService');
const { evaluateBidIntegrity, logAuctionEvent } = require('../services/auctionFraudService');
const { createInAppNotification } = require('./notificationController');

const calculateDynamicIncrement = (currentBid) => {
  if (currentBid < 5000) return 250;
  if (currentBid < 10000) return 500;
  if (currentBid < 50000) return 1000;
  if (currentBid < 100000) return 2500;
  return 5000;
};

const parseAuctionSchedule = (startDate, endDate) => {
  const parsedStart = new Date(startDate);
  const parsedEnd = new Date(endDate);

  if (!startDate || !endDate || Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    return { error: 'A valid auction start and end date are required.' };
  }
  if (parsedEnd <= parsedStart) {
    return { error: 'Auction end date must be later than its start date.' };
  }
  if (parsedEnd <= new Date()) {
    return { error: 'Auction end date must be in the future.' };
  }

  return { startDate: parsedStart, endDate: parsedEnd };
};

exports.parseAuctionSchedule = parseAuctionSchedule;

// PUBLIC: Get all active auctions
exports.getAuctionLots = async (req, res) => {
  try {
    let lots = await AuctionLot.find({
      status: { $in: ['live', 'upcoming', 'closed', 'sold', 'unsold'] }
    })
    .populate('vendor', 'name storeName role')
    .populate('winner', 'name')
    .sort({ endDate: 1 });

    lots = lots.filter(lot => {
      if (!lot.vendor) return false;
      const role = lot.vendor.role;
      return role === 'admin' || role === 'vendor_active' || role === 'auction_host';
    });

    res.json(lots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUBLIC: Check if any auctions are currently live
exports.getLiveAuctionStatus = async (req, res) => {
  try {
    const liveCount = await AuctionLot.countDocuments({
      status: { $in: ['live', 'extended'] },
      startDate: { $lte: new Date() },
      endDate: { $gt: new Date() }
    });
    res.json({ hasLiveAuction: liveCount > 0, liveCount });
  } catch (error) {
    res.status(500).json({ hasLiveAuction: false, error: error.message });
  }
};

// PUBLIC: Get a specific lot (with optional auth for admin/vendor visibility)
exports.getLotDetails = async (req, res) => {
  try {
    const lot = await AuctionLot.findById(req.params.id).populate('vendor', 'name storeName');
    if (!lot) return res.status(404).json({ message: 'Lot not found' });
    
    // Check if user is logged in for elevated permissions
    let currentUser = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        currentUser = await User.findById(decoded.id).select('-password');
      } catch (err) {
        // Ignore token errors for this public route
      }
    }

    // Fetch top bids
    const bids = await Bid.find({ lot: lot._id, isMaxBid: false })
      .sort({ amount: -1 })
      .limit(15)
      .populate('user', 'name email');

    // Return sanitized bid info
    const sanitizedBids = bids.map(b => {
      let canSeeDetails = false;
      if (currentUser) {
         if (currentUser.role === 'admin') canSeeDetails = true;
         if (lot.vendor && lot.vendor._id.toString() === currentUser._id.toString()) canSeeDetails = true;
      }

      return {
        _id: b._id,
        amount: b.amount,
        time: b.createdAt,
        bidder: canSeeDetails 
          ? (b.user ? `${b.user.name} (${b.user.email})` : 'Deleted User') 
          : (b.user ? `Bidder #${b.user._id.toString().substring(18)}` : 'Deleted User'),
        isUserBid: currentUser && b.user ? (b.user._id.toString() === currentUser._id.toString()) : false
      };
    });

    // Convert to plain object to attach custom properties
    const lotObj = lot.toObject();

    // Attach payment status and shipping address if sold
    if (lotObj.status === 'sold') {
      const order = await Order.findOne({
        $or: [
          { 'orderItems.product': lotObj._id.toString() },
          { 'orderItems.product': lotObj._id },
          ...(lotObj.gsReference ? [{ transactionId: lotObj.gsReference }] : [])
        ]
      });

      if (order) {
        if (order.isPaid || order.paymentStatus === 'Paid') {
          lotObj.paymentStatus = 'Paid';
          lotObj.isPaid = true;
        } else if (order.paymentStatus === 'Awaiting_Approval' || order.proofUrl) {
          lotObj.paymentStatus = 'Awaiting_Approval';
          lotObj.proofUrl = order.proofUrl || lotObj.proofUrl;
        }

        lotObj.order = {
          _id: order._id,
          orderId: order.orderId,
          transactionId: order.transactionId,
          invoiceNumber: order.invoiceNumber,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          isPaid: order.isPaid,
          proofUrl: order.proofUrl,
          totalPrice: order.totalPrice,
          shippingAddress: order.shippingAddress
        };

        if (order.shippingCost && !lotObj.shippingCost) {
          lotObj.shippingCost = order.shippingCost;
        }

        if (order.shippingAddress) {
          const isWinner = currentUser && lotObj.winner && lotObj.winner.toString() === currentUser._id.toString();
          const isAdmin = currentUser && currentUser.role === 'admin';
          const isVendor = currentUser && lotObj.vendor && lotObj.vendor._id.toString() === currentUser._id.toString();

          if (isWinner || isAdmin || isVendor) {
            lotObj.shippingAddress = order.shippingAddress;
          }
        }
      }
    }

    res.json({ lot: lotObj, bids: sanitizedBids });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// AUTHENTICATED: Place a bid
exports.placeBid = async (req, res) => {
  try {
    const { amount, isMaxBid, placedCurrency = 'ZAR', placedAmount = amount } = req.body;
    const lotId = req.params.id;
    const userId = req.user._id;

    const lot = await AuctionLot.findById(lotId);
    if (!lot) return res.status(404).json({ message: 'Lot not found' });
    
    // Bidder Permission, KYC & Admin Approval checks
    if (req.user.isBiddingSuspended) {
      return res.status(403).json({ message: 'Your bidding privileges are temporarily suspended. Reason: ' + (req.user.biddingSuspensionReason || 'Account under review') });
    }

    if (req.user.bidderApprovalStatus !== 'approved') {
      const isPending = req.user.bidderApprovalStatus === 'pending_approval';
      return res.status(403).json({ 
        message: isPending
          ? 'Your bidder application is currently under administrator review and approval. You will be notified once approved.'
          : 'Bidder qualification required. Please submit your 18+ age verification and ID details to request bidding approval.',
        requiresVerification: !isPending,
        isPending
      });
    }

    const userLimit = req.user.biddingLimit || 0;
    if (amount > userLimit) {
      return res.status(403).json({ 
        message: `This bid exceeds your approved limit of R${userLimit.toLocaleString()}. Please complete deposit verification or contact support to request a limit increase.` 
      });
    }

    // Fraud & Shill Bidding Evaluation
    const integrityCheck = await evaluateBidIntegrity({
      lot,
      bidder: req.user,
      bidAmount: amount,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    if (integrityCheck.isBlocked) {
      return res.status(403).json({ message: integrityCheck.blockReason });
    }
    
    // State transitions
    if (lot.status === 'upcoming' && new Date() >= new Date(lot.startDate)) {
      lot.status = 'live';
      await lot.save();
    }

    if (lot.status !== 'live' && lot.status !== 'extended') {
      return res.status(400).json({ message: 'Auction is not live' });
    }

    if (new Date() > new Date(lot.endDate)) {
      lot.status = 'closed';
      await lot.save();
      return res.status(400).json({ message: 'Auction has ended' });
    }

    // Dynamic Increment Ladder
    const currentIncrement = calculateDynamicIncrement(lot.currentBid);
    const nextMinimum = lot.currentBid === 0 ? lot.startingBid : lot.currentBid + currentIncrement;
    
    if (amount < nextMinimum) {
      return res.status(400).json({ message: `Minimum bid must be at least R${nextMinimum.toLocaleString()}`, nextMinimum });
    }

    const previousHighBidder = lot.highBidder;
    const bidderHandle = req.user.bidderNumber || `Bidder GS-${String(req.user._id).slice(-4).toUpperCase()}`;

    // Max / Proxy Bid Logic
    let winningUserId = userId;
    let effectiveWinningAmt = amount;

    if (isMaxBid) {
      const newMaxBid = new Bid({
        user: userId,
        lot: lotId,
        amount: amount,
        placedCurrency,
        placedAmount,
        isMaxBid: true,
        bidType: 'proxy',
        maxProxyAmount: amount,
        bidderNumber: bidderHandle,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      await newMaxBid.save();

      // Compete with existing max bid
      const highestExistingMax = await Bid.findOne({
        lot: lotId,
        isMaxBid: true,
        _id: { $ne: newMaxBid._id }
      }).sort({ amount: -1 });

      if (highestExistingMax && highestExistingMax.amount >= amount) {
        // Existing max bidder remains in lead
        winningUserId = highestExistingMax.user;
        const counterBidAmt = Math.min(highestExistingMax.amount, amount + currentIncrement);
        
        lot.currentBid = counterBidAmt;
        lot.highBidder = winningUserId;
        lot.bidCount = (lot.bidCount || 0) + 1;
        lot.lastBidTime = new Date();

        await new Bid({
          user: highestExistingMax.user,
          lot: lotId,
          amount: counterBidAmt,
          isMaxBid: false,
          bidType: 'proxy',
          bidderNumber: `Bidder GS-${String(highestExistingMax.user).slice(-4).toUpperCase()}`,
          ipAddress: 'SYSTEM_PROXY'
        }).save();

        await lot.save();

        await logAuctionEvent({
          lotId: lot._id,
          userId: req.user._id,
          eventType: 'PROXY_TRIGGERED',
          details: { challengerBid: amount, winningCounter: counterBidAmt, leader: highestExistingMax.user },
          ipAddress: req.ip
        });

        return res.status(200).json({
          message: 'Your maximum bid was recorded, but an existing automatic bid has outbid you.',
          lot,
          outbid: true
        });
      } else {
        // Challenger takes lead
        if (highestExistingMax) {
          effectiveWinningAmt = Math.min(amount, highestExistingMax.amount + currentIncrement);
        } else {
          effectiveWinningAmt = nextMinimum;
        }

        await new Bid({
          user: userId,
          lot: lotId,
          amount: effectiveWinningAmt,
          isMaxBid: false,
          bidType: 'proxy',
          bidderNumber: bidderHandle,
          ipAddress: req.ip
        }).save();

        lot.currentBid = effectiveWinningAmt;
        winningUserId = userId;
      }
    } else {
      // Normal Manual Bid
      const highestExistingMax = await Bid.findOne({ lot: lotId, isMaxBid: true }).sort({ amount: -1 });

      if (highestExistingMax && highestExistingMax.user.toString() !== userId.toString() && highestExistingMax.amount >= amount) {
        const counterBidAmt = Math.min(highestExistingMax.amount, amount + currentIncrement);
        
        await new Bid({
          user: highestExistingMax.user,
          lot: lotId,
          amount: counterBidAmt,
          isMaxBid: false,
          bidType: 'proxy',
          bidderNumber: `Bidder GS-${String(highestExistingMax.user).slice(-4).toUpperCase()}`,
          ipAddress: 'SYSTEM_PROXY'
        }).save();

        lot.currentBid = counterBidAmt;
        lot.highBidder = highestExistingMax.user;
        lot.bidCount = (lot.bidCount || 0) + 1;
        lot.lastBidTime = new Date();
        await lot.save();

        return res.status(200).json({
          message: 'Your bid was recorded, but an existing automatic bid has outbid you.',
          lot,
          outbid: true
        });
      }

      await new Bid({
        user: userId,
        lot: lotId,
        amount: amount,
        placedCurrency,
        placedAmount,
        isMaxBid: false,
        bidType: 'manual',
        bidderNumber: bidderHandle,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).save();

      lot.currentBid = amount;
      winningUserId = userId;
    }

    // Update Lot state
    lot.highBidder = winningUserId;
    lot.bidCount = (lot.bidCount || 0) + 1;
    lot.lastBidTime = new Date();

    // Check Reserve Price
    if (lot.reservePrice && lot.currentBid >= lot.reservePrice && !lot.reserveMet) {
      lot.reserveMet = true;
      await logAuctionEvent({
        lotId: lot._id,
        userId,
        eventType: 'RESERVE_MET',
        details: { currentBid: lot.currentBid, reservePrice: lot.reservePrice }
      });
    }

    // Anti-Sniping (Dynamic Extension: if bid placed within final 2 minutes, extend by 2 mins)
    const msRemaining = new Date(lot.endDate).getTime() - Date.now();
    const TWO_MINUTES_MS = 120000;
    
    if (msRemaining > 0 && msRemaining < TWO_MINUTES_MS) {
      lot.endDate = new Date(Date.now() + TWO_MINUTES_MS);
      lot.status = 'extended';
      lot.isExtended = true;
      lot.extensionCount = (lot.extensionCount || 0) + 1;

      await logAuctionEvent({
        lotId: lot._id,
        userId,
        eventType: 'EXTENSION_TRIGGERED',
        details: { newEndDate: lot.endDate, extensionCount: lot.extensionCount },
        ipAddress: req.ip
      });
    }

    await lot.save();

    // In-App Notifications: Outbid alert & Leading bid confirmation
    try {
      const { createInAppNotification } = require('./notificationController');
      if (previousHighBidder && previousHighBidder.toString() !== winningUserId.toString()) {
        createInAppNotification({
          recipient: previousHighBidder,
          recipientType: 'customer',
          title: `⚠️ Outbid Alert: Lot ${lot.lotNumber || ''}`,
          message: `You have been outbid on "${lot.title}". The leading bid is now R${lot.currentBid.toLocaleString('en-ZA')}. Retake the lead before time expires!`,
          type: 'auction',
          link: `/auction/${lot._id}`,
          metadata: { lotId: lot._id, currentBid: lot.currentBid }
        }).catch(err => console.error('Outbid notification failed:', err));
      }

      createInAppNotification({
        recipient: winningUserId,
        recipientType: 'customer',
        title: `👑 Leading Bid Confirmed: Lot ${lot.lotNumber || ''}`,
        message: `Your bid of R${lot.currentBid.toLocaleString('en-ZA')} on "${lot.title}" is currently holding the leading position!`,
        type: 'auction',
        link: `/auction/${lot._id}`,
        metadata: { lotId: lot._id, currentBid: lot.currentBid }
      }).catch(err => console.error('Bid confirmation notification failed:', err));
    } catch (e) {
      console.error('Error creating bid notifications:', e);
    }

    await logAuctionEvent({
      lotId: lot._id,
      userId,
      eventType: 'BID_PLACED',
      details: { amount: lot.currentBid, isMaxBid },
      ipAddress: req.ip
    });

    res.json({ message: 'Bid placed successfully', lot });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// VENDOR: Submit new lot
exports.submitLot = async (req, res) => {
  try {
    const { 
      title, description, category, startingBid, reservePrice, condition, provenance, startDate, endDate,
      distillery, expression, vintage, bottlingYear, ageStatement, bottleNumber, caskNumber, bottleSizeMl, abv, countryOfOrigin,
      fillLevel, boxCondition, sealCondition, provenanceHistory,
      estimatedValueMin, estimatedValueMax, reserveType
    } = req.body;
    
    if (req.user.role !== 'vendor_active' && req.user.role !== 'auction_host' && req.user.role !== 'admin') {
       return res.status(403).json({ message: 'Only active vendors, auction hosts, and admins can submit lots.' });
    }

    if (req.user.role === 'auction_host') {
      const currentLotsCount = await AuctionLot.countDocuments({ vendor: req.user._id });
      if (currentLotsCount >= (req.user.allowedHostLimit || 0)) {
        return res.status(403).json({ message: `You have reached your limit of ${req.user.allowedHostLimit || 0} auction lots. Contact support to increase it.` });
      }
    }

    const schedule = parseAuctionSchedule(startDate, endDate);
    if (schedule.error) return res.status(400).json({ message: schedule.error });

    let images = [];
    let documentationImages = [];
    let videoUrl = req.body.videoUrl || '';

    if (req.files) {
      if (Array.isArray(req.files)) {
        images = req.files.map(file => file.path);
      } else {
        if (req.files.images && req.files.images.length > 0) {
          images = req.files.images.map(file => file.path);
        }
        if (req.files.video && req.files.video.length > 0) {
          videoUrl = req.files.video[0].path;
        }
        if (req.files.documentationImages && req.files.documentationImages.length > 0) {
          documentationImages = req.files.documentationImages.map(file => file.path);
        }
      }
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    if (req.body.documentationImages && documentationImages.length === 0) {
      documentationImages = Array.isArray(req.body.documentationImages) ? req.body.documentationImages : [req.body.documentationImages];
    }

    const lot = new AuctionLot({
      title, 
      description, 
      category, 
      startingBid: Number(startingBid) || 1000, 
      reservePrice: Number(reservePrice) || Number(startingBid) || 1000, 
      condition, 
      provenance, 
      images,
      videoUrl,
      documentationImages,
      distillery,
      expression,
      vintage,
      bottlingYear,
      ageStatement,
      bottleNumber,
      caskNumber,
      bottleSizeMl: Number(bottleSizeMl) || 750,
      abv: Number(abv) || 40,
      countryOfOrigin: countryOfOrigin || 'Scotland',
      fillLevel: fillLevel || 'Into Neck',
      boxCondition: boxCondition || 'Original Box / Case Pristine',
      sealCondition: sealCondition || 'Intact & Pristine',
      provenanceHistory: provenanceHistory || provenance,
      estimatedValueMin: Number(estimatedValueMin) || undefined,
      estimatedValueMax: Number(estimatedValueMax) || undefined,
      reserveType: reserveType || 'confidential',
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      vendor: req.user._id,
      status: 'pending_approval',
      authenticationStatus: 'Pending'
    });

    await lot.save();

    await logAuctionEvent({
      lotId: lot._id,
      userId: req.user._id,
      eventType: 'LOT_STATUS_CHANGED',
      details: { newStatus: 'pending_approval', title: lot.title },
      ipAddress: req.ip
    });

    res.status(201).json(lot);
  } catch (error) {
    console.error('Submit lot error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// VENDOR: Resubmit an unsold/closed lot
exports.resubmitLot = async (req, res) => {
  try {
    if (req.user.role !== 'vendor_active' && req.user.role !== 'auction_host') {
      return res.status(403).json({ message: 'Vendor or auction host access required' });
    }

    const { startDate, endDate } = req.body;
    const lot = await AuctionLot.findOne({ _id: req.params.id, vendor: req.user._id });
    
    if (!lot) return res.status(404).json({ message: 'Lot not found' });
    if (lot.status !== 'unsold' && lot.status !== 'closed') {
      return res.status(400).json({ message: 'Only unsold or closed lots can be resubmitted' });
    }

    const schedule = parseAuctionSchedule(startDate, endDate);
    if (schedule.error) return res.status(400).json({ message: schedule.error });

    lot.startDate = schedule.startDate;
    lot.endDate = schedule.endDate;
    lot.status = 'pending_approval'; // goes back to admin for review

    await lot.save();
    res.json({ message: 'Lot resubmitted successfully', lot });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Approve lot
exports.approveLot = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
       return res.status(403).json({ message: 'Admin only' });
    }

    const { lotNumber, bidIncrement, startingBid, reservePrice, startDate, endDate } = req.body;
    const lot = await AuctionLot.findById(req.params.id);

    if (!lot) return res.status(404).json({ message: 'Lot not found' });

    const schedule = parseAuctionSchedule(startDate || lot.startDate, endDate || lot.endDate);
    if (schedule.error) return res.status(400).json({ message: schedule.error });

    lot.lotNumber = lotNumber;
    lot.bidIncrement = bidIncrement || lot.bidIncrement;
    lot.startingBid = startingBid || lot.startingBid;
    lot.reservePrice = reservePrice || lot.reservePrice;
    lot.startDate = schedule.startDate;
    lot.endDate = schedule.endDate;
    
    // Determine if it should be live or upcoming based on startDate
    lot.status = new Date() >= schedule.startDate ? 'live' : 'upcoming';

    await lot.save();
    res.json({ message: 'Lot approved', lot });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// AUTHENTICATED: Toggle watchlist
exports.toggleWatchlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const lotId = req.params.id;
    const User = require('../models/User');

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const lotIndex = user.auctionWatchlist.indexOf(lotId);
    if (lotIndex === -1) {
      user.auctionWatchlist.push(lotId);
    } else {
      user.auctionWatchlist.splice(lotIndex, 1);
    }

    await user.save();
    res.json({ message: 'Watchlist updated', watchlist: user.auctionWatchlist });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CUSTOMER: Get user's auction dashboard data (bids, wins, watchlist)
exports.getUserBids = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get lots the user has won
    const wonLots = await AuctionLot.find({ winner: userId, status: 'sold' }).populate('vendor', 'storeName name');

    // Enrich won lots with order payment and proof status
    const wonLotIds = wonLots.map(l => l._id.toString());
    const wonGsRefs = wonLots.map(l => l.gsReference).filter(Boolean);
    const wonOrders = await Order.find({
      user: userId,
      $or: [
        { 'orderItems.product': { $in: wonLotIds } },
        ...(wonGsRefs.length > 0 ? [{ transactionId: { $in: wonGsRefs } }] : [])
      ]
    }).lean();

    const enrichedWonLots = wonLots.map(lot => {
      const lotObj = lot.toObject();
      const matchedOrder = wonOrders.find(o =>
        (o.orderItems || []).some(item => item.product?.toString() === lot._id.toString()) ||
        (lot.gsReference && o.transactionId === lot.gsReference)
      );

      if (matchedOrder) {
        if (matchedOrder.isPaid || matchedOrder.paymentStatus === 'Paid') {
          lotObj.paymentStatus = 'Paid';
          lotObj.isPaid = true;
        } else if (matchedOrder.paymentStatus === 'Awaiting_Approval' || matchedOrder.proofUrl) {
          lotObj.paymentStatus = 'Awaiting_Approval';
          lotObj.proofUrl = matchedOrder.proofUrl || lotObj.proofUrl;
        }
      }
      return lotObj;
    });

    // 2. Get active bids (where user is the max bidder on a live lot)
    // For simplicity, we fetch all live lots where current max bid is from this user
    // A better approach in a real app would be querying the Bid collection
    const activeBids = await Bid.find({ user: userId })
      .sort({ amount: -1 })
      .populate('lot')
      .lean();

    // Group by lot to just get the highest bid the user placed per lot
    const bidMap = {};
    activeBids.forEach(bid => {
      if (bid.lot && bid.lot.status === 'live') {
        if (!bidMap[bid.lot._id]) {
          bidMap[bid.lot._id] = bid;
        }
      }
    });
    const userActiveLots = Object.values(bidMap).map(b => b.lot);

    // 3. Get watchlist
    const user = await req.user.populate({
      path: 'auctionWatchlist',
      select: 'title currentBid status endDate images'
    });

    res.json({
      wonLots: enrichedWonLots,
      activeLots: userActiveLots,
      watchlist: user.auctionWatchlist || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// VENDOR: Get all lots submitted by this vendor
exports.getVendorLots = async (req, res) => {
  try {
    if (req.user.role !== 'vendor_active' && req.user.role !== 'auction_host') {
      return res.status(403).json({ message: 'Vendor or auction host access required' });
    }
    
    // Sort by newest first
    const lots = await AuctionLot.find({ vendor: req.user._id }).sort({ createdAt: -1 }).populate('winner', 'name email').lean();
    
    // Attach order shipping address if available
    for (let lot of lots) {
       if (lot.status === 'sold' && lot.paymentStatus === 'Paid') {
          const order = await Order.findOne({ 'orderItems.product': lot._id.toString() });
          if (order) {
             lot.shippingAddress = order.shippingAddress;
          }
       }
    }

    res.json(lots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Get all pending lots
exports.getAdminPendingLots = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const lots = await AuctionLot.find({ status: 'pending_approval' })
      .populate('vendor', 'name email storeName')
      .sort({ createdAt: -1 });
    res.json(lots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const closeAuctionInternal = async (lotId) => {
  const lot = await AuctionLot.findById(lotId);
  if (!lot) throw new Error('Lot not found');
  if (lot.status === 'sold' || lot.status === 'unsold') return lot; // Already closed

  // Find winning bid
  const winningBidDoc = await Bid.findOne({ lot: lot._id, isMaxBid: false }).sort({ amount: -1 }).populate('user');
  if (!winningBidDoc) {
    lot.status = 'unsold';
    await lot.save();
    return lot;
  }

  // Fetch fee settings
  let settings = await PlatformSettings.findOne();
  if (!settings) settings = await PlatformSettings.create({});

  const winningBid = winningBidDoc.amount;

  // Buyer-side charges
  const buyerPremiumPct = settings.buyerPremiumPct || 5;
  const buyerPremiumAmount = parseFloat(((winningBid * buyerPremiumPct) / 100).toFixed(2));
  const barChargePct = settings.barChargePct || 2;
  const barChargeAmount = parseFloat(((winningBid * barChargePct) / 100).toFixed(2));
  
  // Shipping will be determined at checkout, but we can set a placeholder
  const shippingCost = settings.shippingFee || 0;
  
  const vatPct = settings.vatPct || 15;
  const vatAmount = parseFloat(((winningBid * vatPct) / 100).toFixed(2));
  const totalPaidByBuyer = parseFloat((winningBid + buyerPremiumAmount + barChargeAmount + shippingCost).toFixed(2));

  // Vendor-side deductions
  const commissionPct = settings.auctionCommissionPct || 15;
  const commissionAmount = parseFloat(((winningBid * commissionPct) / 100).toFixed(2));
  const vendorPayable = parseFloat((winningBid - commissionAmount - vatAmount).toFixed(2));

  // GS Reference
  const year = new Date().getFullYear().toString().slice(-2);
  const seqNum = await getNextSequence('auctionPay');
  const gsReference = `GS-${year}-AUC-PAY-${seqNum.toString().padStart(6, '0')}`;
  
  const orderId = `ORD-${Date.now().toString().slice(-6)}`;
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  const paymentId = `PAY-${Date.now().toString().slice(-6)}`;

  lot.winningBid = winningBid;
  lot.winner = winningBidDoc.user._id;
  lot.status = 'sold';
  lot.buyerPremiumPct = buyerPremiumPct;
  lot.buyerPremiumAmount = buyerPremiumAmount;
  lot.barChargePct = barChargePct;
  lot.barChargeAmount = barChargeAmount;
  lot.shippingCost = shippingCost;
  lot.vatPct = vatPct;
  lot.vatAmount = vatAmount;
  lot.totalPaidByBuyer = totalPaidByBuyer;
  lot.commissionPct = commissionPct;
  lot.commissionAmount = commissionAmount;
  lot.vendorPayable = vendorPayable;
  lot.gsReference = gsReference;
  lot.paymentStatus = 'Pending'; // User must pay at checkout

  await lot.save();

  try {
    const { createInAppNotification } = require('./notificationController');
    createInAppNotification({
      recipient: winningBidDoc.user._id,
      recipientType: 'customer',
      title: `🏆 You Won Lot ${lot.lotNumber || ''}: ${lot.title}`,
      message: `Congratulations! You won "${lot.title}" with a hammer bid of R${winningBid.toLocaleString('en-ZA')}. Proceed to checkout to settle and secure vault delivery.`,
      type: 'auction',
      link: `/auction/${lot._id}?celebrate=true`,
      metadata: { lotId: lot._id, orderId }
    }).catch(err => console.error('Winner notification failed:', err));
  } catch (e) {
    console.error('Failed to create winner notification:', e);
  }

  // Check if an Order already exists for this lot to prevent duplicate ghost orders
  let order = await Order.findOne({ 'orderItems.product': lot._id.toString() });
  if (!order) {
    order = new Order({
      user: winningBidDoc.user._id,
      transactionId: gsReference,
      orderId,
      invoiceNumber,
      paymentId,
      orderItems: [{
        product: lot._id,
        vendorId: lot.vendor,
        name: `Auction Lot ${lot.lotNumber || ''}: ${lot.title}`,
        quantity: 1,
        price: winningBid,
        image: lot.images && lot.images.length > 0 ? lot.images[0] : ''
      }],
      shippingAddress: { address: 'Pending', city: 'Pending', postalCode: 'Pending', country: 'Pending' },
      paymentMethod: 'Pending',
      subTotal: winningBid,
      shippingCost: shippingCost,
      vatPct: vatPct,
      vatAmount: vatAmount,
      commissionPct: commissionPct,
      commissionAmount: commissionAmount,
      totalPrice: totalPaidByBuyer,
      vendorPayables: [{
        vendorId: lot.vendor,
        grossAmount: winningBid,
        commission: commissionAmount,
        vatDeducted: vatAmount,
        netPayable: vendorPayable,
        paid: false
      }],
      paymentStatus: 'Pending',
      isPaid: false
    });
    await order.save();

    // Create pending Transaction only if not exists
    const existingTx = await Transaction.findOne({ gsReference });
    if (!existingTx) {
      const transaction = new Transaction({
        gsReference,
        type: 'payment',
        module: 'auction',
        amount: totalPaidByBuyer,
        netAmount: totalPaidByBuyer,
        customer: winningBidDoc.user._id,
        vendor: lot.vendor,
        order: order._id,
        status: 'pending',
        description: `Auction Payment - Lot ${lot.lotNumber || ''}`
      });
      await transaction.save();
    }
  } else {
    // Keep lot's gsReference aligned with the existing order's transaction ID
    if (order.transactionId) {
      lot.gsReference = order.transactionId;
      if (order.isPaid || order.paymentStatus === 'Paid') {
        lot.paymentStatus = 'Paid';
      }
      await lot.save();
    }
  }

  // Create CPA Section 45 compliant double-entry trust ledger record
  try {
    const paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    let ledgerEntry = await AuctionLedger.findOne({ lot: lot._id });
    if (!ledgerEntry) {
      ledgerEntry = new AuctionLedger({
        lot: lot._id,
        transactionRef: gsReference,
        buyer: winningBidDoc.user._id,
        vendor: lot.vendor,
        hammerPrice: winningBid,
        buyerPremiumPct,
        buyerPremiumAmount,
        barChargeAmount,
        shippingCost,
        vatAmount,
        totalPaidByBuyer,
        sellerCommissionPct: commissionPct,
        sellerCommissionAmount: commissionAmount,
        vendorPayable,
        grandStoreGrossRevenue: parseFloat((buyerPremiumAmount + commissionAmount).toFixed(2)),
        paymentDeadline,
        settlementStatus: 'AWAITING_PAYMENT'
      });
      await ledgerEntry.save();
    }

    await logAuctionEvent({
      lotId: lot._id,
      userId: winningBidDoc.user._id,
      eventType: 'AUCTION_CLOSED_HAMMER',
      metadata: {
        winningBid,
        hammerPrice: winningBid,
        totalPaidByBuyer,
        gsReference,
        paymentDeadline
      }
    });
  } catch (ledgerErr) {
    console.error('Error recording auction ledger entry:', ledgerErr);
  }

  // Send email to winner with attached official PDF certificate
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://grandstoreglobal.com';
    const checkoutUrl = `${frontendUrl}/auction/checkout/${lot._id}`;
    const certDownloadUrl = `${process.env.PUBLIC_SITE_URL || frontendUrl}/api/auction/${lot._id}/certificate`;

    let certAttachment = null;
    try {
      const certBuffer = await generateAuctionCertificateBuffer(lot, winningBidDoc.user, order);
      if (certBuffer && certBuffer.length > 0) {
        certAttachment = {
          filename: `TheGrandStore_Certificate_of_Acquisition_Lot_${lot.lotNumber || 'Award'}.pdf`,
          content: certBuffer,
          contentType: 'application/pdf'
        };
      }
    } catch (certErr) {
      console.error('Failed to generate PDF certificate attachment for winner email:', certErr);
    }

    sendEmail({
      to: winningBidDoc.user.email,
      subject: `🏆 Official Certificate of Acquisition Awarded: ${lot.title} (Lot #${lot.lotNumber || ''})`,
      html: auctionWinTemplate(
        winningBidDoc.user.name,
        lot.title,
        lot.lotNumber || 'N/A',
        winningBid,
        checkoutUrl,
        {
          lotId: lot._id,
          certDownloadUrl,
          gsReference: lot.gsReference || order.transactionId,
          category: lot.category
        }
      ),
      attachments: certAttachment ? [certAttachment] : []
    }).then(() => {
      console.log(`[Auction Close] Certificate email successfully dispatched to winner: ${winningBidDoc.user.email}`);
    }).catch(err => console.error('Failed to send auction win email:', err));
  } catch (err) {
    console.error('Error preparing auction win email:', err);
  }

  return lot;
};

exports.closeAuctionInternal = closeAuctionInternal;

// ADMIN: Close auction manually
exports.closeAuction = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const lot = await closeAuctionInternal(req.params.id);
    res.json({ message: 'Auction closed and accounting calculated', lot });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUBLIC / USER / ADMIN: Download official PDF Certificate of Acquisition for a sold lot
exports.getAuctionLotCertificate = async (req, res) => {
  try {
    const lot = await AuctionLot.findById(req.params.id)
      .populate('winner', 'name legalFullName email bidderNumber')
      .populate('vendor', 'name storeName');

    if (!lot) {
      return res.status(404).json({ message: 'Auction lot not found' });
    }

    if (lot.status !== 'sold' || !lot.winner) {
      return res.status(400).json({ message: 'Certificate of Acquisition is only available for awarded sold lots.' });
    }

    const order = await Order.findOne({ 'orderItems.product': lot._id.toString() }).lean();

    const certBuffer = await generateAuctionCertificateBuffer(lot, lot.winner, order);
    const lotNum = lot.lotNumber || String(lot._id).slice(-6).toUpperCase();
    const filename = `TheGrandStore_Certificate_Lot_${lotNum}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', certBuffer.length);
    return res.send(certBuffer);
  } catch (error) {
    console.error('Error generating auction lot certificate download:', error);
    res.status(500).json({ message: 'Failed to generate Certificate of Acquisition', error: error.message });
  }
};

// USER: Prepare lot for payment
exports.payAuction = async (req, res) => {
  try {
    const lot = await AuctionLot.findById(req.params.id);
    if (!lot) return res.status(404).json({ message: 'Lot not found' });
    
    const winnerId = lot.winner ? (lot.winner._id ? lot.winner._id.toString() : lot.winner.toString()) : null;
    if (!winnerId || winnerId !== req.user._id.toString()) {
       return res.status(403).json({ message: 'Only the winner can checkout and settle this auction' });
    }
    
    if (lot.paymentStatus === 'Paid') {
       return res.status(400).json({ message: 'Lot already paid' });
    }

    const { shippingAddress, calculatedShipping, paymentMethod, proofUrl } = req.body;
    
    // Update shipping & total safely
    lot.shippingCost = calculatedShipping !== undefined ? (Number(calculatedShipping) || 0) : (lot.shippingCost || 0);
    const winBid = Number(lot.winningBid) || 0;
    const bPremium = Number(lot.buyerPremiumAmount) || 0;
    const bCharge = Number(lot.barChargeAmount) || 0;
    const vatAmt = Number(lot.vatAmount) || 0;
    lot.totalPaidByBuyer = winBid + bPremium + bCharge + vatAmt + lot.shippingCost;

    const isBankTransfer = paymentMethod === 'Bank Transfer' || paymentMethod === 'bank_transfer';
    const isAwaitingApproval = isBankTransfer && Boolean(proofUrl);

    lot.paymentStatus = isAwaitingApproval ? 'Awaiting_Approval' : 'Pending';
    if (proofUrl) {
      lot.proofUrl = proofUrl;
    }

    const safeShipping = {
      address: (shippingAddress && shippingAddress.address) ? String(shippingAddress.address).trim() : 'Pending Collection',
      city: (shippingAddress && shippingAddress.city) ? String(shippingAddress.city).trim() : 'Pending',
      postalCode: (shippingAddress && shippingAddress.postalCode) ? String(shippingAddress.postalCode).trim() : '0000',
      country: (shippingAddress && shippingAddress.country) ? String(shippingAddress.country).trim() : 'South Africa',
      phone: (shippingAddress && (shippingAddress.phone || shippingAddress.phoneNumber)) || req.user.phone || req.user.phoneNumber || '',
      phoneNumber: (shippingAddress && (shippingAddress.phoneNumber || shippingAddress.phone)) || req.user.phoneNumber || req.user.phone || ''
    };

    // Find or create associated Order
    let order = await Order.findOne({
      $or: [
        { 'orderItems.product': lot._id.toString() },
        { 'orderItems.product': lot._id },
        ...(lot.gsReference ? [{ transactionId: lot.gsReference }] : [])
      ]
    });

    if (!order) {
      const year = new Date().getFullYear().toString().slice(-2);
      const seqNum = await getNextSequence('auctionPay');
      const gsReference = `GS-${year}-AUC-PAY-${seqNum.toString().padStart(6, '0')}`;
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const paymentId = `PAY-${Date.now().toString().slice(-6)}`;

      order = new Order({
        user: lot.winner,
        transactionId: gsReference,
        orderId,
        invoiceNumber,
        paymentId,
        orderItems: [{
          product: lot._id.toString(),
          vendorId: lot.vendor,
          name: `Auction Lot ${lot.lotNumber || ''}: ${lot.title}`.trim(),
          category: 'Auction',
          quantity: 1,
          price: winBid,
          image: lot.images && lot.images.length > 0 ? lot.images[0] : ''
        }],
        shippingAddress: safeShipping,
        paymentMethod: isBankTransfer ? 'Bank Transfer' : 'PayFast',
        subTotal: winBid,
        shippingCost: lot.shippingCost,
        vatPct: lot.vatPct || 15,
        vatAmount: vatAmt,
        commissionPct: lot.commissionPct || 15,
        commissionAmount: lot.commissionAmount || 0,
        totalPrice: lot.totalPaidByBuyer,
        paymentStatus: isAwaitingApproval ? 'Awaiting_Approval' : 'Pending',
        proofUrl: proofUrl || ''
      });
    } else {
      order.shippingAddress = safeShipping;
      order.shippingCost = lot.shippingCost;
      order.totalPrice = lot.totalPaidByBuyer;
      order.paymentMethod = isBankTransfer ? 'Bank Transfer' : 'PayFast';
      if (isAwaitingApproval) {
        order.paymentStatus = 'Awaiting_Approval';
        order.proofUrl = proofUrl;
      }
    }

    await order.save();
    await lot.save();

    // Event sourcing if proof is uploaded
    if (proofUrl) {
      try {
        const CheckoutEngine = require('../services/CheckoutEngine');
        await CheckoutEngine.appendEvent(order._id.toString(), 'ProofOfPaymentUploaded', { proofUrl }, req.user._id);
      } catch (e) {
        console.warn('CheckoutEngine event error:', e.message);
      }
    }

    res.json({ 
      message: isAwaitingApproval 
        ? 'Bank transfer proof submitted. Awaiting admin verification.' 
        : 'Shipping saved, pending payment', 
      lot, 
      order 
    });
  } catch (error) {
    console.error('payAuction error:', error);
    res.status(500).json({ message: error.message || 'Server error', error: error.message });
  }
};

/**
 * Process the ledger transactions and wallet updates after a successful auction payment
 * This function will be called by the PayFast ITN Webhook Controller
 */
exports.processAuctionPayment = async (lotId) => {
  const lot = await AuctionLot.findById(lotId);
  if (!lot) throw new Error('Lot not found');
  if (lot.paymentStatus === 'Paid') return true;

  const order = await Order.findOne({ 'orderItems.product': lot._id });
  const transaction = order ? await Transaction.findOne({ order: order._id }) : null;

  lot.paymentStatus = 'Paid';

  if (order) {
    order.paymentStatus = 'Paid';
    order.isPaid = true;
    order.paidAt = new Date();
    await order.save();
  }

  if (transaction) {
    transaction.status = 'cleared';
    transaction.amount = lot.totalPaidByBuyer;
    transaction.netAmount = lot.totalPaidByBuyer - ((lot.totalPaidByBuyer * 2.5) / 100); // 2.5% mock gateway fee
    await transaction.save();
  }

  // Update vendor wallet (pending balance until delivered)
  if (lot.vendor) {
    let wallet = await Wallet.findOne({ vendorId: lot.vendor });
    if (!wallet) {
       wallet = new Wallet({ vendorId: lot.vendor });
    }
    wallet.pendingBalance += lot.vendorPayable;
    wallet.totalEarned += lot.vendorPayable;
    await wallet.save();
  }

  await lot.save();
  return true;
};

// Process Bidder VIP Refundable Deposit Payment (from PayFast ITN or Admin approval)
exports.processBidderDepositPayment = async (depositId, gatewayTransactionId) => {
  const BidderDeposit = require('../models/BidderDeposit');
  const deposit = await BidderDeposit.findById(depositId);
  if (!deposit) throw new Error('Deposit record not found');
  if (deposit.paymentStatus === 'paid') return true;

  deposit.paymentStatus = 'paid';
  if (gatewayTransactionId) {
    deposit.paymentReference = gatewayTransactionId;
  }
  await deposit.save();

  const settings = await PlatformSettings.findOne();
  const vipLimit = settings?.auctionPremiumBiddingLimit || 250000;

  const user = await User.findById(deposit.bidder);
  if (user) {
    user.bidderDepositStatus = 'paid';
    user.bidderDepositAmount = deposit.amount;
    user.bidderLevel = 'level_4_vip';
    user.biddingLimit = Math.max(user.biddingLimit || 0, vipLimit);
    await user.save();

    try {
      await createInAppNotification({
        recipient: user._id,
        recipientType: 'customer',
        title: '👑 VIP Bidding Privileges Activated!',
        message: `Your refundable deposit of R${deposit.amount.toLocaleString()} is confirmed. Your VIP bidding limit of R${vipLimit.toLocaleString()} is now active.`,
        type: 'auction',
        link: '/customer/auctions',
        metadata: { depositId: deposit._id, amount: deposit.amount, biddingLimit: vipLimit }
      });
    } catch (nErr) {
      console.error('Notification error on deposit confirmation:', nErr);
    }
  }
  return true;
};

// ADMIN: Get all lots (for admin financial view)
exports.getAllLots = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const lots = await AuctionLot.find().sort({ createdAt: -1 }).populate('vendor', 'name email storeName').populate('winner', 'name email').lean();
    
    // Attach order shipping address if available
    for (let lot of lots) {
       if (lot.status === 'sold' && lot.paymentStatus === 'Paid') {
          const order = await Order.findOne({ 'orderItems.product': lot._id.toString() });
          if (order) {
             lot.shippingAddress = order.shippingAddress;
          }
       }
    }
    
    res.json(lots);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==========================================
// BIDDER QUALIFICATION & KYC (PHASE 4)
// ==========================================

// CUSTOMER: Register and complete 18+ age / KYC verification (Requires Admin Approval)
exports.registerBidder = async (req, res) => {
  try {
    const { 
      fullName,
      legalFullName,
      legalName,
      dateOfBirth, 
      dob,
      idType, 
      idNumber, 
      idDocumentUrl, 
      proofOfResidenceUrl,
      customKycValues,
      acceptRulesVersion,
      tier = 'normal', // 'normal' | 'premium'
      bankAccountDetails,
      depositPaymentMethod = 'payfast',
      depositProofUrl
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Dynamic Platform Settings for Age & Requirements
    const settings = await PlatformSettings.findOne();
    const minAge = settings?.bidderKycMinAge || 18;

    const effectiveDob = dateOfBirth || dob;
    if (!effectiveDob) {
      return res.status(400).json({ message: `Date of birth is required for legal ${minAge}+ age verification.` });
    }

    const birthDate = new Date(effectiveDob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < minAge) {
      return res.status(403).json({ message: `You must be at least ${minAge} years of age to participate in alcohol auctions.` });
    }

    if (settings?.bidderKycRequireDocumentUpload && !idDocumentUrl) {
      return res.status(400).json({ message: 'Identification document upload (Passport or ID) is required for legal qualification.' });
    }

    const effectiveRulesVersion = acceptRulesVersion || 'v1.0';

    user.legalFullName = legalFullName || fullName || legalName || user.name;
    user.dateOfBirth = birthDate;
    user.idType = idType || 'National ID';
    user.idNumber = idNumber || '';
    if (idDocumentUrl) user.idDocumentUrl = idDocumentUrl;
    if (proofOfResidenceUrl) user.proofOfResidenceUrl = proofOfResidenceUrl;
    if (customKycValues) {
      user.customKycValues = typeof customKycValues === 'string' ? JSON.parse(customKycValues) : customKycValues;
    }
    user.rulesAcceptedVersion = acceptRulesVersion || 'v1.0';
    user.rulesAcceptedAt = new Date();

    // Strict Admin Approval Pipeline: applicant is set to pending_approval with 0 limit until verified
    user.bidderApprovalStatus = 'pending_approval';
    user.bidderLevel = 'level_1_registered';
    user.biddingLimit = 0;
    user.kycVerified = false;
    user.auctionRegistered = true;

    if (!user.bidderNumber) {
      user.bidderNumber = `GS-B${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const dynamicDepositFee = settings?.auctionPremiumDepositAmount !== undefined ? settings.auctionPremiumDepositAmount : 5000;

    let createdDeposit = null;

    if (tier === 'premium') {
      user.bidderDepositRequired = true;
      user.bidderDepositAmount = dynamicDepositFee;
      user.bidderDepositStatus = 'pending';

      const depositRef = `DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      let parsedBankDetails = bankAccountDetails;
      if (typeof bankAccountDetails === 'string') {
        try { parsedBankDetails = JSON.parse(bankAccountDetails); } catch (e) {}
      }

      if (parsedBankDetails && parsedBankDetails.bankName) {
        user.bankAccountDetails = { ...parsedBankDetails, updatedAt: new Date() };
      }

      createdDeposit = new BidderDeposit({
        bidder: user._id,
        amount: dynamicDepositFee,
        tier: 'premium',
        paymentMethod: depositPaymentMethod === 'eft' ? 'eft' : 'payfast',
        paymentStatus: 'pending',
        paymentReference: depositRef,
        proofOfPayment: depositProofUrl || '',
        bankAccountDetails: parsedBankDetails
      });

      await createdDeposit.save();
    } else {
      user.bidderDepositRequired = false;
      user.bidderDepositAmount = 0;
      user.bidderDepositStatus = 'none';
    }

    await user.save();

    await logAuctionEvent({
      userId: user._id,
      eventType: 'AUTHENTICATION_STATUS_CHANGED',
      details: { 
        action: 'BIDDER_APPLICATION_SUBMITTED',
        tier,
        depositRequired: user.bidderDepositRequired,
        depositAmount: user.bidderDepositAmount,
        bidderApprovalStatus: 'pending_approval', 
        bidderNumber: user.bidderNumber 
      },
      ipAddress: req.ip
    });

    try {
      // Notify customer
      await createInAppNotification({
        recipient: user._id,
        recipientType: 'customer',
        title: tier === 'premium' ? '👑 VIP Bidder Registration Submitted' : '📋 18+ Bidder Application Submitted',
        message: tier === 'premium'
          ? `Your 18+ verification and Premium VIP Bidding application (R${dynamicDepositFee.toLocaleString()} refundable deposit) have been submitted for Administrator review.`
          : 'Your 18+ bidder verification has been submitted for standard administrator approval.',
        type: 'auction',
        link: '/customer/auctions',
        metadata: { tier, bidderNumber: user.bidderNumber }
      });

      // Notify all administrators
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const adm of admins) {
        await createInAppNotification({
          recipient: adm._id,
          recipientType: 'admin',
          title: '📋 New Bidder Verification Application',
          message: `${user.name} submitted an 18+ bidder application (${tier.toUpperCase()}). Please review their documents.`,
          type: 'auction',
          link: '/admin/auctions',
          metadata: { applicantId: user._id, tier }
        });
      }
    } catch (notifErr) {
      console.error('Error creating registration notifications:', notifErr);
    }

    res.json({
      message: tier === 'premium'
        ? `Your ${minAge}+ verification and Premium VIP Bidding request (R${dynamicDepositFee.toLocaleString()} refundable deposit) have been submitted for administrator review.`
        : `Your ${minAge}+ bidder verification has been submitted for standard administrator approval.`,
      status: 'pending_approval',
      tier,
      deposit: createdDeposit,
      depositReference: createdDeposit?.paymentReference || null,
      escrowBank: settings?.bankDetails,
      bankDetailsList: settings?.bankDetailsList,
      bidder: {
        bidderApprovalStatus: user.bidderApprovalStatus,
        bidderLevel: user.bidderLevel,
        biddingLimit: user.biddingLimit,
        bidderNumber: user.bidderNumber,
        bidderReliabilityScore: user.bidderReliabilityScore,
        legalFullName: user.legalFullName,
        idType: user.idType,
        idNumber: user.idNumber,
        idDocumentUrl: user.idDocumentUrl,
        proofOfResidenceUrl: user.proofOfResidenceUrl,
        customKycValues: user.customKycValues
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CUSTOMER: Get bidder verification status & limit
exports.getBidderStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'bidderApprovalStatus bidderRejectionReason bidderLevel biddingLimit bidderNumber bidderReliabilityScore isBiddingSuspended biddingSuspensionReason rulesAcceptedVersion idType idNumber dateOfBirth idDocumentUrl proofOfResidenceUrl legalFullName customKycValues bidderDepositStatus bidderDepositAmount bankAccountDetails'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    let bankAccountDetails = user.bankAccountDetails || null;
    if (!bankAccountDetails?.accountNumber) {
      const deposit = await BidderDeposit.findOne({ 
        bidder: req.user._id, 
        'bankAccountDetails.accountNumber': { $exists: true, $ne: '' } 
      }).sort({ createdAt: -1 });
      if (deposit?.bankAccountDetails) {
        bankAccountDetails = deposit.bankAccountDetails;
      }
    }

    // Also get active platform settings for escrow bank
    const settings = await PlatformSettings.findOne();

    res.json({
      bidderApprovalStatus: user.bidderApprovalStatus || 'unregistered',
      bidderRejectionReason: user.bidderRejectionReason || null,
      bidderLevel: user.bidderLevel || 'level_1_registered',
      biddingLimit: user.biddingLimit || 0,
      bidderNumber: user.bidderNumber || null,
      bidderReliabilityScore: user.bidderReliabilityScore || 100,
      isBiddingSuspended: user.isBiddingSuspended || false,
      biddingSuspensionReason: user.biddingSuspensionReason || null,
      isVerified: user.bidderApprovalStatus === 'approved',
      isPending: user.bidderApprovalStatus === 'pending_approval',
      bidderDepositStatus: user.bidderDepositStatus || 'none',
      bidderDepositAmount: user.bidderDepositAmount || 0,
      idType: user.idType,
      idNumber: user.idNumber,
      dateOfBirth: user.dateOfBirth,
      idDocumentUrl: user.idDocumentUrl,
      proofOfResidenceUrl: user.proofOfResidenceUrl,
      legalFullName: user.legalFullName || null,
      customKycValues: user.customKycValues || {},
      bankAccountDetails: bankAccountDetails || null,
      escrowBank: settings?.bankDetails || null,
      bankDetailsList: settings?.bankDetailsList || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==========================================
// ADMIN BIDDER APPROVALS & KYC MANAGEMENT
// ==========================================

// ADMIN: Get all bidder applicants
exports.getAdminBidders = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bidders = await User.find({
      $or: [
        { bidderApprovalStatus: { $in: ['pending_approval', 'approved', 'rejected'] } },
        { auctionRegistered: true }
      ]
    })
    .select('name email phone role bidderApprovalStatus bidderRejectionReason bidderApprovedAt bidderApprovedBy bidderLevel biddingLimit bidderNumber bidderReliabilityScore isBiddingSuspended biddingSuspensionReason dateOfBirth idType idNumber idDocumentUrl proofOfResidenceUrl legalFullName customKycValues rulesAcceptedVersion rulesAcceptedAt bidderDepositStatus bidderDepositAmount createdAt')
    .sort({ createdAt: -1 });

    res.json(bidders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Approve a bidder application
exports.approveBidder = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { bidderLevel = 'level_2_verified', biddingLimit = 25000, notes } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bidderApprovalStatus = 'approved';
    user.kycVerified = true;
    user.isAgeVerified = true;
    user.bidderLevel = bidderLevel;
    user.biddingLimit = Number(biddingLimit) || 25000;
    user.bidderApprovedAt = new Date();
    user.bidderApprovedBy = req.user._id;
    user.isBiddingSuspended = false;
    user.bidderRejectionReason = undefined;

    if (!user.bidderNumber) {
      user.bidderNumber = `GS-B${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await user.save();

    await logAuctionEvent({
      userId: user._id,
      eventType: 'ADMIN_OVERRIDE',
      details: { 
        action: 'BIDDER_APPROVED', 
        approvedBy: req.user._id,
        bidderLevel: user.bidderLevel,
        biddingLimit: user.biddingLimit,
        bidderNumber: user.bidderNumber,
        notes
      },
      ipAddress: req.ip
    });

    try {
      await createInAppNotification({
        recipient: user._id,
        recipientType: 'customer',
        title: '✅ 18+ Bidder Verification Approved!',
        message: `Your auction registration has been approved by the Administrator. Assigned Bidder #${user.bidderNumber} with an approved bidding limit of R${user.biddingLimit.toLocaleString()}.`,
        type: 'auction',
        link: '/customer/auctions',
        metadata: { bidderNumber: user.bidderNumber, biddingLimit: user.biddingLimit }
      });
    } catch (notifErr) {
      console.error('Error sending bidder approval notification:', notifErr);
    }

    res.json({ 
      message: `Bidder ${user.name} approved successfully with limit R${user.biddingLimit.toLocaleString()}`, 
      user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Reject a bidder application
exports.rejectBidder = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { reason = 'Identity documents or age verification could not be validated.' } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bidderApprovalStatus = 'rejected';
    user.bidderRejectionReason = reason;
    user.kycVerified = false;
    user.bidderLevel = 'level_1_registered';
    user.biddingLimit = 0;

    await user.save();

    await logAuctionEvent({
      userId: user._id,
      eventType: 'ADMIN_OVERRIDE',
      details: { action: 'BIDDER_REJECTED', rejectedBy: req.user._id, reason },
      ipAddress: req.ip
    });

    try {
      await createInAppNotification({
        recipient: user._id,
        recipientType: 'customer',
        title: '⚠️ Bidder Application Rejected',
        message: `Your bidder verification application was not approved. Reason: ${reason}. Please update your documents or contact concierge.`,
        type: 'auction',
        link: '/customer/auctions',
        metadata: { reason }
      });
    } catch (notifErr) {
      console.error('Error sending bidder rejection notification:', notifErr);
    }

    res.json({ message: `Bidder application for ${user.name} has been rejected.`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Update bidder limit or toggle suspension
exports.updateBidderLimit = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { biddingLimit, isBiddingSuspended, suspensionReason, bidderLevel } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (biddingLimit !== undefined) user.biddingLimit = Number(biddingLimit);
    if (bidderLevel !== undefined) user.bidderLevel = bidderLevel;
    if (isBiddingSuspended !== undefined) {
      user.isBiddingSuspended = Boolean(isBiddingSuspended);
      if (user.isBiddingSuspended && suspensionReason) {
        user.biddingSuspensionReason = suspensionReason;
      } else if (!user.isBiddingSuspended) {
        user.biddingSuspensionReason = undefined;
      }
    }

    await user.save();

    await logAuctionEvent({
      userId: user._id,
      eventType: 'ADMIN_OVERRIDE',
      details: { 
        action: 'BIDDER_LIMIT_UPDATED', 
        updatedBy: req.user._id, 
        biddingLimit: user.biddingLimit, 
        isBiddingSuspended: user.isBiddingSuspended 
      },
      ipAddress: req.ip
    });

    try {
      await createInAppNotification({
        recipient: user._id,
        recipientType: 'customer',
        title: user.isBiddingSuspended ? '⚠️ Bidding Privileges Suspended' : '📈 Bidding Limit Updated',
        message: user.isBiddingSuspended 
          ? `Your bidding privileges have been suspended. Reason: ${suspensionReason || 'Administrative review'}.`
          : `Your bidding limit has been updated to R${user.biddingLimit.toLocaleString()} by the Administrator.`,
        type: 'auction',
        link: '/customer/auctions',
        metadata: { biddingLimit: user.biddingLimit, isBiddingSuspended: user.isBiddingSuspended }
      });
    } catch (notifErr) {
      console.error('Error sending limit update notification:', notifErr);
    }

    res.json({ message: `Bidder settings updated for ${user.name}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==========================================
// BIDDER DEPOSITS (SECTION 19)
// ==========================================

// CUSTOMER: Submit a Refundable Bidding Deposit (PayFast or EFT)
exports.createBidderDeposit = async (req, res) => {
  try {
    const { amount, paymentMethod = 'payfast', proofOfPayment, lotId, bankAccountDetails, tier = 'premium' } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch dynamic deposit amount from platform settings
    const settings = await PlatformSettings.findOne();
    const dynamicDeposit = settings?.auctionPremiumDepositAmount !== undefined ? settings.auctionPremiumDepositAmount : 5000;
    const depositAmount = Number(amount) || dynamicDeposit;

    const depositRef = `DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let parsedBankDetails = bankAccountDetails;
    if (typeof bankAccountDetails === 'string') {
      try { parsedBankDetails = JSON.parse(bankAccountDetails); } catch (e) {}
    }

    const deposit = new BidderDeposit({
      bidder: user._id,
      lot: lotId || undefined,
      amount: depositAmount,
      tier: tier || 'premium',
      paymentMethod,
      paymentStatus: 'pending',
      paymentReference: depositRef,
      proofOfPayment: proofOfPayment || (req.file ? req.file.path : undefined),
      bankAccountDetails: parsedBankDetails
    });

    await deposit.save();

    if (parsedBankDetails && parsedBankDetails.bankName) {
      user.bankAccountDetails = { ...parsedBankDetails, updatedAt: new Date() };
    }

    user.bidderDepositRequired = true;
    user.bidderDepositStatus = 'pending';
    user.bidderDepositAmount = deposit.amount;
    await user.save();

    try {
      // Notify customer
      await createInAppNotification({
        recipient: user._id,
        recipientType: 'customer',
        title: deposit.paymentMethod === 'eft' 
          ? '📄 EFT Deposit Statement Submitted for Audit'
          : '💳 VIP Guarantee Deposit Initiated',
        message: deposit.paymentMethod === 'eft'
          ? `Your EFT payment proof for R${deposit.amount.toLocaleString()} (Ref: ${depositRef}) has been received and queued for Administrator audit. Your VIP privileges will activate once verified.`
          : `Your VIP deposit of R${deposit.amount.toLocaleString()} has been initiated. Complete payment via PayFast to activate VIP bidding.`,
        type: 'auction',
        link: '/auction/vip-checkout',
        metadata: { depositId: deposit._id, amount: deposit.amount, paymentReference: depositRef, method: deposit.paymentMethod }
      });

      // If EFT, notify admins that an audit is waiting
      if (deposit.paymentMethod === 'eft') {
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const adm of admins) {
          await createInAppNotification({
            recipient: adm._id,
            recipientType: 'admin',
            title: '🛡️ New EFT Bidder Deposit Proof Received',
            message: `${user.name} submitted an EFT statement/proof for R${deposit.amount.toLocaleString()} (${depositRef}). Please verify in the Auction Admin panel.`,
            type: 'auction',
            link: '/admin/auctions',
            metadata: { depositId: deposit._id, bidderId: user._id, amount: deposit.amount }
          });
        }
      }
    } catch (notifErr) {
      console.error('Error sending deposit creation notification:', notifErr);
    }

    res.status(201).json({
      message: `Refundable bidding deposit of R${deposit.amount.toLocaleString()} initiated successfully. Awaiting verification.`,
      deposit,
      depositReference: depositRef,
      escrowBank: settings?.bankDetails || null,
      bankDetailsList: settings?.bankDetailsList || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Get all bidder deposits
exports.getAdminDeposits = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const deposits = await BidderDeposit.find()
      .populate('bidder', 'name email phone bidderNumber')
      .populate('lot', 'title lotNumber')
      .sort({ createdAt: -1 });

    res.json(deposits);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Verify / Refund a bidder deposit
exports.verifyAdminDeposit = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { action, notes } = req.body; // action: 'verify_paid' | 'refund' | 'forfeit'

    const deposit = await BidderDeposit.findById(id).populate('bidder');
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });

    const settings = await PlatformSettings.findOne();
    const premiumLimit = settings?.auctionPremiumBiddingLimit || 250000;
    const standardLimit = settings?.auctionStandardBiddingLimit || 25000;

    if (action === 'verify_paid') {
      deposit.paymentStatus = 'paid';
      deposit.verifiedBy = req.user._id;
      deposit.verifiedAt = new Date();
      deposit.adminNotes = notes || 'Verified by administrator';
      await deposit.save();

      // Upgrade bidder to Level 3 Enhanced / VIP with dynamic limit
      if (deposit.bidder) {
        const bidder = await User.findById(deposit.bidder._id);
        if (bidder) {
          bidder.bidderDepositStatus = 'paid';
          bidder.bidderApprovalStatus = 'approved';
          bidder.kycVerified = true;
          bidder.bidderLevel = 'level_3_enhanced';
          bidder.biddingLimit = Math.max(bidder.biddingLimit || 0, premiumLimit);
          await bidder.save();

          try {
            await createInAppNotification({
              recipient: bidder._id,
              recipientType: 'customer',
              title: '👑 VIP Bidding Privileges Activated!',
              message: `Your EFT bank statement of R${deposit.amount.toLocaleString()} has been verified and approved by the Administrator. Your VIP bidding ceiling of R${premiumLimit.toLocaleString()} is now active!`,
              type: 'auction',
              link: '/customer/auctions',
              metadata: { depositId: deposit._id, amount: deposit.amount, biddingLimit: premiumLimit, status: 'paid' }
            });
          } catch (notifErr) {
            console.error('Error notifying bidder of deposit approval:', notifErr);
          }
        }
      }
    } else if (action === 'refund') {
      deposit.paymentStatus = 'refunded';
      deposit.refundStatus = 'refunded';
      deposit.refundedAt = new Date();
      deposit.adminNotes = notes || 'Refund issued to customer bank account by administrator';
      await deposit.save();

      if (deposit.bidder) {
        const bidder = await User.findById(deposit.bidder._id);
        if (bidder) {
          bidder.bidderDepositStatus = 'refunded';
          bidder.biddingLimit = standardLimit;
          bidder.bidderLevel = 'level_2_verified';
          await bidder.save();

          try {
            await createInAppNotification({
              recipient: bidder._id,
              recipientType: 'customer',
              title: '💸 VIP Deposit Refund Processed',
              message: `Your refundable deposit of R${deposit.amount.toLocaleString()} has been processed for refund to your registered bank account (${deposit.bankAccountDetails?.bankName || 'bank account'}). Standard bidding limit is active.`,
              type: 'auction',
              link: '/customer/bank-details',
              metadata: { depositId: deposit._id, amount: deposit.amount, status: 'refunded' }
            });
          } catch (notifErr) {
            console.error('Error notifying bidder of deposit refund:', notifErr);
          }
        }
      }
    }

    res.json({ message: `Deposit updated (${action})`, deposit });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==========================================
// LOT AUTHENTICATION & CUSTODY PIPELINE (PHASE 3)
// ==========================================

// ADMIN: Update lot authentication & custody status
exports.updateLotAuthentication = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { authenticationStatus, authenticationNotes, custodyLocation, approvedToAuction } = req.body;

    const lot = await AuctionLot.findById(id);
    if (!lot) return res.status(404).json({ message: 'Lot not found' });

    if (authenticationStatus) lot.authenticationStatus = authenticationStatus;
    if (authenticationNotes) lot.authenticationNotes = authenticationNotes;
    if (custodyLocation) lot.custodyLocation = custodyLocation;
    lot.authenticatedBy = req.user._id;
    lot.authenticatedAt = new Date();

    if (approvedToAuction === true && lot.status === 'pending_approval') {
      lot.status = 'upcoming';
    }

    await lot.save();

    await logAuctionEvent({
      lotId: lot._id,
      userId: req.user._id,
      eventType: 'AUTHENTICATION_STATUS_CHANGED',
      details: { authenticationStatus, custodyLocation, approvedToAuction },
      ipAddress: req.ip
    });

    res.json({ message: 'Lot authentication updated successfully', lot });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==========================================
// FRAUD & INTEGRITY ALERTS (PHASE 7)
// ==========================================

// ADMIN: Get active fraud alerts
exports.getAuctionFraudAlerts = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const alerts = await AuctionFraudAlert.find()
      .populate('lot', 'title lotNumber currentBid')
      .populate('bidder', 'name email bidderNumber')
      .populate('vendor', 'name email storeName')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Resolve fraud alert
exports.resolveFraudAlert = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const { status, resolutionNotes, suspendBidder } = req.body;

    const alert = await AuctionFraudAlert.findById(id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    alert.status = status || 'ACTION_TAKEN';
    alert.resolutionNotes = resolutionNotes || '';
    alert.resolvedBy = req.user._id;
    await alert.save();

    if (suspendBidder && alert.bidder) {
      await User.findByIdAndUpdate(alert.bidder, {
        isBiddingSuspended: true,
        biddingSuspensionReason: resolutionNotes || 'Fraud prevention suspension'
      });
    }

    res.json({ message: 'Alert updated successfully', alert });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==========================================
// AUCTION LEDGER (PHASE 10)
// ==========================================

// ADMIN: Get auction double-entry ledger entries
exports.getAuctionLedger = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const ledger = await AuctionLedger.find()
      .populate('lot', 'title lotNumber')
      .populate('buyer', 'name email')
      .populate('vendor', 'name email storeName')
      .sort({ createdAt: -1 });

    res.json(ledger);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

