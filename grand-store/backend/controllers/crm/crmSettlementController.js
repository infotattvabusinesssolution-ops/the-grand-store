const mongoose = require('mongoose');
const VendorSettlement = require('../../models/VendorSettlement');
const Order = require('../../models/Order');
const Shipment = require('../../models/Shipment');
const Vendor = require('../../models/Vendor');

// @desc    Get 30-Day Vendor Settlement Summary & Payout Queue
// @route   GET /api/crm/settlements/summary
// @access  Staff / CRM
exports.getSettlementsSummary = async (req, res) => {
  try {
    const now = new Date();

    // 1. Auto-discover recently delivered shipments that need settlement tracking
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
          let vendor = await Vendor.findById(vId);
          if (!vendor) {
            vendor = await Vendor.findOne({ userId: vId });
          }
          if (order && vendor) {
            const deliveredDate = sh.actualDeliveryDate || sh.deliveredAt || sh.updatedAt || new Date();
            const dueDate = new Date(deliveredDate);
            dueDate.setDate(dueDate.getDate() + 30); // 30-day payout milestone

            const total = order.totalPrice || order.subTotal || 0;
            const commRate = vendor.commissionRate || 15;
            const commAmt = (total * commRate) / 100;
            const payout = total - commAmt;

            await VendorSettlement.create({
              settlementReference: `SET-${Date.now().toString().slice(-6)}-${order.orderId || String(order._id).slice(-6)}`,
              vendor: vendor._id,
              vendorName: vendor.businessInfo?.legalName || vendor.businessInfo?.tradingName || vendor.name || 'Grand Store Partner',
              order: order._id,
              orderNumber: order.orderId || String(order._id).slice(-8),
              shipment: sh._id,
              deliveredAt: deliveredDate,
              payoutDueDate: dueDate,
              orderTotal: total,
              commissionRatePct: commRate,
              commissionAmount: commAmt,
              payoutAmount: payout,
              status: now >= dueDate ? 'due_for_payment' : 'pending_30day_window',
              bankDetailsSnapshot: vendor.bankingInfo || vendor.bankDetails || {}
            }).catch(e => {
              // Ignore duplicate key race conditions safely
            });
          }
        }
      }
    }

    // 2. Refresh statuses: Auto-promote pending settlements whose 30-day countdown has elapsed
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
            performedByName: 'System 30-Day Cron',
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

    const totalDueAmount = settlements
      .filter(s => s.status === 'due_for_payment')
      .reduce((sum, s) => sum + (s.payoutAmount || 0), 0);

    const totalSettledAmount = settlements
      .filter(s => s.status === 'settled')
      .reduce((sum, s) => sum + (s.payoutAmount || 0), 0);

    res.json({
      success: true,
      stats: {
        pendingCount,
        dueCount,
        settledCount,
        disputedCount,
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
          commissionAmount: s.commissionAmount,
          payoutAmount: s.payoutAmount,
          currency: s.currency,
          status: s.status,
          bankDetails: s.bankDetailsSnapshot,
          paymentReference: s.paymentReference,
          proofOfPaymentUrl: s.proofOfPaymentUrl,
          settledAt: s.settledAt,
          disputeReason: s.disputeReason
        };
      })
    });
  } catch (err) {
    console.error('Error fetching settlements summary:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving settlements summary' });
  }
};

// @desc    Process settlement payment (Record EFT / Wire transfer proof)
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
    settlement.settledBy = req.user._id;
    settlement.paymentReference = paymentReference || `EFT-${Date.now().toString().slice(-6)}`;
    if (proofOfPaymentUrl) settlement.proofOfPaymentUrl = proofOfPaymentUrl;

    settlement.auditTrail.push({
      action: 'payout_settled',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: `Settlement marked paid via EFT. Ref: ${settlement.paymentReference}`
    });

    if (notes) {
      settlement.notes.push({
        text: notes,
        author: req.user._id,
        authorName: req.user.name,
        createdAt: new Date()
      });
    }

    await settlement.save();

    res.json({
      success: true,
      message: `Settlement ${settlement.settlementReference} successfully processed and marked settled`,
      settlement
    });
  } catch (err) {
    console.error('Error processing settlement payment:', err);
    res.status(500).json({ success: false, message: 'Server error processing settlement payment' });
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
    settlement.disputeReason = reason || 'Customer dispute or return opened';

    settlement.auditTrail.push({
      action: 'settlement_disputed',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: `30-Day Payout held due to dispute: ${settlement.disputeReason}`
    });

    await settlement.save();

    res.json({
      success: true,
      message: `Settlement ${settlement.settlementReference} held successfully`,
      settlement
    });
  } catch (err) {
    console.error('Error disputing settlement:', err);
    res.status(500).json({ success: false, message: 'Server error disputing settlement' });
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
      bankDetails
    } = req.body;

    const total = Number(orderTotal) || 1000;
    const commPct = Number(commissionRatePct) || 15;
    const commAmt = (total * commPct) / 100;
    const payout = total - commAmt;

    const deliveryDate = deliveredAt ? new Date(deliveredAt) : new Date();
    const dueDate = payoutDueDate ? new Date(payoutDueDate) : new Date(deliveryDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const ref = `SET-${Date.now().toString().slice(-6)}-${orderNumber || 'MAN'}`;

    // Find a valid vendor and order or fallback to user ID
    let finalVendor = vendorId;
    if (!finalVendor) {
      const v = await Vendor.findOne();
      finalVendor = v ? v._id : req.user._id;
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
      status: req.body.status || (new Date() >= dueDate ? 'due_for_payment' : 'pending_30day_window'),
      bankDetailsSnapshot: bankDetails || {}
    });

    await settlement.save();

    res.status(201).json({
      success: true,
      message: `Settlement ${settlement.settlementReference} created successfully`,
      settlement
    });
  } catch (err) {
    console.error('Error creating settlement:', err);
    res.status(500).json({ success: false, message: 'Server error creating settlement', error: err.message });
  }
};

