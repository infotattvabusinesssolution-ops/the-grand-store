const User = require('../../models/User');
const Order = require('../../models/Order');
const AuctionLot = require('../../models/AuctionLot');
const Booking = require('../../models/Booking');
const TradeEnquiry = require('../../models/TradeEnquiry');
const WineEnquiry = require('../../models/WineEnquiry');
const CigarEnquiry = require('../../models/CigarEnquiry');
const CrmTask = require('../../models/CrmTask');
const Bid = require('../../models/Bid');
const SupportTicket = require('../../models/SupportTicket');

/**
 * Returns paginated customer list with rich CRM filters.
 */
exports.getCustomers = async (req, res) => {
  try {
    const { search, customerType, tag, page = 1, limit = 25 } = req.query;
    const query = { role: { $in: ['customer', 'vendor'] } };

    if (customerType) {
      query.crmCustomerType = customerType;
    }

    if (tag) {
      query.crmTags = tag;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [customers, total] = await Promise.all([
      User.find(query)
        .select('name email phone role crmCustomerType crmSource crmTags createdAt bidderLevel bidderApprovalStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      customers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve customer directory' });
  }
};

/**
 * Assembles the complete 360-degree customer dossier across all historical collections.
 */
exports.getCustomer360 = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password')
      .populate('wishlist', 'name price category image brand vintage country inStock stock');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer record not found' });
    }

    // Pre-query bids to find lots the customer participated in
    const userBids = await Bid.find({ user: id }).select('lot').lean();
    const biddedLotIds = [...new Set(userBids.map(b => b.lot).filter(Boolean))];

    // Parallel fetch across orders, auctions, bookings, enquiries, tasks, and tickets
    const [
      orders,
      biddedLots,
      eventBookings,
      tradeEnquiries,
      wineEnquiries,
      cigarEnquiries,
      customerTasks,
      customerTickets
    ] = await Promise.all([
      // 1. Order History
      Order.find({ $or: [{ user: id }, { customer: id }] })
        .select('orderId totalPrice totalAmount status isPaid createdAt shipments orderItems shippingAddress paymentMethod')
        .sort({ createdAt: -1 }),

      // 2. Auction Bidding & Won Lots
      AuctionLot.find({
        $or: [
          { _id: { $in: biddedLotIds } },
          { winner: id },
          { highBidder: id }
        ]
      })
      .select('title lotNumber startingBid currentBid winningBid status winner highBidder endDate images')
      .sort({ createdAt: -1 }),

      // 3. Tasting Event Passes
      Booking.find({ user: id })
        .populate('event', 'title eventDate venue pricePerTicket')
        .sort({ createdAt: -1 }),

      // 4. Trade Enquiries
      TradeEnquiry.find({ email: user.email.toLowerCase() }).sort({ createdAt: -1 }),

      // 5. Wine Sourcing Enquiries
      WineEnquiry.find({ email: user.email.toLowerCase() }).sort({ createdAt: -1 }),

      // 6. Cigar Enquiries
      CigarEnquiry.find({ email: user.email.toLowerCase() }).sort({ createdAt: -1 }),

      // 7. Assigned Follow-up Tasks
      CrmTask.find({
        $or: [
          { 'linkedEntity.entityId': id },
          { 'linkedEntity.referenceCode': user.email }
        ]
      })
      .populate('assignedTo', 'name email')
      .populate('completedBy', 'name')
      .sort({ createdAt: -1 }),

      // 8. Order Support Tickets
      SupportTicket.find({
        $or: [
          { customer: id },
          { customerEmail: user.email.toLowerCase() }
        ]
      }).sort({ createdAt: -1 })
    ]);

    // Financial calculations
    const paidOrders = orders.filter((o) => o.isPaid);
    const totalLifetimeSpend = paidOrders.reduce((sum, o) => sum + (o.totalPrice || o.totalAmount || 0), 0);
    const averageOrderValue = paidOrders.length > 0 ? totalLifetimeSpend / paidOrders.length : 0;
    const wonLots = biddedLots.filter((lot) => String(lot.winner) === String(id) || String(lot.winningBidder) === String(id));

    return res.status(200).json({
      success: true,
      profile: user,
      dossier: {
        lifetimeSpend: totalLifetimeSpend,
        totalOrdersCount: orders.length,
        paidOrdersCount: paidOrders.length,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        auctionLotsBidded: biddedLots.length,
        auctionLotsWon: wonLots.length,
        eventsAttended: eventBookings.length,
        openTicketsCount: customerTickets.filter(t => ['open', 'investigating', 'courier_traced'].includes(t.status)).length
      },
      history: {
        orders,
        auctions: biddedLots,
        eventBookings,
        enquiries: {
          trade: tradeEnquiries,
          wine: wineEnquiries,
          cigar: cigarEnquiries
        },
        tickets: customerTickets,
        wishlist: user.wishlist || [],
        tasks: customerTasks,
        internalNotes: user.crmInternalNotes || []
      }
    });
  } catch (error) {
    console.error('Error fetching Customer 360:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving customer 360 dossier' });
  }
};

/**
 * Update customer tier, account manager, or tags.
 */
exports.updateCustomerTier = async (req, res) => {
  try {
    const { id } = req.params;
    const { crmCustomerType, crmAccountManager, crmTags, crmPreferences } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (crmCustomerType) {
      user.crmCustomerType = crmCustomerType;
      // Synchronize with main platform customerTier so both CRM and Store Admin stay aligned
      if (crmCustomerType === 'vip_collector') {
        user.customerTier = 'premium';
      } else if (crmCustomerType === 'trade_buyer' || crmCustomerType === 'corporate_client') {
        user.customerTier = 'trade_wholesale';
      } else if (crmCustomerType === 'retail') {
        user.customerTier = 'retail';
      }
    }
    if (crmAccountManager !== undefined) user.crmAccountManager = crmAccountManager;
    if (crmTags) user.crmTags = crmTags;
    if (crmPreferences) {
      user.crmPreferences = {
        ...user.crmPreferences,
        ...crmPreferences
      };
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Customer CRM profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerTier: user.customerTier,
        crmCustomerType: user.crmCustomerType,
        crmTags: user.crmTags,
        crmPreferences: user.crmPreferences
      }
    });
  } catch (error) {
    console.error('Failed to update customer tier:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update customer tier' });
  }
};

/**
 * Add an internal staff note to the customer's timeline.
 */
exports.addCustomerNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Customer not found' });

    user.crmInternalNotes.push({
      note,
      author: req.user?._id,
      authorName: req.user?.name || 'Staff'
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Internal note added to customer dossier',
      internalNotes: user.crmInternalNotes
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add internal note' });
  }
};
