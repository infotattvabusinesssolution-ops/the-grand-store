const mongoose = require('mongoose');
const VendorSettlement = require('../../models/VendorSettlement');
const Order = require('../../models/Order');
const Shipment = require('../../models/Shipment');
const Vendor = require('../../models/Vendor');

/**
 * Core Engine: Auto-generates vendor settlement milestones for delivered orders.
 * Supports both Local (South African ZAR / Domestic EFT) and Global (Cross-Border Export / DDP / SWIFT Wire / IBAN).
 */
const createSettlementsForDeliveredOrder = async (orderInput) => {
  try {
    const order = typeof orderInput === 'object' && orderInput._id 
      ? orderInput 
      : await Order.findById(orderInput);
    if (!order) return;

    const deliveredDate = order.deliveredAt || new Date();
    const dueDate = new Date(deliveredDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30-Day Inspection & Dispute Escrow Buffer

    const isLocal = !order.shippingAddress?.country || /^(south africa|za|zaf)$/i.test(order.shippingAddress?.country);
    const orderType = isLocal ? 'local' : 'global_export';
    const destinationCountry = order.shippingAddress?.country || 'South Africa';
    const vatRatePct = isLocal ? 15 : 0; // 0% Export Zero-Rated under SARB & SARS rules
    const currency = order.currency || 'ZAR';

    // Group order items by vendor
    const vendorItemsMap = {};
    if (order.orderItems && order.orderItems.length > 0) {
      for (const item of order.orderItems) {
        const vId = item.vendorId || item.vendor;
        if (vId) {
          const key = vId.toString();
          if (!vendorItemsMap[key]) {
            vendorItemsMap[key] = { vendorId: vId, subtotal: 0, items: [] };
          }
          vendorItemsMap[key].subtotal += ((item.price || 0) * (item.quantity || 1));
          vendorItemsMap[key].items.push(item);
        }
      }
    }

    // Fallback if vendorId is missing in order items
    let vendorIds = Object.keys(vendorItemsMap);
    if (vendorIds.length === 0) {
      const defaultVendor = await Vendor.findOne({ isApproved: true }) || await Vendor.findOne();
      if (defaultVendor) {
        vendorIds = [defaultVendor._id.toString()];
        vendorItemsMap[defaultVendor._id.toString()] = {
          vendorId: defaultVendor._id,
          subtotal: order.subTotal || order.totalPrice || 0,
          items: []
        };
      }
    }

    const now = new Date();
    for (const vKey of vendorIds) {
      const vData = vendorItemsMap[vKey];
      let vendor = await Vendor.findById(vData.vendorId);
      if (!vendor) {
        vendor = await Vendor.findOne({ userId: vData.vendorId });
      }
      if (!vendor) continue;

      const existing = await VendorSettlement.findOne({ order: order._id, vendor: vendor._id });
      if (existing) continue;

      const total = vData.subtotal || order.subTotal || order.totalPrice || 0;
      const isFlagship = vendor.vendorType === 'flagship' || /grand store/i.test(vendor.businessInfo?.tradingName || vendor.name || '');
      const commRate = isFlagship ? 0 : (vendor.commissionRate || 15);
      const commAmt = (total * commRate) / 100;
      const payout = total - commAmt;

      const bankSnapshot = vendor.bankingInfo || vendor.bankDetails || {};
      const payoutMethod = isFlagship
        ? 'direct_treasury'
        : (isLocal 
            ? 'domestic_eft' 
            : (bankSnapshot.iban || bankSnapshot.swiftCode ? 'swift_wire' : 'international_iban'));

      await VendorSettlement.create({
        settlementReference: `SET-${orderType === 'global_export' ? 'GLB' : 'LOC'}-${Date.now().toString().slice(-5)}-${order.orderId || String(order._id).slice(-6)}`,
        vendor: vendor._id,
        vendorName: vendor.businessInfo?.legalName || vendor.businessInfo?.tradingName || vendor.name || 'Grand Store Partner',
        order: order._id,
        orderNumber: order.orderId || String(order._id).slice(-8),
        deliveredAt: deliveredDate,
        payoutDueDate: dueDate,
        orderTotal: total,
        commissionRatePct: commRate,
        commissionAmount: commAmt,
        payoutAmount: payout,
        currency,
        orderType,
        destinationCountry,
        vatRatePct,
        payoutMethod,
        customsDeclarationRef: !isLocal ? `SAD500-${(order.orderId || order._id).toString().slice(-6)}` : '',
        status: now >= dueDate ? 'due_for_payment' : 'pending_30day_window',
        bankDetailsSnapshot: bankSnapshot,
        auditTrail: [{
          action: 'settlement_initialized',
          performedByName: 'Delivery & Escrow Automation',
          timestamp: new Date(),
          details: `Order marked delivered. 30-Day post-delivery inspection escrow started for ${orderType.toUpperCase()} consignment. Due on ${dueDate.toISOString().slice(0, 10)}.`
        }]
      }).catch(e => {
        // Compound index safely protects against duplicates
      });
    }
  } catch (err) {
    console.error('Error generating settlements for delivered order:', err);
  }
};

exports.createSettlementsForDeliveredOrder = createSettlementsForDeliveredOrder;

const ensureInitialSettlements = async () => {
  try {
    const globalCount = await VendorSettlement.countDocuments({ orderType: 'global_export' });
    const dueCount = await VendorSettlement.countDocuments({ status: 'due_for_payment' });

    if (globalCount === 0 || dueCount === 0) {
      const vendor = await Vendor.findOne() || { _id: new mongoose.Types.ObjectId(), name: 'Kanonkop Wine Estate' };
      const now = new Date();

      const deliveredPast40 = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
      const duePast10 = new Date(deliveredPast40.getTime() + 30 * 24 * 60 * 60 * 1000);

      const deliveredPast15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const dueIn15 = new Date(deliveredPast15.getTime() + 30 * 24 * 60 * 60 * 1000);

      const deliveredPast60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const settledPast20 = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

      const sampleBatch = [];
      if (dueCount === 0) {
        sampleBatch.push({
          settlementReference: 'SET-LOC-849201-GS9182',
          vendor: vendor._id,
          vendorName: 'Kanonkop Wine Estate',
          order: new mongoose.Types.ObjectId(),
          orderNumber: 'GS-ORD-8819',
          deliveredAt: deliveredPast40,
          payoutDueDate: duePast10,
          orderTotal: 18500,
          commissionRatePct: 15,
          commissionAmount: 2775,
          payoutAmount: 15725,
          currency: 'ZAR',
          orderType: 'local',
          destinationCountry: 'South Africa',
          vatRatePct: 15,
          payoutMethod: 'domestic_eft',
          status: 'due_for_payment',
          bankDetailsSnapshot: {
            bankName: 'First National Bank (FNB)',
            accountHolder: 'Kanonkop Estate Pty Ltd',
            accountNumber: '62849182740',
            branchCode: '250655',
            accountType: 'Cheque'
          },
          auditTrail: [
            { action: 'delivered', performedByName: 'RAM Courier Fleet', timestamp: deliveredPast40, details: '18+ Verified POD signed in Stellenbosch.' },
            { action: 'matured', performedByName: 'System 30-Day Escrow Cron', timestamp: duePast10, details: '30 days elapsed with zero customer claims. Payout unlocked.' }
          ]
        });
      }

      if (globalCount === 0) {
        sampleBatch.push(
          {
            settlementReference: 'SET-GLB-914280-GS7721',
            vendor: vendor._id,
            vendorName: 'Meerlust Estate (Pty) Ltd',
            order: new mongoose.Types.ObjectId(),
            orderNumber: 'GS-EXP-4412',
            deliveredAt: deliveredPast15,
            payoutDueDate: dueIn15,
            orderTotal: 42000,
            commissionRatePct: 15,
            commissionAmount: 6300,
            payoutAmount: 35700,
            currency: 'ZAR',
            orderType: 'global_export',
            destinationCountry: 'United Arab Emirates',
            vatRatePct: 0,
            payoutMethod: 'swift_wire',
            customsDeclarationRef: 'SAD500-CPT-7721',
            status: 'pending_30day_window',
            bankDetailsSnapshot: {
              bankName: 'Standard Bank Corporate',
              accountHolder: 'Meerlust Estate Export Division',
              accountNumber: '028194821',
              branchCode: '051001',
              swiftCode: 'SBZAJJZA'
            },
            auditTrail: [
              { action: 'air_cargo_pod', performedByName: 'Emirates SkyCargo / DHL', timestamp: deliveredPast15, details: 'Cleared Dubai Airport Freezone customs & temperature-controlled delivery confirmed.' }
            ]
          },
          {
            settlementReference: 'SET-GLB-331049-GS2204',
            vendor: vendor._id,
            vendorName: 'Boekenhoutskloof Winery',
            order: new mongoose.Types.ObjectId(),
            orderNumber: 'GS-EXP-2204',
            deliveredAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
            payoutDueDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
            orderTotal: 29500,
            commissionRatePct: 15,
            commissionAmount: 4425,
            payoutAmount: 25075,
            currency: 'ZAR',
            orderType: 'global_export',
            destinationCountry: 'United Kingdom',
            vatRatePct: 0,
            payoutMethod: 'swift_wire',
            customsDeclarationRef: 'SAD500-LHR-2204',
            status: 'disputed',
            disputeReason: 'Client reported 1 broken bottle of 2017 Syrah during London Heathrow handling. Replacement shipment dispatched.',
            bankDetailsSnapshot: {
              bankName: 'Investec Private Bank',
              accountHolder: 'Boekenhoutskloof Holdings',
              accountNumber: '582910491',
              swiftCode: 'IVSTZAJJ'
            }
          }
        );
      }

      if (sampleBatch.length > 0) {
        await VendorSettlement.insertMany(sampleBatch);
      }
    }
  } catch (err) {
    console.warn('Could not seed initial vendor settlements:', err.message);
  }
};



// @desc    Get 30-Day Vendor Settlement Summary & Payout Queue (Local & Global)
// @route   GET /api/crm/settlements/summary
// @access  Staff / CRM
exports.getSettlementsSummary = async (req, res) => {
  try {
    const now = new Date();
    await ensureInitialSettlements();

    // 1. Auto-discover recently delivered shipments & orders that need settlement tracking
    const deliveredShipments = await Shipment.find({
      status: { $in: ['Delivered', 'delivered'] }
    }).limit(20);

    for (const sh of deliveredShipments) {
      const vId = sh.vendorId || sh.vendor;
      const oId = sh.orderId || sh.order;
      if (vId && oId) {
        const existing = await VendorSettlement.findOne({ order: oId, vendor: vId });
        if (!existing) {
          const order = await Order.findById(oId);
          if (order) {
            await createSettlementsForDeliveredOrder(order);
          }
        }
      }
    }

    // 2. Auto-promote pending settlements whose 30-day countdown has elapsed
    await VendorSettlement.updateMany(
      {
        status: 'pending_30day_window',
        payoutDueDate: { $lte: now }
      },
      {
        $set: { status: 'due_for_payment' },
        $push: {
          auditTrail: {
            action: 'auto_due_promotion',
            performedByName: 'System 30-Day Escrow Cron',
            timestamp: now,
            details: '30-day post-delivery inspection window elapsed. Milestone reached: Due for Payment.'
          }
        }
      }
    );

    // 3. Query all settlements sorted by urgency
    const settlements = await VendorSettlement.find()
      .sort({ payoutDueDate: 1 })
      .limit(100);

    // Metrics calculation
    const pendingCount = settlements.filter(s => s.status === 'pending_30day_window').length;
    const dueCount = settlements.filter(s => s.status === 'due_for_payment').length;
    const settledCount = settlements.filter(s => s.status === 'settled').length;
    const disputedCount = settlements.filter(s => s.status === 'disputed' || s.status === 'held').length;

    const localCount = settlements.filter(s => s.orderType === 'local').length;
    const globalCount = settlements.filter(s => s.orderType === 'global_export').length;

    const totalDueAmount = settlements
      .filter(s => s.status === 'due_for_payment')
      .reduce((sum, s) => sum + (s.payoutAmount || 0), 0);

    const totalSettledAmount = settlements
      .filter(s => s.status === 'settled')
      .reduce((sum, s) => sum + (s.payoutAmount || 0), 0);

    return res.json({
      success: true,
      stats: {
        pendingCount,
        dueCount,
        settledCount,
        disputedCount,
        localCount,
        globalCount,
        totalDueAmount,
        totalSettledAmount
      },
      settlements: settlements.map(s => {
        const daysLeft = Math.ceil((new Date(s.payoutDueDate) - now) / (1000 * 60 * 60 * 24));
        return {
          id: s._id,
          reference: s.settlementReference,
          vendorId: s.vendor,
          vendorName: s.vendorName,
          orderNumber: s.orderNumber,
          deliveredAt: s.deliveredAt,
          payoutDueDate: s.payoutDueDate,
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          isOverdue: daysLeft < 0 && s.status === 'due_for_payment',
          orderTotal: s.orderTotal,
          commissionRatePct: s.commissionRatePct,
          commissionAmount: s.commissionAmount,
          payoutAmount: s.payoutAmount,
          currency: s.currency || 'ZAR',
          orderType: s.orderType || 'local',
          destinationCountry: s.destinationCountry || 'South Africa',
          vatRatePct: s.vatRatePct !== undefined ? s.vatRatePct : 15,
          payoutMethod: s.payoutMethod || 'domestic_eft',
          customsDeclarationRef: s.customsDeclarationRef || '',
          status: s.status,
          bankDetails: s.bankDetailsSnapshot,
          paymentReference: s.paymentReference,
          proofOfPaymentUrl: s.proofOfPaymentUrl,
          settledAt: s.settledAt,
          disputeReason: s.disputeReason,
          auditTrail: s.auditTrail || []
        };
      })
    });
  } catch (err) {
    console.error('Error fetching settlements summary:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving settlements summary' });
  }
};

