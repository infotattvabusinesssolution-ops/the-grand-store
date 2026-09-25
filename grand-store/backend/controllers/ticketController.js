const SupportTicket = require('../models/SupportTicket');
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Generate unique luxury incident code e.g. TICK-26-8042
 */
function generateTicketNumber() {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `TICK-26-${randomDigits}`;
}

/**
 * @desc    Customer creates a support ticket for an order item
 * @route   POST /api/tickets/create
 * @access  Private (Customer)
 */
exports.createTicket = async (req, res) => {
  try {
    const { orderId, orderItemId, issueType, message, productSnapshot } = req.body;
    const userId = req.user._id;

    if (!orderId || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Order reference and problem description are required' });
    }

    // Find and verify order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Confirm customer ownership
    const isOwner = String(order.user) === String(userId) || String(order.customer) === String(userId);
    if (!isOwner && req.user.role === 'customer') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this order' });
    }

    // Extract product details from order items
    let matchedItem = null;
    if (order.orderItems && order.orderItems.length > 0) {
      if (orderItemId) {
        matchedItem = order.orderItems.find(item => String(item._id) === String(orderItemId) || String(item.product) === String(orderItemId));
      }
      if (!matchedItem) {
        matchedItem = order.orderItems[0]; // fallback to first item
      }
    }

    const itemData = {
      product: matchedItem?.product || productSnapshot?.product || 'custom_product',
      name: matchedItem?.name || productSnapshot?.name || 'Grand Store Selection Bottle',
      image: matchedItem?.image || productSnapshot?.image || '',
      quantity: matchedItem?.quantity || 1,
      price: matchedItem?.price || 0,
      option: matchedItem?.option || '',
    };

    // Ensure unique ticket number
    let ticketNum = generateTicketNumber();
    let existing = await SupportTicket.findOne({ ticketNumber: ticketNum });
    while (existing) {
      ticketNum = generateTicketNumber();
      existing = await SupportTicket.findOne({ ticketNumber: ticketNum });
    }

    // Issue type human readable labels
    const issueLabels = {
      delivery_delayed: 'Item Not Delivered / Delayed Delivery',
      damaged_bottle: 'Damaged / Broken Bottle upon Arrival',
      wrong_item: 'Wrong Item / Missing Bottles from Parcel',
      tracking_stuck: 'Courier Tracking Not Updating',
      postnet_pin_issue: 'PostNet Collection PIN Issue',
      general_inquiry: 'General Concierge Inquiry'
    };

    const friendlyIssue = issueLabels[issueType] || 'Delivery & Item Support Request';

    const ticket = new SupportTicket({
      ticketNumber: ticketNum,
      customer: userId,
      customerName: req.user.name || 'Valued Patron',
      customerEmail: req.user.email,
      order: order._id,
      orderId: order.orderId || String(order._id),
      orderItem: itemData,
      issueType: issueType || 'delivery_delayed',
      subject: friendlyIssue,
      status: 'open',
      priority: ['delivery_delayed', 'damaged_bottle'].includes(issueType) ? 'high' : 'medium',
      conversation: [
        {
          sender: 'customer',
          senderName: req.user.name || 'Customer',
          message: message.trim(),
          createdAt: new Date()
        },
        {
          sender: 'concierge',
          senderName: 'The Grand Store Concierge',
          message: `Hello ${req.user.name || 'valued patron'}. We have logged Priority Incident #${ticketNum} regarding your bottle "${itemData.name}". Our logistics desk and cellar team have been alerted. We are actively investigating your consignment.`,
          createdAt: new Date(Date.now() + 1000)
        }
      ]
    });

    await ticket.save();

    return res.status(201).json({
      success: true,
      message: 'Support ticket opened successfully',
      ticket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create support ticket' });
  }
};

/**
 * @desc    Get all support tickets for logged-in customer
 * @route   GET /api/tickets/my-tickets
 * @access  Private (Customer)
 */
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const tickets = await SupportTicket.find({ customer: userId })
      .populate('order', 'orderId totalPrice totalAmount status isPaid createdAt')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      tickets
    });
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving tickets' });
  }
};

/**
 * @desc    Get single ticket details with thread
 * @route   GET /api/tickets/:id
 * @access  Private
 */
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id)
      .populate('customer', 'name email phone customerTier')
      .populate('order');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    // Customer can only view their own ticket, staff can view any
    const isCustomer = req.user.role === 'customer';
    if (isCustomer && String(ticket.customer._id || ticket.customer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve ticket' });
  }
};

/**
 * @desc    Append message to ticket thread (Customer or Staff)
 * @route   POST /api/tickets/:id/messages
 * @access  Private
 */
