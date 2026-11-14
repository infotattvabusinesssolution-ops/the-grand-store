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
router.delete('/users/:id', superAdmin, adminController.deleteUser);
router.get('/vendors', superAdmin, adminController.getAllVendors);
router.post('/vendors', superAdmin, adminController.createVendor);
router.get('/vendors/:id', superAdmin, adminController.getVendorById);
router.delete('/vendors/:id', superAdmin, adminController.deleteVendor);
router.put('/vendors/:id/status', superAdmin, adminController.updateVendorStatus);
router.put('/vendors/:id/toggle-active', superAdmin, adminController.toggleVendorActive);
router.put('/vendors/:id/basic-info', superAdmin, adminController.updateVendorBasicInfo);
router.post('/vendors/:id/reset-password', superAdmin, adminController.resetVendorPassword);
router.put('/vendors/:id/banking', superAdmin, adminController.updateVendorBanking);
router.put('/vendors/:id/payment-status', superAdmin, adminController.updateVendorPaymentStatus);
router.put('/vendors/:id/maintenance-fee', superAdmin, adminController.updateVendorMaintenanceFee);
router.post('/vendors/:id/remind-payment', superAdmin, adminController.remindVendorPayment);
router.get('/staff', superAdmin, adminController.getStaffAccounts);
router.post('/staff', superAdmin, adminController.createStaffAccount);
router.put('/staff/:id', superAdmin, adminController.updateStaffCredentials);

router.get('/finance', financeStaff, financeController.getAdminFinanceOverview);
router.get('/bank-transfers', financeStaff, adminController.getPendingBankTransfers);
router.get('/payouts', financeStaff, adminController.getVendorPayouts);
router.put('/payouts/:id/status', financeStaff, adminController.updateVendorPayoutStatus);
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
