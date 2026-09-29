const express = require('express');
const router = express.Router();
const {
  getRates,
  getPostalCodes,
  vendorDispatchOrder,
  generateWaybillPdf,
  adminBookCollection,
  adminGetManifest,
  adminCompleteDelivery,
  trackWaybill
} = require('../controllers/aramexController');

// 1. CUSTOMER ROUTES
router.post('/rates', getRates);
router.post('/rate', getRates);
router.get('/postal-codes', getPostalCodes);
router.get('/suburbs', getPostalCodes);
router.get('/track/:waybillNumber', trackWaybill);

// 2. VENDOR ROUTES
router.post('/vendor/dispatch', vendorDispatchOrder);
router.post('/create-waybill', vendorDispatchOrder);
router.get('/waybill-pdf/:waybillNumber', generateWaybillPdf);
router.get('/label/:waybillNumber', generateWaybillPdf);

// 3. ADMIN ROUTES
router.post('/admin/book-collection', adminBookCollection);
router.post('/book-collection', adminBookCollection);
router.get('/admin/manifest', adminGetManifest);
router.get('/manifest', adminGetManifest);
router.post('/admin/complete-delivery', adminCompleteDelivery);
router.post('/complete-delivery', adminCompleteDelivery);

module.exports = router;
