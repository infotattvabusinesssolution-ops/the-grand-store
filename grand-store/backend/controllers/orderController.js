const Order = require('../models/Order');
const Product = require('../models/Product');
const SystemCode = require('../models/SystemCode');
const PlatformSettings = require('../models/PlatformSettings');
const { getNextSequence } = require('../utils/sequenceGenerator');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');

// @desc    Create new order (Pending Payment)
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  try {
    const { quote, shippingAddress, paymentMethod, isGift, giftRecipientName, giftMessage } = req.body;

    if (!quote || !quote.shipments || quote.shipments.length === 0) {
      return res.status(400).json({ message: 'Valid quote with shipments is required' });
    }

    const isPostnetCollection = req.body.deliveryPreference === 'postnet' ||
      quote.shipments.some((shp) => shp.selectedCourier?.deliveryType === 'pickup' || (shp.selectedCourier?.serviceLevel || '').toLowerCase().includes('collection'));

    if (isPostnetCollection && quote.shipments.some((shp) => !shp.selectedPickupStore)) {
      return res.status(400).json({ message: 'A PostNet branch must be selected for PostNet store collection' });
    }
    
    // Check expiration
    if (new Date(quote.expiresAt) < new Date()) {
       return res.status(400).json({ message: 'Quote has expired. Please refresh the quote.' });
    }

    // Fetch fee settings from DB for GS Commission
    let settings = await PlatformSettings.findOne();
    if (!settings) settings = await PlatformSettings.create({});

    // Fetch module code for Shop
    const shopCodeDoc = await SystemCode.findOne({ code: 'SHP' });
    const moduleCode = shopCodeDoc ? shopCodeDoc.code : 'SHP';

    // Generate atomic sequence
    const year = new Date().getFullYear().toString().slice(-2);
    const seqNum = await getNextSequence('shopOrder');
    const sequence = seqNum.toString().padStart(6, '0');

    const transactionId = `GS-${year}-${moduleCode}-TXN-${sequence}`;
    const orderId = `GS-${year}-${moduleCode}-ORD-${sequence}`;
    const paymentId = `GS-${year}-${moduleCode}-PAY-${sequence}`;
    const invoiceNumber = `GS-${year}-${moduleCode}-INV-${sequence}`;

    const commissionPct = settings.marketplaceCommissionPct || 15;
    const gatewayFeePct = settings.gatewayFeePct || 2.5;

    // === RECONSTRUCT ACCOUNTING FROM QUOTE ===
    const subTotal = Number(quote.globalSubtotal || quote.subTotal || 0);
    const shippingCost = Number(quote.aggregatedTotals?.shipping || quote.shippingCost || 0);
    const vatAmount = Number(quote.aggregatedTotals?.vat || quote.vatAmount || 0);
    const importDuties = Number(quote.aggregatedTotals?.estimatedImportDuties || quote.importDuties || 0);
    const importTaxes = Number(quote.aggregatedTotals?.estimatedImportTaxes || quote.importTaxes || 0);
    const customsFees = Number(quote.aggregatedTotals?.estimatedCustomsFees || quote.customsFees || 0);
    
    const calculatedTotal = parseFloat((subTotal + shippingCost).toFixed(2));
    const commissionAmount = parseFloat(((subTotal * commissionPct) / 100).toFixed(2));
    const gatewayFeeAmount = parseFloat((calculatedTotal * gatewayFeePct / 100).toFixed(2));

    // Calculate Referral/Rewards discounts
    const crypto = require('crypto');
    const isGuest = !req.user || Boolean(req.body.isGuest);
    const guestEmail = (req.body.guestEmail || shippingAddress?.email || '').trim().toLowerCase();
    const guestName = (req.body.guestName || shippingAddress?.name || shippingAddress?.fullName || 'Guest Customer').trim();
    const guestPhone = (req.body.guestPhone || shippingAddress?.phone || shippingAddress?.phoneNumber || '').trim();
    const guestAccessToken = isGuest ? crypto.randomBytes(24).toString('hex') : null;
    const isAgeConfirmed = req.body.isAgeConfirmed !== undefined ? Boolean(req.body.isAgeConfirmed) : true;
    // Guest 18+ KYC and Document Verification (Optional / Preserved if provided)
    const guestKycData = req.body.guestKyc || {};
    const guestDob = guestKycData.dateOfBirth || guestKycData.dob || req.body.dateOfBirth || req.body.dob;
    const guestIdNumber = (guestKycData.idNumber || req.body.idNumber || '').trim();
    const guestIdType = guestKycData.idType || req.body.idType || 'national_id';
    const guestDocUrl = (guestKycData.documentUrl || req.body.documentUrl || req.body.idDocumentUrl || '').trim();
    let guestBirthDate = guestDob ? new Date(guestDob) : null;

    /*
    ========================================================================================
    [COMMENTED OUT FOR NOW - 18+ DOCUMENT VERIFICATION IS ONLY REQUIRED FOR AUCTIONS, NOT NORMAL CHECKOUT]
    ========================================================================================
    if (!isAgeConfirmed) {
      return res.status(400).json({ message: '18+ age verification is legally required to purchase alcoholic products.' });
    }
    if (isGuest) {
      if (!guestDocUrl) {
        return res.status(400).json({
          message: 'Legal identification document upload (National ID, Passport, or Driver\'s License) is required for guest checkout.'
        });
      }
      if (!guestDob) {
        return res.status(400).json({
          message: 'Date of birth is required for 18+ age verification.'
        });
      }
      guestBirthDate = new Date(guestDob);
      if (isNaN(guestBirthDate.getTime())) {
        return res.status(400).json({ message: 'Valid date of birth is required for 18+ age verification.' });
      }
      const today = new Date();
      let age = today.getFullYear() - guestBirthDate.getFullYear();
      const m = today.getMonth() - guestBirthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < guestBirthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        return res.status(403).json({
          message: 'You must be at least 18 years of age to purchase products on The Grand Store.'
        });
      }
    }
    ========================================================================================
    */

    const User = require('../models/User');
    const user = req.user ? await User.findById(req.user._id) : null;
    const previousOrders = user ? await Order.countDocuments({ user: user._id }) : 0;

    // If authenticated user also attached KYC document during checkout, update profile
    if (user && (guestDocUrl || req.body.idDocumentUrl)) {
      user.idDocumentUrl = guestDocUrl || req.body.idDocumentUrl;
      if (guestIdType) user.idType = guestIdType;
      if (guestIdNumber) user.idNumber = guestIdNumber;
      if (guestDob) user.dateOfBirth = guestBirthDate || new Date(guestDob);
      if (user.bidderApprovalStatus === 'approved') {
        user.isAgeVerified = true;
      } else {
        user.isAgeVerified = false;
        user.bidderApprovalStatus = 'pending_approval';
      }
      await user.save().catch(err => console.warn('Error saving user KYC from checkout:', err.message));
    }

    let appliedWelcomeDiscount = 0;
    // Refer & earn rewards the referrer who shared the link unless welcome discount is explicitly enabled
    if (settings && settings.referralWelcomeDiscountEnabled && (settings.referralWelcomeDiscount || 0) > 0 && previousOrders === 0 && user && user.referredBy) {
        if (settings.referralWelcomeDiscountType === 'percentage') {
            appliedWelcomeDiscount = parseFloat(((subTotal * (settings.referralWelcomeDiscount || 5)) / 100).toFixed(2));
        } else {
            appliedWelcomeDiscount = settings.referralWelcomeDiscount || 50;
        }
    }

    let appliedRewards = 0;
    if (req.body.applyRewards && user && user.rewardBalance > 0) {
        // Can only apply up to the order total
        appliedRewards = Math.min(user.rewardBalance, calculatedTotal - appliedWelcomeDiscount);
        user.rewardBalance -= appliedRewards;
        await user.save();
    }

    // === SUPER COINS MARGIN-PROTECTION REDEMPTION ===
    const SuperCoinEngine = require('../engines/superCoinEngine');
    const SuperCoinLedger = require('../models/SuperCoinLedger');

    let superCoinsUsed = 0;
    let superCoinsDiscount = 0;
    let superCoinsEarned = 0;

    if (req.body.useSuperCoins && user && (user.superCoinsBalance || 0) > 0) {
      const redemptionCheck = SuperCoinEngine.calculateAllowedRedemption({
        userCoins: user.superCoinsBalance || 0,
        eligibleSubtotal: subTotal,
        shippingCost,
        commissionPct,
        gatewayFeePct,
        settings
      });

      superCoinsUsed = redemptionCheck.maxRedeemableCoins;
      superCoinsDiscount = redemptionCheck.maxDiscountRand;

      user.superCoinsBalance = Math.max(0, (user.superCoinsBalance || 0) - superCoinsUsed);
      await user.save();
    }

    // Calculate potential coins earned on eligible product subtotal
    superCoinsEarned = SuperCoinEngine.calculateEarnedCoins(subTotal, settings);
    if (superCoinsEarned > 0 && user) {
      user.pendingSuperCoins = (user.pendingSuperCoins || 0) + superCoinsEarned;
      await user.save();
    }

    if (shippingAddress && (shippingAddress.phone || shippingAddress.phoneNumber) && user && !user.phone) {
      user.phone = (shippingAddress.phone || shippingAddress.phoneNumber).trim();
      user.phoneNumber = user.phone;
      await user.save();
    }

    // If user registered via phone (has auto-generated placeholder email), update account to their real email from checkout
    const isAutoPlaceholderEmail = !user?.email || /^customer_.*@grandstore\.co\.za$/i.test(user.email);
    if (user && isAutoPlaceholderEmail && shippingAddress?.email) {
      const checkoutEmail = String(shippingAddress.email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(checkoutEmail)) {
        const emailTaken = await User.findOne({ email: checkoutEmail, _id: { $ne: user._id } });
        if (!emailTaken) {
          user.email = checkoutEmail;
          await user.save();
        }
      }
    }

    const finalTotal = parseFloat(Math.max(0, calculatedTotal - appliedWelcomeDiscount - appliedRewards - superCoinsDiscount).toFixed(2));

    let allOrderItems = [];
    let vendorPayables = [];

    const selectedPickupStore = req.body.selectedPostnetStore || quote.shipments?.find(s => s.selectedPickupStore)?.selectedPickupStore || null;
    const deliveryPreference = req.body.deliveryPreference || (selectedPickupStore ? 'postnet' : 'home');

    // Create the master order with isPaid: false
    const order = new Order({
      user: user ? user._id : null,
      isGuest: isGuest,
      guestInfo: isGuest ? { name: guestName, email: guestEmail, phone: guestPhone } : undefined,
      guestAccessToken: isGuest ? guestAccessToken : undefined,
      isAgeConfirmed: isAgeConfirmed,
      guestKyc: isGuest ? {
        idType: guestIdType,
        idNumber: guestIdNumber,
        dateOfBirth: guestBirthDate,
        documentUrl: guestDocUrl,
        documentType: guestKycData.documentType || '',
        status: 'pending_review',
        submittedAt: new Date()
      } : {
        status: 'not_required'
      },
      ageVerification: {
        isVerified: true,
        verifiedVia: isGuest ? 'guest_document' : (user?.kycVerified ? 'account_kyc' : (guestDocUrl ? 'guest_document' : 'self_declaration')),
        confirmedAt: new Date()
      },
      shippingAddress,
      deliveryPreference,
      selectedPostnetStore: selectedPickupStore,
      paymentMethod,
      isGift: isGift || false,
      giftRecipientName: giftRecipientName || "",
      giftMessage: giftMessage || "",
      subTotal,
      shippingCost,
      vatAmount,
      importDuties,
      importTaxes,
      customsFees,
      commissionPct,
      commissionAmount,
      gatewayFeePct,
      gatewayFeeAmount,
      appliedWelcomeDiscount,
      appliedRewards,
      superCoinsUsed,
      superCoinsDiscount,
      superCoinsEarned,
      totalPrice: finalTotal,
      transactionId,
      orderId,
      paymentId,
      invoiceNumber,
      isPaid: false, // Changed for PayFast integration
      paymentStatus: 'Pending', // Changed for PayFast integration
      orderItems: [],
      shipments: [],
      vendorPayables: []
    });

    // Process Shipments
    const Shipment = require('../models/Shipment');
    let shipmentSeqCounter = 1;

    for (const shp of quote.shipments) {
      allOrderItems = allOrderItems.concat(shp.items);
      
      const vendorGross = shp.subtotal;
      const vendorCommission = parseFloat(((vendorGross * commissionPct) / 100).toFixed(2));
      const vendorVat = shp.taxData.vatAmount;
      const shippingCostVendorGets = shp.selectedCourier ? shp.selectedCourier.cost : 0;
      
      const vendorNet = parseFloat((vendorGross - vendorCommission - vendorVat + shippingCostVendorGets).toFixed(2));

      vendorPayables.push({
        vendorId: shp.vendorId,
        grossAmount: vendorGross,
        commission: vendorCommission,
        vatDeducted: vendorVat,
        netPayable: vendorNet
      });

      const shipmentSeqString = `${sequence}-${shipmentSeqCounter.toString().padStart(2, '0')}`;
      const shipmentId = `GS-${year}-${moduleCode}-SHP-${shipmentSeqString}`;

      let internalLegs = [];
      let actualCost = 0;
      if (shp.selectedCourier && shp.selectedCourier.legs) {
        internalLegs = shp.selectedCourier.legs.map(leg => ({
          courierName: leg.courierName,
          origin: leg.origin,
          destination: leg.destination,
          cost: leg.cost,
          status: 'Pending'
        }));
        actualCost = internalLegs.reduce((sum, leg) => sum + leg.cost, 0);
      }

      const activePickupStore = shp.selectedPickupStore || selectedPickupStore;
      const isPickupMode = deliveryPreference === 'postnet' || shp.selectedCourier?.deliveryType === 'pickup' || Boolean(activePickupStore);

      const newShipment = new Shipment({
        shipmentId,
        orderId: order._id,
        orderRef: order.orderId,
        vendorId: shp.vendorId,
        customerId: user ? user._id : null,
        pickupAddress: { country: shp.originCountry },
        deliveryAddress: activePickupStore
          ? { ...shippingAddress, address: activePickupStore.address }
          : shippingAddress,
        deliveryMethod: isPickupMode
          ? 'postnet_pickup'
          : (shp.isInternational ? 'international_courier' : 'home_delivery'),
        pickupLocation: activePickupStore
          ? {
              locationId: activePickupStore.id,
              name: activePickupStore.name,
              address: activePickupStore.address
            }
          : undefined,
        customerShippingCharge: shp.selectedCourier ? shp.selectedCourier.cost : 0,
        actualShippingCost: actualCost,
        legs: internalLegs,
        status: 'Order Confirmed' // We keep it Confirmed, or could change to 'Payment Pending'
      });

      await newShipment.save();
      order.shipments.push(newShipment._id);
      shipmentSeqCounter++;
    }

    order.orderItems = allOrderItems;
    order.vendorPayables = vendorPayables;

    // Capture Immutable Financial Snapshot (Costing GS Understanding Section 14 & 251)
    const CostingEngine = require('../engines/costingEngine');
    order.financialSnapshot = CostingEngine.calculateOrderFinancialSnapshot(order, settings);

    await order.save();

    // Record Super Coin Ledger entries
    if (superCoinsUsed > 0 && user) {
      await SuperCoinLedger.create({
        userId: user._id,
        amount: -superCoinsUsed,
        type: 'redeemed',
        activity: 'order_discount',
        status: 'completed',
        orderId: order._id,
        orderRef: order.invoiceNumber || order.orderId,
        description: `Redeemed ${superCoinsUsed} Super Coins (-R${superCoinsDiscount.toFixed(2)}) on order #${order.invoiceNumber || order.orderId}`,
        balanceSnapshot: user.superCoinsBalance
      }).catch(err => console.error('Error logging SuperCoin redemption ledger:', err));
    }

    if (superCoinsEarned > 0 && user) {
      const expiryMonths = settings?.superCoinsExpiryMonths || 12;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

      await SuperCoinLedger.create({
        userId: user._id,
        amount: superCoinsEarned,
        type: 'earned',
        activity: 'purchase',
        status: 'pending',
        orderId: order._id,
        orderRef: order.invoiceNumber || order.orderId,
        expiryDate,
        description: `Earned ${superCoinsEarned} Super Coins on order #${order.invoiceNumber || order.orderId} (Pending delivery clearance)`,
        balanceSnapshot: user.superCoinsBalance
      }).catch(err => console.error('Error logging SuperCoin earning ledger:', err));
    }
    const createdOrder = order;
    
    // === EVENT SOURCING: Log the initial sequence of events ===
    const CheckoutEngine = require('../services/CheckoutEngine');
    const actorId = user ? user._id : null;
    
    await CheckoutEngine.appendEvent(createdOrder._id.toString(), 'CheckoutInitiated', {
      customer: user ? user._id : 'guest',
      items: allOrderItems
    }, actorId);

    await CheckoutEngine.appendEvent(createdOrder._id.toString(), 'DeliveryCalculated', {
      shipments: quote.shipments,
      totalShippingCost: shippingCost
    }, actorId);

    await CheckoutEngine.appendEvent(createdOrder._id.toString(), 'PaymentMethodSelected', {
      method: paymentMethod
    }, actorId);

    await CheckoutEngine.appendEvent(createdOrder._id.toString(), 'OrderPlaced', {
      orderId: createdOrder.orderId,
      transactionId: createdOrder.transactionId,
      totals: {
        subTotal,
        shippingCost,
        vatAmount,
        totalPrice: calculatedTotal
      }
    }, actorId);

    // Send admin notification for guest 18+ verification document review
    if (isGuest && createdOrder.guestKyc?.documentUrl) {
      try {
        const { createInAppNotification } = require('./notificationController');
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
        for (const adm of admins) {
          await createInAppNotification({
            recipient: adm._id,
            recipientType: 'admin',
            title: '🛡️ Guest 18+ ID Document Submitted',
            message: `Guest ${guestName} submitted 18+ identification document for Order #${createdOrder.orderId || createdOrder.invoiceNumber || createdOrder._id}. Compliance clearance pending.`,
            type: 'order',
            link: '/admin/orders',
            metadata: { orderId: createdOrder._id, documentUrl: createdOrder.guestKyc.documentUrl }
          });
        }
      } catch (notifErr) {
        console.warn('Failed to notify admins of guest KYC document:', notifErr.message);
      }
    }

    // Send admin notification and email alert if order is marked as a gift
    if (createdOrder.isGift) {
      try {
        const { createInAppNotification } = require('./notificationController');
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
        for (const adm of admins) {
          await createInAppNotification({
            recipient: adm._id,
            recipientType: 'admin',
            title: `🎁 Gift Order #${createdOrder.orderId || createdOrder.invoiceNumber || createdOrder._id}`,
            message: `Special gift delivery requested for "${createdOrder.giftRecipientName || 'Recipient'}". Message: "${createdOrder.giftMessage || 'No personal message'}". Please prepare luxury packaging & card.`,
            type: 'order',
            link: '/admin/orders',
            metadata: {
              orderId: createdOrder._id,
              isGift: true,
              giftRecipientName: createdOrder.giftRecipientName,
              giftMessage: createdOrder.giftMessage
            }
          });
        }
      } catch (notifErr) {
        console.warn('Failed to notify admins of gift order:', notifErr.message);
      }

      try {
        const { sendEmail } = require('../utils/emailService');
        const { giftOrderAdminNotificationTemplate } = require('../utils/emailTemplates');
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            subject: `🎁 [ADMIN ALERT] New Gift Order #${createdOrder.orderId || createdOrder.invoiceNumber || createdOrder._id} for ${createdOrder.giftRecipientName || 'Recipient'}`,
            html: giftOrderAdminNotificationTemplate(createdOrder)
          });
        }
      } catch (adminEmailErr) {
        console.warn('Failed to send admin gift order email:', adminEmailErr.message);
      }
    }

    // Send emails based on payment method
    try {
      const { sendEmail } = require('../utils/emailService');
      const { bankTransferInstructionsTemplate } = require('../utils/emailTemplates');
      const recipientEmail = user ? user.email : guestEmail;

      if (recipientEmail && paymentMethod === 'Bank Transfer') {
        const bankDetails = {
          bankName: 'FNB',
          accountName: 'The Grand Store',
          accountNumber: '62000000000',
          branchCode: '250655'
        };
        await sendEmail({
          to: recipientEmail,
          subject: `Payment Required - Order #${createdOrder._id}`,
          html: bankTransferInstructionsTemplate(createdOrder, bankDetails)
        });
      }
    } catch (err) {
      console.error('Failed to send bank transfer email:', err);
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('Add Order Error:', error);
    res.status(500).json({ message: 'Server Error adding order', error: error.message });
  }
};

