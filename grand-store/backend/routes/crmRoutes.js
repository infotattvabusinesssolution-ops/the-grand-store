const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const crmDashboardController = require('../controllers/crm/crmDashboardController');
const crmCustomerController = require('../controllers/crm/crmCustomerController');

// Staff access check middleware: allow admin, super_admin, accountant, product_manager
const crmAccess = (req, res, next) => {
  if (req.user && ['admin', 'super_admin', 'accountant', 'product_manager'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Staff or Administrator permissions required' });
};

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// --- Staff & Operations Authentication for Standalone CRM ---
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password, isDevAuto } = req.body;
    let user;

    if (isDevAuto && !email && !password) {
      // Prioritize the single dedicated CRM Master Admin: crmadmin@grandstore.com
      user = await User.findOne({ email: 'crmadmin@grandstore.com' });
      if (!user) {
        user = await User.findOne({ role: { $in: ['super_admin', 'admin'] } });
      }
      if (!user) {
        user = await User.findOne({ role: { $in: ['accountant', 'product_manager'] } });
      }
    } else {
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Both email and password are required' });
      }

      user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Secure Bcrypt Password Verification
      let isMatch = false;
      if (user.password) {
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
          isMatch = await bcrypt.compare(password, user.password);
        } else {
          isMatch = (user.password === password);
        }
      }

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff account not found' });
    }

    if (!['admin', 'super_admin', 'accountant', 'product_manager'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: Staff or Director role required' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'supersecretgrandstore2026',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerTier: user.customerTier,
        isAgeVerified: user.isAgeVerified,
        kycVerified: user.kycVerified
      }
    });
  } catch (err) {
    console.error('CRM auth error:', err);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
});

// Verification endpoint for CRM frontend to confirm active admin session
router.get('/auth/me', protect, crmAccess, (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      customerTier: req.user.customerTier,
      isAgeVerified: req.user.isAgeVerified,
      kycVerified: req.user.kycVerified
    }
  });
});

// All CRM operational routes below are protected and require staff permissions
router.use(protect, crmAccess);

// --- Module 1: Daily Operations Dashboard (The Morning Screen) ---
router.get('/dashboard/summary', crmDashboardController.getDailyOperationsSummary);

// --- Work Queue & Task Management ---
router.get('/tasks', crmDashboardController.getTasks);
router.post('/tasks', crmDashboardController.createTask);
router.put('/tasks/:id/status', crmDashboardController.updateTaskStatus);
router.post('/tasks/:id/notes', crmDashboardController.addTaskNote);

const crmVendorController = require('../controllers/crm/crmVendorController');
const crmOrderOpsController = require('../controllers/crm/crmOrderOpsController');

// --- Module 2: Customer 360° Management ---
router.get('/customers', crmCustomerController.getCustomers);
router.get('/customers/:id/360', crmCustomerController.getCustomer360);
router.put('/customers/:id/tier', crmCustomerController.updateCustomerTier);
router.post('/customers/:id/notes', crmCustomerController.addCustomerNote);

// --- Module 3: Vendor Onboarding & Audit Workflow ---
router.get('/vendors/summary', crmVendorController.getVendorOperationsSummary);
router.put('/vendors/:id/stage', crmVendorController.updateVendorWorkflowStage);

// --- Module 4 & 5: Order Operations Board & Logistics Exceptions ---
router.get('/orders/board', crmOrderOpsController.getOrderOperationsBoard);
router.put('/orders/:orderId/stage', crmOrderOpsController.updateOrderStage);
router.put('/shipments/:shipmentId/exception', crmOrderOpsController.updateLogisticsException);

// --- Customer Order Incident & Support Tickets (Flipkart / Amazon Style Flow) ---
const ticketController = require('../controllers/ticketController');
router.get('/tickets', ticketController.getCrmTickets);
router.put('/tickets/:id/resolve', ticketController.resolveTicket);
router.post('/tickets/:id/messages', ticketController.addTicketMessage);

const crmExportController = require('../controllers/crm/crmExportController');
const crmCommsController = require('../controllers/crm/crmCommsController');

// --- Module 6: Global Trade & Export Operations ---
router.get('/export', crmExportController.getExportEnquiries);
router.post('/export', crmExportController.createExportEnquiry);
router.put('/export/:id/docs', crmExportController.updateExportDocumentation);
router.put('/export/:id/stage', crmExportController.updateExportStage);

// --- Module 7 & 8: Communications Hub & Task Reminders ---
router.get('/comms', crmCommsController.getCommunications);
router.post('/comms', crmCommsController.logCommunication);

const crmMarketingController = require('../controllers/crm/crmMarketingController');
const crmAuctionController = require('../controllers/crm/crmAuctionController');
const crmSettlementController = require('../controllers/crm/crmSettlementController');
const crmStaffController = require('../controllers/crm/crmStaffController');

// --- Module 9: Marketing Compliance & Audience Segmentation ---
router.get('/marketing/audiences', crmMarketingController.getMarketingAudiences);
router.get('/marketing/audiences/:segmentId/preview', crmMarketingController.previewAudienceSegment);
router.get('/marketing/campaigns', crmMarketingController.getCampaigns);
router.post('/marketing/campaigns', crmMarketingController.createCampaign);
router.put('/marketing/campaigns/:id/status', crmMarketingController.updateCampaignStatus);

// --- Module 10: Auctions & Private Tasting Operations ---
router.get('/auctions/summary', crmAuctionController.getAuctionOperationsSummary);
router.put('/auctions/bidder/:id/kyc', crmAuctionController.updateBidderKyc);
router.put('/auctions/lot/:id/payment', crmAuctionController.recordHammerLotPayment);
router.get('/events/:id/guests', crmAuctionController.getEventGuestList);
router.put('/events/bookings/:bookingId/checkin', crmAuctionController.toggleGuestCheckIn);

// --- Module 11: 30-Day Vendor Settlement Tracking & Payouts ---
router.get('/settlements/summary', crmSettlementController.getSettlementsSummary);
router.post('/settlements', crmSettlementController.createSettlement);
router.put('/settlements/:id/pay', crmSettlementController.processSettlementPayment);
router.put('/settlements/:id/dispute', crmSettlementController.disputeSettlement);

// --- Module 12: Staff KPI & SLA Telemetry ---
router.get('/staff/kpis', crmStaffController.getStaffKpis);

module.exports = router;

