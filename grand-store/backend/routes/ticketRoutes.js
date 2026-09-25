const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const ticketController = require('../controllers/ticketController');

// Staff access check middleware: allow admin, super_admin, accountant, product_manager
const crmAccess = (req, res, next) => {
  if (req.user && ['admin', 'super_admin', 'accountant', 'product_manager'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Staff permissions required' });
};

// Customer endpoints (Protected by standard JWT)
router.post('/create', protect, ticketController.createTicket);
router.get('/my-tickets', protect, ticketController.getMyTickets);
router.get('/:id', protect, ticketController.getTicketById);
router.post('/:id/messages', protect, ticketController.addTicketMessage);

// Staff / Operations endpoints
router.get('/crm/all', protect, crmAccess, ticketController.getCrmTickets);
router.put('/crm/:id/resolve', protect, crmAccess, ticketController.resolveTicket);

module.exports = router;