/**
 * Process the ledger transactions and wallet updates after a successful payment
 * This function will be called by the PayFast ITN Webhook Controller
 */
const processOrderPayment = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error('Order not found');
  if (order.isPaid) return true; // Already paid, idempotent

  // Update order status
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentStatus = 'Paid';
  await order.save();
  
  // Reward the referrer if this was the customer's first order
  try {
    const User = require('../models/User');
    const user = order.user ? await User.findById(order.user) : null;
    
    // Check if previous paid orders exist (excluding this one)
    const previousPaidOrders = order.user ? await Order.countDocuments({ user: order.user, isPaid: true, _id: { $ne: order._id } }) : 0;
    
    if (previousPaidOrders === 0 && user && user.referredBy) {
      const PlatformSettings = require('../models/PlatformSettings');
      const settings = await PlatformSettings.findOne();
      
      const referringUser = await User.findById(user.referredBy);
      if (referringUser) {
        // Admin configurable cap on how many people a referrer can earn R50 from (0 = unlimited)
        const maxRewarded = settings?.referralMaxRewardedUsers !== undefined 
          ? Number(settings.referralMaxRewardedUsers) 
          : 5;
        
        const currentRewardedCount = Number(referringUser.totalReferrals) || 0;

        if (maxRewarded === 0 || currentRewardedCount < maxRewarded) {
          let reward = 50;
          if (settings) {
            if (settings.referralRewardType === 'percentage') {
              reward = parseFloat(((order.subTotal * (settings.referralRewardAmount || 5)) / 100).toFixed(2));
            } else {
              reward = Number(settings.referralRewardAmount) !== undefined ? Number(settings.referralRewardAmount) : 50;
            }
          } else {
            reward = 50;
          }
      
          referringUser.rewardBalance = (Number(referringUser.rewardBalance) || 0) + reward;
          referringUser.totalReferrals = currentRewardedCount + 1;
          await referringUser.save();
          console.log(`Credited R${reward} to referrer ${referringUser.email} (Referral ${referringUser.totalReferrals}/${maxRewarded === 0 ? 'Unlimited' : maxRewarded})`);
        } else {
          console.log(`Referrer ${referringUser.email} reached max reward cap of ${maxRewarded} people. No reward credited.`);
        }
      }
    }
  } catch (err) {
    console.error('Error rewarding referrer:', err);
  }
  
  // Credit Super Coins immediately upon payment
  try {
    if (order.superCoinsEarned > 0 && order.user) {
      const User = require('../models/User');
      const user = await User.findById(order.user);
      if (user) {
        // Move from pending to balance
        if ((user.pendingSuperCoins || 0) >= order.superCoinsEarned) {
          user.pendingSuperCoins -= order.superCoinsEarned;
        } else {
          user.pendingSuperCoins = 0;
        }
        user.superCoinsBalance = (user.superCoinsBalance || 0) + order.superCoinsEarned;
        await user.save();
        console.log(`Credited ${order.superCoinsEarned} Super Coins to user ${user.email} after payment.`);
        
        // Ledger entry update
        const SuperCoinLedger = require('../models/SuperCoinLedger');
        await SuperCoinLedger.updateOne(
          { orderId: order._id, type: 'earned', status: 'pending' },
          { 
            $set: { 
              status: 'completed', 
              description: `Earned ${order.superCoinsEarned} Super Coins on order #${order.invoiceNumber || order.orderId} (Payment Confirmed)`,
              balanceSnapshot: user.superCoinsBalance
            } 
          }
        );
      }
    }
  } catch (err) {
    console.error('Error crediting super coins on payment:', err);
  }

  // === EVENT SOURCING: Append PaymentVerified Event ===
  const CheckoutEngine = require('../services/CheckoutEngine');
  await CheckoutEngine.appendEvent(order._id.toString(), 'PaymentVerified', {
    method: 'PayFast / Gateway',
    timestamp: new Date()
  }, null);

  // Send Order Confirmation Email
  try {
    const { sendEmail } = require('../utils/emailService');
    const { orderConfirmationTemplate } = require('../utils/emailTemplates');
    const { generateOrderReceiptBuffer } = require('../utils/pdfService');
    // We need user email, so let's populate user if not already
    const User = require('../models/User');
    const user = order.user ? await User.findById(order.user) : null;
    const recipientEmail = user ? user.email : order.guestInfo?.email;
    if (recipientEmail) {
      const customerMock = user || {
        name: order.guestInfo?.name || 'Customer',
        email: recipientEmail,
        phone: order.guestInfo?.phone || ''
      };
      const pdfBuffer = await generateOrderReceiptBuffer(order, customerMock);
      await sendEmail({
        to: recipientEmail,
        subject: `Payment Receipt #${order.invoiceNumber || order.orderId || order._id}`,
        html: orderConfirmationTemplate(order),
        attachments: [
          {
            filename: `Receipt-${order.invoiceNumber || order._id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      // Send admin gift packaging alert if this order is a gift
      if (order.isGift) {
        try {
          const { giftOrderAdminNotificationTemplate } = require('../utils/emailTemplates');
          const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
          if (adminEmail) {
            await sendEmail({
              to: adminEmail,
              subject: `🎁 [GIFT DISPATCH READY] Order #${order.invoiceNumber || order.orderId || order._id} Paid - Prepare Gift Packaging`,
              html: giftOrderAdminNotificationTemplate(order),
              attachments: [
                {
                  filename: `Receipt-${order.invoiceNumber || order._id}.pdf`,
                  content: pdfBuffer,
                  contentType: 'application/pdf'
                }
              ]
            });
          }
        } catch (adminGiftErr) {
          console.warn('Failed to send paid gift alert to admin:', adminGiftErr.message);
        }
      }
    }
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
  }

  // === GENERATE ACCOUNTING LEDGER ===
  const shopCodeDoc = await SystemCode.findOne({ code: 'SHP' });
  const moduleCode = shopCodeDoc ? shopCodeDoc.code : 'SHP';
  const year = new Date().getFullYear().toString().slice(-2);
  const isAuctionOrder = (order.orderItems || []).some(i => i.category === 'Auction');

  // 1. Customer Payment Transaction
  let customerPaymentTxn = await Transaction.findOne({ gsReference: order.transactionId });
  if (!customerPaymentTxn) {
    customerPaymentTxn = new Transaction({
      gsReference: order.transactionId,
      type: 'payment',
      module: isAuctionOrder ? 'auction' : 'shop',
      amount: order.totalPrice,
      netAmount: parseFloat((order.totalPrice - (order.gatewayFeeAmount || 0)).toFixed(2)),
      customer: order.user,
      order: order._id,
      status: 'cleared',
      description: isAuctionOrder ? `Auction Payment - Order ${order.orderId || ''}` : 'Customer order payment'
    });
    await customerPaymentTxn.save();
  } else {
    customerPaymentTxn.status = 'cleared';
    customerPaymentTxn.amount = order.totalPrice;
    customerPaymentTxn.netAmount = parseFloat((order.totalPrice - (order.gatewayFeeAmount || 0)).toFixed(2));
    if (order.user) customerPaymentTxn.customer = order.user;
    if (order._id) customerPaymentTxn.order = order._id;
    await customerPaymentTxn.save();
  }

  // 2. Grand Store Commission Transaction
  if (order.commissionAmount > 0) {
    let commissionTxn = await Transaction.findOne({ order: order._id, type: 'commission' });
    if (!commissionTxn) {
      const gsCommSeqNum = await getNextSequence('shopOrder');
      commissionTxn = new Transaction({
        gsReference: `GS-${year}-${moduleCode}-COM-${gsCommSeqNum.toString().padStart(6, '0')}`,
        type: 'commission',
        module: isAuctionOrder ? 'auction' : 'shop',
        amount: order.commissionAmount,
        netAmount: order.commissionAmount,
        order: order._id,
        status: 'cleared',
        description: 'Marketplace commission from order'
      });
      await commissionTxn.save();
    }
  }

  // 2.5 VAT Transaction
  if (order.vatAmount > 0) {
    let vatTxn = await Transaction.findOne({ order: order._id, type: 'vat' });
    if (!vatTxn) {
      const gsVatSeqNum = await getNextSequence('shopOrder');
      vatTxn = new Transaction({
        gsReference: `GS-${year}-${moduleCode}-VAT-${gsVatSeqNum.toString().padStart(6, '0')}`,
        type: 'vat',
        module: isAuctionOrder ? 'auction' : 'shop',
        amount: order.vatAmount,
        netAmount: order.vatAmount,
        order: order._id,
        status: 'cleared',
        description: 'VAT collected from order'
      });
      await vatTxn.save();
    }
  }

  // 3. Vendor Payable Transactions & Wallet Updates
  for (const payable of (order.vendorPayables || [])) {
    if (!payable.vendorId) continue; // Skip admin-owned items

    let payableTxn = await Transaction.findOne({ order: order._id, type: 'payout', vendor: payable.vendorId });
    if (!payableTxn) {
      const vendorSeqNum = await getNextSequence('shopOrder');
      payableTxn = new Transaction({
        gsReference: `GS-${year}-${moduleCode}-PAYABLE-${vendorSeqNum.toString().padStart(6, '0')}`,
        type: 'payout',
        module: isAuctionOrder ? 'auction' : 'shop',
        amount: payable.netPayable,
        netAmount: payable.netPayable,
        vendor: payable.vendorId,
        order: order._id,
        status: 'pending', // Pending until payout is cleared
        description: 'Vendor payable from order'
      });
      await payableTxn.save();

      // Update Vendor Wallet
      let wallet = await Wallet.findOne({ vendorId: payable.vendorId });
      if (!wallet) {
        wallet = new Wallet({ vendorId: payable.vendorId });
      }
      wallet.pendingBalance += payable.netPayable;
      wallet.totalEarned += payable.netPayable; // Total earned tracks gross earnings
      await wallet.save();
    }
  }

  // 4. Update AuctionLot if this order contains an auction lot
  try {
    const AuctionLot = require('../models/AuctionLot');
    for (const item of order.orderItems) {
      if (item.product) {
        const lot = await AuctionLot.findById(item.product);
        if (lot) {
          lot.paymentStatus = 'Paid';
          lot.status = 'sold';
          await lot.save();
        }
      }
    }
  } catch (auctionSyncErr) {
    console.error('Error syncing auction lot status in processOrderPayment:', auctionSyncErr);
  }

  // 5. Update CPA Section 45 compliant Auction Trust Ledger
  try {
    const AuctionLedger = require('../models/AuctionLedger');
    for (const item of order.orderItems) {
      if (item.product) {
        const ledger = await AuctionLedger.findOne({ lot: item.product });
        if (ledger) {
          ledger.settlementStatus = 'HELD_IN_ESCROW';
          ledger.settlementClearedAt = new Date();
          await ledger.save();
        }
      }
    }
  } catch (ledgerErr) {
    console.warn('AuctionLedger sync warning in processOrderPayment:', ledgerErr.message);
  }

  return true;
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const rawOrders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    
    // Deduplicate any race-condition auction orders for the same lot
    const seenAuctionLots = new Map();
    const orders = [];

    for (const order of rawOrders) {
      const auctionItem = order.orderItems?.find(item => item.product && (
        item.category === 'Auction' || 
        item.name?.toLowerCase().includes('auction lot') ||
        order.transactionId?.includes('-AUC-')
      ));
      
      if (auctionItem && auctionItem.product) {
        const lotId = auctionItem.product.toString();
        if (seenAuctionLots.has(lotId)) {
          const existingIdx = seenAuctionLots.get(lotId);
          const existingOrder = orders[existingIdx];
          // If this order is paid and existing wasn't, prioritize the paid order
          if ((order.isPaid || order.paymentStatus === 'Paid') && !(existingOrder.isPaid || existingOrder.paymentStatus === 'Paid')) {
            orders[existingIdx] = order;
          }
          // Discard the duplicate ghost order
          continue;
        } else {
          seenAuctionLots.set(lotId, orders.length);
          orders.push(order);
        }
      } else {
        orders.push(order);
      }
    }

    res.json(orders);
  } catch (error) {
    console.error('Get My Orders Error:', error);
    res.status(500).json({ message: 'Server Error getting my orders' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('shipments');
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({ message: 'Server Error getting order' });
  }
};

// @desc    Get logged in vendor orders/sales (Shipments)
// @route   GET /api/orders/vendor/sales
// @access  Private (Vendor only)
const getVendorOrders = async (req, res) => {
  try {
    const Shipment = require('../models/Shipment');
    const Order = require('../models/Order');
    
    const managesInternalOrders = ['admin', 'super_admin', 'product_manager'].includes(req.user.role);
    const filter = managesInternalOrders ? { vendorId: null } : { vendorId: req.user._id };
    const shipments = await Shipment.find(filter)
      .sort({ createdAt: -1 })
      .populate('customerId', 'name email');

    // Attach items from the master order
    const populatedShipmentsRaw = await Promise.all(shipments.map(async (shp) => {
      const masterOrder = await Order.findById(shp.orderId);
      
      // === EVENT SOURCING: Filter out unapproved / unpaid orders ===
      if (!masterOrder || !masterOrder.isPaid) {
        return null;
      }

      let items = masterOrder.orderItems.filter(item => {
        if (managesInternalOrders) return !item.vendorId;
        return item.vendorId && item.vendorId.toString() === req.user._id.toString();
      });
      
      return {
        _id: shp._id,
        shipmentId: shp.shipmentId,
        orderRef: shp.orderRef,
        createdAt: shp.createdAt,
        status: shp.status,
        courierName: shp.legs && shp.legs.length > 0 ? shp.legs[0].courierName : 'Vendor Managed',
        shippingCost: shp.customerShippingCharge,
        trackingNumber: shp.mainTrackingNumber,
        deliveryAddress: shp.deliveryAddress,
        customerName: shp.customerId ? shp.customerId.name : 'Guest',
        items: items,
        vendorTotal: items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
      };
    }));

    // Remove nulls (unpaid/unapproved orders)
    const populatedShipments = populatedShipmentsRaw.filter(shp => shp !== null);

    res.json(populatedShipments);
  } catch (error) {
    console.error('Get Vendor Orders Error:', error);
    res.status(500).json({ message: 'Server Error getting vendor orders' });
  }
};

// @desc    Update a retail shipment's fulfilment status
// @route   PATCH /api/orders/vendor/sales/:shipmentId/status
// @access  Private (Vendor/Product Staff)
const updateShipmentStatus = async (req, res) => {
  try {
    const Shipment = require('../models/Shipment');
    const allowedStatuses = [
      'Order Confirmed',
      'Preparing',
      'Collected',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Delayed',
      'Failed',
    ];
    const status = String(req.body.status || '');
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid shipment status' });
    }

    const shipment = await Shipment.findById(req.params.shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const managesInternalOrders = ['admin', 'super_admin', 'product_manager'].includes(req.user.role);
    const ownsShipment = shipment.vendorId?.toString() === req.user._id.toString();
    if ((!shipment.vendorId && !managesInternalOrders) || (shipment.vendorId && !ownsShipment)) {
      return res.status(403).json({ message: 'Not authorized to update this shipment' });
    }

    shipment.status = status;
    shipment.actualDeliveryDate = status === 'Delivered' ? new Date() : shipment.actualDeliveryDate;
    await shipment.save();
    res.json({ _id: shipment._id, status: shipment.status, actualDeliveryDate: shipment.actualDeliveryDate });
  } catch (error) {
    console.error('Update Shipment Status Error:', error);
    res.status(500).json({ message: 'Server Error updating shipment status' });
  }
};

// @desc    Mark order as paid (from client payment gateway / PayFast callback)
// @route   PUT /api/orders/:id/pay
// @access  Private
const markOrderAsPaid = async (req, res) => {
  try {
    const id = req.params.id;
    const mongoose = require('mongoose');
    let order = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderId: id });
    }
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify user ownership or staff/admin or guest order
    const isOwner = order.user && req.user && order.user.toString() === req.user._id.toString();
    const isAdmin = req.user && ['admin', 'super_admin', 'product_manager', 'finance_staff'].includes(req.user?.role);
    const isGuestOwner = order.isGuest;
    if (!isOwner && !isAdmin && !isGuestOwner) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    if (order.isPaid) {
      return res.json(order);
    }

    // Process ledger, wallet, referrer rewards, events, and set isPaid=true
    await processOrderPayment(order._id);

    const updated = await Order.findById(order._id);
    res.json(updated);
  } catch (error) {
    console.error('Mark order as paid error:', error);
    res.status(500).json({ message: 'Server error updating order to paid', error: error.message });
  }
};


