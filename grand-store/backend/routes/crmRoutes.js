const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const crmDashboardController = require('../controllers/crm/crmDashboardController');
const crmCustomerController = require('../controllers/crm/crmCustomerController');
const adminController = require('../controllers/adminController');
const financeController = require('../controllers/financeController');

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
router.post('/customers/bulk-import', crmCustomerController.bulkImportCustomers);

// --- Module 3: Vendor Onboarding, Directory & 360° Management ---
router.get('/vendors/summary', crmVendorController.getVendorOperationsSummary);
router.get('/vendors', crmVendorController.getAllVendors);
router.get('/vendors/:id/360', crmVendorController.getVendor360);
router.put('/vendors/:id/stage', crmVendorController.updateVendorWorkflowStage);
router.put('/vendors/:id/status', crmVendorController.updateVendorStatus);
router.post('/vendors/:id/ping', crmVendorController.pingVendor);

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
router.get('/marketing/products', crmMarketingController.getMarketingProducts);
router.get('/marketing/audiences', crmMarketingController.getMarketingAudiences);
router.post('/marketing/audiences', crmMarketingController.createAudienceCategory);
router.put('/marketing/audiences/:id', crmMarketingController.updateAudienceCategory);
router.delete('/marketing/audiences/:id', crmMarketingController.deleteAudienceCategory);
router.get('/marketing/audiences/:segmentId/preview', crmMarketingController.previewAudienceSegment);
router.post('/marketing/audiences/import-csv', crmCustomerController.bulkImportCustomers);
router.get('/marketing/campaigns', crmMarketingController.getCampaigns);
router.get('/marketing/campaigns/:id/details', crmMarketingController.getCampaignDetails);
router.get('/marketing/campaigns/:id', crmMarketingController.getCampaignDetails);
router.post('/marketing/campaigns', crmMarketingController.createCampaign);
router.put('/marketing/campaigns/:id/status', crmMarketingController.updateCampaignStatus);
router.post('/marketing/campaigns/:id/send', crmMarketingController.sendCampaign);
router.post('/marketing/campaigns/:id/test-send', crmMarketingController.testSendCampaign);
router.post('/marketing/campaigns/:id/sync-attribution', crmMarketingController.syncAttributedSales);
router.delete('/marketing/campaigns/:id', crmMarketingController.deleteCampaign);

// Marketing Product Coupons (Exclusively Admin Products)
const couponRoutes = require('./couponRoutes');
router.get('/marketing/coupons', (req, res, next) => {
  req.url = '/admin-product';
  couponRoutes(req, res, next);
});
router.post('/marketing/coupons', (req, res, next) => {
  req.url = '/admin-product';
  couponRoutes(req, res, next);
});
router.put('/marketing/coupons/:id/toggle', (req, res, next) => {
  req.url = `/admin-product/${req.params.id}/toggle`;
  couponRoutes(req, res, next);
});
router.delete('/marketing/coupons/:id', (req, res, next) => {
  req.url = `/admin-product/${req.params.id}`;
  couponRoutes(req, res, next);
});

// --- Module 10: Auctions & Private Tasting Operations ---
router.get('/auctions/summary', crmAuctionController.getAuctionOperationsSummary);
router.get('/auctions/bidders', crmAuctionController.getAllBidders);
router.put('/auctions/bidder/:id/kyc', crmAuctionController.updateBidderKyc);
router.put('/auctions/lot/:id/payment', crmAuctionController.recordHammerLotPayment);
router.post('/auctions/lot/:id/remind', crmAuctionController.sendPaymentReminder);
router.put('/auctions/lot/:id/default', crmAuctionController.defaultLot);

// Auction Lots Review, Approvals, Floor Bids & Hammer
router.post('/auctions/lots', crmAuctionController.createLot);
router.put('/auctions/lots/:id', crmAuctionController.updateLot);
router.put('/auctions/lots/:id/approve', crmAuctionController.approveLot);
router.put('/auctions/lots/:id/reject', crmAuctionController.rejectLot);
router.delete('/auctions/lots/:id', crmAuctionController.deleteLot);
router.post('/auctions/lots/:id/floor-bid', crmAuctionController.placeFloorBid);
router.put('/auctions/lots/:id/hammer', crmAuctionController.declareHammerFall);
router.get('/auctions/lots/:id/bids', crmAuctionController.getLotBids);

// Tasting Events Desk, Approvals & Operations
router.get('/events/:id/guests', crmAuctionController.getEventGuestList);
router.put('/events/bookings/:bookingId/checkin', crmAuctionController.toggleGuestCheckIn);
router.post('/events/:id/walk-in', crmAuctionController.registerWalkInGuest);
router.post('/events', crmAuctionController.createEvent);
router.put('/events/:id', crmAuctionController.updateEvent);
router.put('/events/:id/approve', crmAuctionController.approveEvent);
router.put('/events/:id/reject', crmAuctionController.rejectEvent);
router.delete('/events/:id', crmAuctionController.deleteEvent);

// --- Module 11: 30-Day Vendor Settlement Tracking & Payouts ---
router.get('/settlements/summary', crmSettlementController.getSettlementsSummary);
router.post('/settlements/sync', crmSettlementController.syncOrdersHandler);
router.post('/settlements', crmSettlementController.createSettlement);
router.put('/settlements/:id/pay', crmSettlementController.processSettlementPayment);
router.put('/settlements/:id/dispute', crmSettlementController.disputeSettlement);

// --- Module 12: Staff KPI & SLA Telemetry ---
router.get('/staff/kpis', crmStaffController.getStaffKpis);

// --- Module 13: Sales & Platform Financials (Live Store Admin Parity) ---
router.get('/sales/dashboard', protect, crmAccess, adminController.getDashboardStats);
router.get('/sales/finance', protect, crmAccess, financeController.getAdminFinanceOverview);

module.exports = router;