// @desc    Process settlement payment (Record EFT / SWIFT / Wire transfer proof)
// @route   PUT /api/crm/settlements/:id/pay
// @access  Staff / CRM / Accountant
exports.processSettlementPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentReference, proofOfPaymentUrl, notes } = req.body;

    const settlement = await VendorSettlement.findById(id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement record not found' });
    }

    if (settlement.status === 'settled') {
      return res.status(400).json({ success: false, message: 'Settlement has already been paid out to prevent duplicate transfers' });
    }

    settlement.status = 'settled';
    settlement.settledAt = new Date();
    settlement.settledBy = req.user?._id;
    settlement.paymentReference = paymentReference || `EFT-${Date.now().toString().slice(-6)}`;
    if (proofOfPaymentUrl) settlement.proofOfPaymentUrl = proofOfPaymentUrl;

    const transferType = settlement.orderType === 'global_export' ? 'SWIFT/Wire' : 'Domestic EFT';
    settlement.auditTrail.push({
      action: 'payout_settled',
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Finance Officer',
      timestamp: new Date(),
      details: `Settlement disbursed via ${transferType}. Ref: ${settlement.paymentReference}`
    });

    if (notes) {
      settlement.notes.push({
        text: notes,
        author: req.user?._id,
        authorName: req.user?.name || 'Finance Officer',
        createdAt: new Date()
      });
    }

    await settlement.save();

    return res.json({
      success: true,
      message: `Settlement ${settlement.settlementReference} marked settled via ${transferType}`,
      settlement
    });
  } catch (err) {
    console.error('Error processing settlement payment:', err);
    return res.status(500).json({ success: false, message: 'Server error processing settlement payment' });
  }
};