// @desc    Get all orders for Admin with breakdown by retail and vendor products
// @route   GET /api/orders/admin/all?tab=all|retail|vendor&search=...
// @access  Private (Admin / Super Admin / Product Manager)
const getAdminOrders = async (req, res) => {
  try {
    const { tab = 'all', search = '', limit = 100 } = req.query;
    const Order = require('../models/Order');

    let query = {};
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { orderId: { $regex: term, $options: 'i' } },
        { invoiceNumber: { $regex: term, $options: 'i' } },
        { 'guestInfo.name': { $regex: term, $options: 'i' } },
        { 'guestInfo.email': { $regex: term, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: term, $options: 'i' } },
        { 'shippingAddress.email': { $regex: term, $options: 'i' } },
        { 'shippingAddress.city': { $regex: term, $options: 'i' } },
        { 'orderItems.name': { $regex: term, $options: 'i' } }
      ];
    }

    const rawOrders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(200, Number(limit) || 100))
      .populate('user', 'name email phoneNumber')
      .lean();

    // Admin should only see store/retail orders and products (vendor things excluded)
    const enriched = [];
    for (const ord of rawOrders) {
      const retailItems = (ord.orderItems || []).filter(item => !item.vendorId);
      if (retailItems.length === 0) continue; // Exclude vendor-only orders

      enriched.push({
        ...ord,
        orderItems: retailItems, // Only retail/store items exposed to admin
        retailItemsCount: retailItems.length,
        hasRetailItems: true,
        hasVendorItems: false,
        customerName: ord.guestInfo?.name || ord.shippingAddress?.fullName || ord.user?.name || 'Customer',
        customerEmail: ord.guestInfo?.email || ord.shippingAddress?.email || ord.user?.email || '',
        customerPhone: ord.guestInfo?.phone || ord.shippingAddress?.phone || ord.shippingAddress?.phoneNumber || ord.user?.phoneNumber || '',
        retailTotal: retailItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0)
      });
    }

    let filtered = enriched;
    if (tab === 'paid') {
      filtered = enriched.filter(ord => ord.isPaid || ord.paymentStatus === 'Paid');
    } else if (tab === 'pending') {
      filtered = enriched.filter(ord => !ord.isPaid && ord.paymentStatus !== 'Paid');
    }

    res.json(filtered);
  } catch (error) {
    console.error('Get Admin Orders Error:', error);
    res.status(500).json({ message: 'Server error retrieving admin orders' });
  }
};

