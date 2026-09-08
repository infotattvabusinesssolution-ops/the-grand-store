const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  getVendorOrders,
  updateShipmentStatus,
  getMyOrders,
  markOrderAsPaid,
  getAdminOrders,
  getAdminOrderById,
  sendAdminOrderMessage
} = require('../controllers/orderController');
const { protect, optionalAuth, requireRoles, financeStaff } = require('../middleware/authMiddleware');

router.route('/').post(optionalAuth, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);

// Admin Master Order Management & Custom Customer Messaging
router.route('/admin/all').get(
  protect,
  requireRoles('admin', 'super_admin', 'product_manager'),
  getAdminOrders
);
router.route('/admin/:id').get(
  protect,
  requireRoles('admin', 'super_admin', 'product_manager'),
  getAdminOrderById
);
router.route('/:id/admin-message').post(
  protect,
  requireRoles('admin', 'super_admin', 'product_manager'),
  sendAdminOrderMessage
);

router.route('/:id/pay').put(optionalAuth, markOrderAsPaid).post(optionalAuth, markOrderAsPaid);
router.route('/vendor/sales').get(
  protect,
  requireRoles('vendor_active', 'admin', 'super_admin', 'product_manager'),
  getVendorOrders,
);
router.route('/vendor/sales/:shipmentId/status').patch(
  protect,
  requireRoles('vendor_active', 'admin', 'super_admin', 'product_manager'),
  updateShipmentStatus,
);

router.route('/:id').get(optionalAuth, getOrderById);

// Bank Transfer Routes
const { uploadProofOfPayment, approvePayment, rejectPayment } = require('../controllers/bankTransferController');
router.route('/:orderId/bank-transfer/upload').post(optionalAuth, uploadProofOfPayment);
router.route('/:orderId/bank-transfer/approve').post(protect, financeStaff, approvePayment);
router.route('/:orderId/bank-transfer/reject').post(protect, financeStaff, rejectPayment);

module.exports = router;
