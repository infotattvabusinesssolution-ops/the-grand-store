const express = require('express');
const router = express.Router();
const payfastController = require('../controllers/payfastController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.post('/generate-shop', optionalAuth, payfastController.generateShopPayment);
router.post('/generate-auction', protect, payfastController.generateAuctionPayment);
router.post('/generate-deposit', protect, payfastController.generateDepositPayment);
router.post('/generate-event', protect, payfastController.generateEventPayment);
router.post('/generate-vendor', protect, payfastController.generateVendorPayment);
router.post('/generate-maintenance', protect, payfastController.generateMaintenancePayment);
router.post('/confirm-order', optionalAuth, payfastController.confirmOrderPayment);
router.get('/mobile-return', payfastController.mobileReturnHandler);
// PayFast posts ITNs as application/x-www-form-urlencoded form data, not JSON.
// Keep this parser on the public callback route so req.body contains the
// payment_status, m_payment_id, and signature fields sent by PayFast.
router.post('/itn', express.urlencoded({ extended: true, type: '*/*' }), payfastController.itnWebhook);
router.post('/notify', express.urlencoded({ extended: true, type: '*/*' }), payfastController.itnWebhook);

module.exports = router;