// @desc    Get complete order details for Admin by ID
// @route   GET /api/orders/admin/:id
// @access  Private (Admin / Super Admin / Product Manager)
const getAdminOrderById = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { id } = req.params;

    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id)
        .populate('user', 'name email phoneNumber isAgeVerified bidderApprovalStatus')
        .populate('orderItems.vendorId', 'name email storeName storeAddress storeContact')
        .populate('adminMessages.sentBy', 'name email')
        .lean();
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ orderId: id }, { invoiceNumber: id }] })
        .populate('user', 'name email phoneNumber isAgeVerified bidderApprovalStatus')
        .populate('orderItems.vendorId', 'name email storeName storeAddress storeContact')
        .populate('adminMessages.sentBy', 'name email')
        .lean();
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const retailItems = (order.orderItems || []).filter(item => !item.vendorId);
    // Overwrite orderItems with only retail items (no vendor products visible to admin)
    order.orderItems = retailItems;

    res.json({
      ...order,
      orderItems: retailItems,
      retailItems,
      retailSubtotal: retailItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0),
      customerName: order.guestInfo?.name || order.shippingAddress?.fullName || order.user?.name || 'Customer',
      customerEmail: order.guestInfo?.email || order.shippingAddress?.email || order.user?.email || '',
      customerPhone: order.guestInfo?.phone || order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || order.user?.phoneNumber || ''
    });
  } catch (error) {
    console.error('Get Admin Order By Id Error:', error);
    res.status(500).json({ message: 'Server error retrieving order details' });
  }
};

