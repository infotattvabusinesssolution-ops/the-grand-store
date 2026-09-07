const express = require('express');
const router = express.Router();
const { 
  createEvent, 
  getEvents, 
  getEventById, 
  getVendorEvents,
  bookEvent,
  getUserBookings,
  getEventAttendees,
  verifyTicket,
  joinWaitlist,
  getAdminEvents,
  approveEvent,
  rejectEvent,
  uploadEventBankTransferProof,
  approveEventBankTransfer,
  rejectEventBankTransfer,
  downloadTicketPdf,
  resendTicketEmail
} = require('../controllers/eventControllerV2');

const { protect, superAdmin, financeStaff } = require('../middleware/authMiddleware');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

router.route('/')
  .post(protect, upload.single('image'), createEvent)
  .get(getEvents);

router.route('/bookings/my-tickets')
  .get(protect, getUserBookings);

router.route('/bookings/:bookingId/ticket-pdf')
  .get(downloadTicketPdf);

router.route('/bookings/:bookingId/resend-ticket')
  .post(protect, resendTicketEmail);

router.route('/bookings/:bookingId/bank-transfer/upload')
  .post(protect, uploadEventBankTransferProof);

router.route('/bookings/:bookingId/bank-transfer/approve')
  .post(protect, financeStaff, approveEventBankTransfer);

router.route('/bookings/:bookingId/bank-transfer/reject')
  .post(protect, financeStaff, rejectEventBankTransfer);

router.route('/vendor')
  .get(protect, getVendorEvents);

router.route('/vendor/:id/attendees')
  .get(protect, getEventAttendees);

router.route('/vendor/verify-ticket')
  .post(protect, verifyTicket);

router.route('/admin')
  .get(protect, superAdmin, getAdminEvents);

router.route('/admin/:id/approve')
  .put(protect, superAdmin, approveEvent);

router.route('/admin/:id/reject')
  .put(protect, superAdmin, rejectEvent);

router.route('/:id/book')
  .post(protect, bookEvent);

router.route('/:id/waitlist')
  .post(protect, joinWaitlist);

router.route('/:id')
  .get(getEventById);

module.exports = router;