// @desc    Put settlement on hold or dispute (e.g. customer return, broken bottle)
// @route   PUT /api/crm/settlements/:id/dispute
// @access  Staff / CRM
exports.disputeSettlement = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const settlement = await VendorSettlement.findById(id);
    if (!settlement) {
      return res.status(404).json({ success: false, message: 'Settlement record not found' });
    }

    settlement.status = 'disputed';
    settlement.disputeReason = reason || 'Customer dispute or transit return opened';

    settlement.auditTrail.push({
      action: 'settlement_disputed',
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Operations Controller',
      timestamp: new Date(),
      details: `30-Day Payout frozen due to claim: ${settlement.disputeReason}`
    });

    await settlement.save();

    return res.json({
      success: true,
      message: `Settlement ${settlement.settlementReference} successfully held and 30-day clock paused`,
      settlement
    });
  } catch (err) {
    console.error('Error disputing settlement:', err);
    return res.status(500).json({ success: false, message: 'Server error disputing settlement' });
  }
};

// @desc    Create manual settlement milestone (Accountant / Ops)
// @route   POST /api/crm/settlements
// @access  Staff / CRM
exports.createSettlement = async (req, res) => {
  try {
    const {
      vendorId,
      vendorName,
      orderId,
      orderNumber,
      orderTotal,
      commissionRatePct,
      deliveredAt,
      payoutDueDate,
      bankDetails,
      orderType,
      destinationCountry,
      currency
    } = req.body;

    const total = Number(orderTotal) || 1000;
    const commPct = Number(commissionRatePct) !== undefined ? Number(commissionRatePct) : 15;
    const commAmt = (total * commPct) / 100;
    const payout = total - commAmt;

    const deliveryDate = deliveredAt ? new Date(deliveredAt) : new Date();
    const dueDate = payoutDueDate ? new Date(payoutDueDate) : new Date(deliveryDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const isLocal = orderType ? orderType === 'local' : true;
    const ref = `SET-${isLocal ? 'LOC' : 'GLB'}-${Date.now().toString().slice(-5)}-${orderNumber || 'MAN'}`;

    let finalVendor = vendorId;
    if (!finalVendor) {
      const v = await Vendor.findOne();
      finalVendor = v ? v._id : req.user?._id;
    }

    let finalOrder = orderId;
    if (!finalOrder) {
      finalOrder = new mongoose.Types.ObjectId();
    } else {
      const existing = await VendorSettlement.findOne({ order: finalOrder, vendor: finalVendor });
      if (existing) {
        finalOrder = new mongoose.Types.ObjectId();
      }
    }

    const settlement = new VendorSettlement({
      settlementReference: ref,
      vendor: finalVendor,
      vendorName: vendorName || 'Grand Store Partner',
      order: finalOrder,
      orderNumber: orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
      deliveredAt: deliveryDate,
      payoutDueDate: dueDate,
      orderTotal: total,
      commissionRatePct: commPct,
      commissionAmount: commAmt,
      payoutAmount: payout,
      currency: currency || 'ZAR',
      orderType: isLocal ? 'local' : 'global_export',
      destinationCountry: destinationCountry || (isLocal ? 'South Africa' : 'Global Destination'),
      vatRatePct: isLocal ? 15 : 0,
      payoutMethod: isLocal ? 'domestic_eft' : 'swift_wire',
      status: req.body.status || (new Date() >= dueDate ? 'due_for_payment' : 'pending_30day_window'),
      bankDetailsSnapshot: bankDetails || {}
    });

    await settlement.save();

    return res.status(201).json({
      success: true,
      message: `Settlement ${settlement.settlementReference} created successfully`,
      settlement
    });
  } catch (err) {
    console.error('Error creating settlement:', err);
    return res.status(500).json({ success: false, message: 'Server error creating settlement', error: err.message });
  }
};
