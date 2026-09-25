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

/**
 * Bulk import customers via CSV / JSON payload.
 * Supports statutory 18+ verification, cohort tagging, customer tier assignment, and safe upsert.
 */
exports.bulkImportCustomers = async (req, res) => {
  try {
    const { 
      customers, 
      defaultCustomerType = 'retail', 
      defaultAgeVerified = true,
      defaultTags = [],
      targetSegment = '',
      updateExisting = true 
    } = req.body;

    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ success: false, message: 'No customer records provided for import' });
    }

    if (customers.length > 2000) {
      return res.status(400).json({ success: false, message: 'Batch limit exceeded. Maximum 2,000 customers per import.' });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];

    const validTypes = ['retail', 'vip_collector', 'trade_buyer', 'corporate_client'];

    for (let i = 0; i < customers.length; i++) {
      const row = customers[i];
      const rowNumber = i + 1;

      // Extract and normalize email
      const rawEmail = row.email || row.Email || row['Email Address'] || row['email_address'];
      if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.includes('@')) {
        errors.push({ row: rowNumber, reason: `Invalid or missing email address (${rawEmail || 'empty'})` });
        skippedCount++;
        continue;
      }
      const email = rawEmail.toLowerCase().trim();

      // Extract and normalize name
      const rawName = row.name || row.Name || row['Full Name'] || row['Customer Name'] || row.fullName;
      const name = (rawName && typeof rawName === 'string' && rawName.trim().length > 0)
        ? rawName.trim()
        : email.split('@')[0];

      // Extract phone
      const rawPhone = row.phone || row.Phone || row['Phone Number'] || row['Mobile'] || row.mobile || '';
      const phone = typeof rawPhone === 'string' ? rawPhone.trim() : String(rawPhone || '').trim();

      // Determine customer type
      let customerType = (row.customerType || row.crmCustomerType || row.Type || row.Tier || row.tier || defaultCustomerType || 'retail')
        .toLowerCase()
        .trim()
        .replace(/ /g, '_');
      if (!validTypes.includes(customerType)) {
        if (customerType.includes('vip') || customerType.includes('collector')) customerType = 'vip_collector';
        else if (customerType.includes('trade') || customerType.includes('wholesale')) customerType = 'trade_buyer';
        else if (customerType.includes('corp')) customerType = 'corporate_client';
        else customerType = 'retail';
      }

      // Determine customer tier
      let customerTier = 'retail';
      if (customerType === 'vip_collector') customerTier = 'premium';
      else if (customerType === 'trade_buyer') customerTier = 'trade_wholesale';
      else if (customerType === 'corporate_client') customerTier = 'premium';

      // Age verified check (South African statutory 18+ fine liquor compliance)
      let isAgeVerified = defaultAgeVerified !== false;
      const rawAgeVal = row.isAgeVerified ?? row.ageVerified ?? row['18+'] ?? row['18+ Verified'] ?? row['Age Verified'];
      if (rawAgeVal !== undefined && rawAgeVal !== null) {
        const strVal = String(rawAgeVal).toLowerCase().trim();
        isAgeVerified = (strVal === 'true' || strVal === 'yes' || strVal === '1' || strVal === 'y');
      }

      // Collect tags
      const tagSet = new Set();
      if (Array.isArray(defaultTags)) {
        defaultTags.forEach(t => t && tagSet.add(String(t).trim()));
      }
      if (targetSegment) {
        tagSet.add(targetSegment.trim());
      }
      const rawTags = row.tags || row.crmTags || row.Tags || row.Tag;
      if (Array.isArray(rawTags)) {
        rawTags.forEach(t => t && tagSet.add(String(t).trim()));
      } else if (typeof rawTags === 'string') {
        rawTags.split(/[,;|]/).forEach(t => t && t.trim() && tagSet.add(t.trim()));
      }
      tagSet.add('import_csv');
      const finalTags = Array.from(tagSet);

      const notes = row.notes || row.Notes || row.note || row.Note || '';

      try {
        let existingUser = await User.findOne({ email });

        if (existingUser) {
          if (!updateExisting) {
            skippedCount++;
            continue;
          }

          // Update existing patron
          if (name && (!existingUser.name || existingUser.name === email.split('@')[0])) {
            existingUser.name = name;
          }
          if (phone && !existingUser.phone) {
            existingUser.phone = phone;
            existingUser.phoneNumber = phone;
          }
          if (customerType && customerType !== 'retail') {
            existingUser.crmCustomerType = customerType;
            existingUser.customerTier = customerTier;
          }
          if (isAgeVerified) {
            existingUser.isAgeVerified = true;
            if (!existingUser.crmPreferences) existingUser.crmPreferences = {};
            existingUser.crmPreferences.isAgeVerified = true;
            existingUser.crmPreferences.marketingConsent = true;
          }

          // Merge tags
          const existingTags = new Set(existingUser.crmTags || []);
          finalTags.forEach(t => existingTags.add(t));
          existingUser.crmTags = Array.from(existingTags);

          if (notes) {
            if (!existingUser.crmInternalNotes) existingUser.crmInternalNotes = [];
            existingUser.crmInternalNotes.push({
              note: `[CSV Bulk Import] ${notes}`,
              author: req.user?._id,
              authorName: req.user?.name || 'CRM Staff'
            });
          }

          await existingUser.save();
          updatedCount++;
        } else {
          // Create new patron
          const newUser = new User({
            name,
            email,
            phone,
            phoneNumber: phone,
            role: 'customer',
            crmCustomerType: customerType,
            customerTier,
            crmSource: 'import_csv',
            crmTags: finalTags,
            isAgeVerified,
            crmPreferences: {
              preferredContactMethod: phone ? 'whatsapp' : 'email',
              marketingConsent: true,
              consentDate: new Date(),
              isAgeVerified,
              ageVerifiedAt: isAgeVerified ? new Date() : undefined
            }
          });

          if (notes) {
            newUser.crmInternalNotes = [{
              note: `[CSV Bulk Import] ${notes}`,
              author: req.user?._id,
              authorName: req.user?.name || 'CRM Staff'
            }];
          }

          await newUser.save();
          createdCount++;
        }
      } catch (rowErr) {
        errors.push({ row: rowNumber, email, reason: rowErr.message });
        skippedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${customers.length} records: ${createdCount} created, ${updatedCount} updated${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`,
      summary: {
        total: customers.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors
      }
    });
  } catch (error) {
    console.error('Failed to bulk import customers:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during customer import' });
  }
};