exports.addTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const isStaff = ['admin', 'super_admin', 'accountant', 'product_manager'].includes(req.user.role);
    const isOwner = String(ticket.customer) === String(req.user._id);

    if (!isStaff && !isOwner) {
      return res.status(403).json({ success: false, message: 'Unauthorized to reply to this ticket' });
    }

    const senderRole = isStaff ? 'concierge' : 'customer';
    const senderName = isStaff ? (req.user.name || 'Concierge Desk') : (req.user.name || 'Customer');

    ticket.conversation.push({
      sender: senderRole,
      senderName,
      message: message.trim(),
      attachments: attachments || [],
      createdAt: new Date()
    });

    // If customer replies after resolution, re-open for review
    if (!isStaff && ticket.status === 'resolved') {
      ticket.status = 'investigating';
    }

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: 'Message added to ticket conversation',
      conversation: ticket.conversation,
      status: ticket.status
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

/**
 * @desc    Get all tickets for CRM & Admin operations
 * @route   GET /api/crm/tickets
 * @access  Private (Staff)
 */
exports.getCrmTickets = async (req, res) => {
  try {
    const { status, issueType, priority, search } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (issueType && issueType !== 'all') {
      query.issueType = issueType;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { ticketNumber: { $regex: term, $options: 'i' } },
        { orderId: { $regex: term, $options: 'i' } },
        { customerName: { $regex: term, $options: 'i' } },
        { customerEmail: { $regex: term, $options: 'i' } },
        { 'orderItem.name': { $regex: term, $options: 'i' } }
      ];
    }

    const tickets = await SupportTicket.find(query)
      .populate('customer', 'name email phone customerTier')
      .populate('order', 'orderId totalPrice totalAmount status isPaid shippingAddress')
      .sort({ createdAt: -1 });

    const openCount = await SupportTicket.countDocuments({ status: { $in: ['open', 'investigating'] } });
    const courierTracedCount = await SupportTicket.countDocuments({ status: 'courier_traced' });
    const resolvedCount = await SupportTicket.countDocuments({ status: { $in: ['resolved', 'reshipped', 'refunded', 'closed'] } });

    return res.status(200).json({
      success: true,
      tickets,
      counts: {
        total: tickets.length,
        open: openCount,
        courierTraced: courierTracedCount,
        resolved: resolvedCount
      }
    });
  } catch (error) {
    console.error('Error fetching CRM tickets:', error);
    return res.status(500).json({ success: false, message: 'Failed to load tickets for CRM' });
  }
};

/**
 * @desc    Staff resolves ticket with specific action (courier trace, replacement, refund)
 * @route   PUT /api/crm/tickets/:id/resolve
 * @access  Private (Staff)
 */
exports.resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionTaken, resolutionNotes, refundAmount, replacementOrderId } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    let targetStatus = 'resolved';
    let systemNotice = '';

    if (actionTaken === 'courier_trace') {
      targetStatus = 'courier_traced';
      systemNotice = `Concierge Notice: Urgent courier trace requested for order #${ticket.orderId}. The dispatch team is following up with the courier distribution depot.`;
    } else if (actionTaken === 'free_replacement') {
      targetStatus = 'reshipped';
      systemNotice = `Concierge Notice: A complimentary priority replacement for "${ticket.orderItem?.name}" has been authorized and queued for express shipment.`;
    } else if (actionTaken === 'wallet_refund') {
      targetStatus = 'refunded';
      systemNotice = `Concierge Notice: A refund of R ${(refundAmount || ticket.orderItem?.price || 0).toLocaleString()} has been approved and issued to the customer.`;
    } else {
      targetStatus = 'resolved';
      systemNotice = `Concierge Notice: Support ticket #${ticket.ticketNumber} marked as resolved. Reason: ${resolutionNotes || 'Inquiry addressed with patron.'}`;
    }

    ticket.status = targetStatus;
    ticket.resolution = {
      actionTaken: actionTaken || 'resolved',
      resolvedBy: req.user._id,
      resolvedByName: req.user.name || 'Concierge Lead',
      resolvedAt: new Date(),
      resolutionNotes: resolutionNotes || '',
      refundAmount: refundAmount || 0,
      replacementOrderId: replacementOrderId || ''
    };

    // Append official resolution notice to the customer's chat thread
    ticket.conversation.push({
      sender: 'concierge',
      senderName: req.user.name || 'The Grand Store Concierge',
      message: systemNotice,
      createdAt: new Date()
    });

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: `Ticket #${ticket.ticketNumber} successfully updated to ${targetStatus}`,
      ticket
    });
  } catch (error) {
    console.error('Error resolving ticket:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to resolve ticket' });
  }
};