// @desc    Send custom / emergency message from Admin to customer for an order
// @route   POST /api/orders/:id/admin-message
// @access  Private (Admin / Super Admin / Product Manager)
const sendAdminOrderMessage = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { id } = req.params;
    const { message, type = 'info' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id).populate('user', 'name email');
    }
    if (!order) {
      order = await Order.findOne({ $or: [{ orderId: id }, { invoiceNumber: id }] }).populate('user', 'name email');
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const senderName = req.user.name || 'The Grand Store Concierge';
    const messageObj = {
      message: message.trim(),
      type: ['info', 'warning', 'emergency', 'stock_issue'].includes(type) ? type : 'info',
      sentAt: new Date(),
      sentBy: req.user._id,
      sentByName: senderName
    };

    if (!Array.isArray(order.adminMessages)) {
      order.adminMessages = [];
    }
    order.adminMessages.push(messageObj);
    order.latestAdminMessage = messageObj;
    await order.save();

    // 1. If registered user, create in-app notification
    if (order.user && order.user._id) {
      try {
        const Notification = require('../models/Notification');
        await Notification.create({
          recipient: order.user._id,
          recipientType: 'customer',
          title: `Order Advisory: #${order.invoiceNumber || order.orderId}`,
          message: messageObj.message,
          type: 'order',
          link: '/customer/orders',
          metadata: {
            orderId: order._id,
            orderReference: order.invoiceNumber || order.orderId,
            type: messageObj.type
          }
        });
      } catch (notifErr) {
        console.error('Failed to create in-app notification:', notifErr.message);
      }
    }

    // 2. In all cases (guest or registered user), dispatch branded email
    const customerEmail = order.guestInfo?.email || order.shippingAddress?.email || (order.user && order.user.email);
    const customerName = order.guestInfo?.name || order.shippingAddress?.fullName || (order.user && order.user.name) || 'Valued Customer';

    if (customerEmail) {
      try {
        const { sendEmail } = require('../utils/emailService');
        const { adminOrderMessageEmailTemplate } = require('../utils/emailTemplates');
        await sendEmail({
          to: customerEmail,
          subject: `[Order #${order.invoiceNumber || order.orderId}] Notice from The Grand Store Concierge`,
          html: adminOrderMessageEmailTemplate({
            customerName,
            orderReference: order.invoiceNumber || order.orderId || order._id,
            message: messageObj.message,
            type: messageObj.type,
            storeUrl: process.env.FRONTEND_URL || 'https://grandstoreglobal.com'
          })
        });
      } catch (emailErr) {
        console.error('Failed to send admin order message email:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Notice sent to customer successfully',
      adminMessage: messageObj,
      order
    });
  } catch (error) {
    console.error('Send Admin Order Message Error:', error);
    res.status(500).json({ message: 'Server error sending message to customer' });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  getVendorOrders,
  updateShipmentStatus,
  getMyOrders,
  markOrderAsPaid,
  processOrderPayment, // Exported for ITN webhook
  getAdminOrders,
  getAdminOrderById,
  sendAdminOrderMessage
};
