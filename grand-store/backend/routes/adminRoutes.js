const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const financeController = require('../controllers/financeController');
const testimonialController = require('../controllers/testimonialController');
const { protect, superAdmin, financeStaff } = require('../middleware/authMiddleware');
const { adminLogin } = require('../controllers/authController');

// Public Admin Authentication Endpoint Alias
router.post('/login', adminLogin);

router.use(protect);

// Anyone in staff/admin can see dashboard metrics (frontend handles component visibility)
router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', superAdmin, adminController.getAllUsers);
router.get('/vendors', superAdmin, adminController.getAllVendors);
router.get('/vendors/:id', superAdmin, adminController.getVendorById);
router.put('/vendors/:id/status', superAdmin, adminController.updateVendorStatus);
router.put('/vendors/:id/payment-status', superAdmin, adminController.updateVendorPaymentStatus);
router.put('/vendors/:id/maintenance-fee', superAdmin, adminController.updateVendorMaintenanceFee);
router.post('/vendors/:id/remind-payment', superAdmin, adminController.remindVendorPayment);
router.get('/staff', superAdmin, adminController.getStaffAccounts);
router.post('/staff', superAdmin, adminController.createStaffAccount);
router.put('/staff/:id', superAdmin, adminController.updateStaffCredentials);

router.get('/finance', financeStaff, financeController.getAdminFinanceOverview);
router.get('/bank-transfers', financeStaff, adminController.getPendingBankTransfers);
router.get('/guest-verifications', adminController.getGuestVerifications);
router.put('/orders/:orderId/guest-kyc/verify', adminController.verifyGuestKyc);
router.put('/orders/:orderId/guest-kyc/reject', adminController.rejectGuestKyc);

router.route('/testimonials')
  .get(superAdmin, testimonialController.getAdminTestimonials)
  .post(superAdmin, testimonialController.createTestimonial);

router.route('/testimonials/:id')
  .put(superAdmin, testimonialController.updateTestimonial)
  .delete(superAdmin, testimonialController.deleteTestimonial);

module.exports = router;
