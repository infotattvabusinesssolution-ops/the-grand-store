const Vendor = require('../../models/Vendor');
const Order = require('../../models/Order');

/**
 * Returns the Vendor Management Operations Dashboard data.
 */
exports.getVendorOperationsSummary = async (req, res) => {
  try {
    const [
      newApplications,
      documentsAwaitingVerification,
      ordersRequiringAction
    ] = await Promise.all([
      // 1. New Applications (stage: application_received)
      Vendor.find({
        $or: [
          { crmWorkflowStage: 'application_received' },
          { status: 'pending' }
        ]
      })
      .select('name storeName email phone kycDocuments status crmWorkflowStage createdAt')
      .sort({ createdAt: -1 }),

      // 2. Documents Awaiting Verification (KYC uploaded, awaiting sign-off)
      Vendor.find({
        'kycDocuments.0': { $exists: true },
        $or: [
          { kycStatus: 'pending' },
          { crmWorkflowStage: 'kyc_verification_pending' }
        ]
      })
      .select('name storeName email phone kycDocuments kycStatus crmWorkflowStage updatedAt')
      .sort({ updatedAt: -1 }),

      // 3. Orders Requiring Vendor Action (paid orders, vendor has not dispatched within 24h)
      Order.find({
        isPaid: true,
        status: { $in: ['Processing', 'Placed'] },
        'orderItems.vendorDispatchStatus': 'pending',
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
      .select('orderId createdAt user orderItems totalPrice')
      .populate('user', 'name phone email')
      .limit(20)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        newApplications,
        documentsAwaitingVerification,
        ordersRequiringAction,
        counts: {
          applications: newApplications.length,
          kycPending: documentsAwaitingVerification.length,
          overdueOrders: ordersRequiringAction.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vendor operations summary:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve vendor summary' });
  }
};

/**
 * Update vendor workflow stage with strict audit logging (Section 4 requirement).
 */
exports.updateVendorWorkflowStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStage, notes } = req.body;

    const vendor = await Vendor.findById(id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const previousStage = vendor.crmWorkflowStage || 'application_received';
    vendor.crmWorkflowStage = newStage;

    if (newStage === 'live_active') {
      vendor.status = 'verified';
    }

    // Preserve audit trail: who approved and when
    vendor.crmAuditTrail.push({
      action: `Workflow transition: ${previousStage} -> ${newStage}`,
      performedBy: req.user?._id,
      performerName: req.user?.name || 'Administrator',
      previousState: { stage: previousStage },
      newState: { stage: newStage },
      timestamp: new Date(),
      notes: notes || 'Stage updated via CRM'
    });

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: `Vendor workflow updated to ${newStage}`,
      vendor
    });
  } catch (error) {
    console.error('Error updating vendor workflow stage:', error);
    return res.status(500).json({ success: false, message: 'Failed to update vendor stage' });
  }
};
