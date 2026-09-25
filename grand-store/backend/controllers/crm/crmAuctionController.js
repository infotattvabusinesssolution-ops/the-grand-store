const mongoose = require('mongoose');
const AuctionLot = require('../../models/AuctionLot');
const Event = require('../../models/Event');
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const Bid = require('../../models/Bid');
const CrmTask = require('../../models/CrmTask');
const { sendEmail } = require('../../utils/emailService');

// @desc    Get Auction & Tasting Operations Hub Summary
// @route   GET /api/crm/auctions/summary
// @access  Staff / CRM
exports.getAuctionOperationsSummary = async (req, res) => {
  try {
    // 1. Pending Bidder KYC Verification Queue
    const pendingBidders = await User.find({
      bidderApprovalStatus: { $in: ['pending_approval', 'pending_verification'] }
    })
      .select('name email phone idType idNumber idDocumentUrl proofOfResidenceUrl bidderLevel biddingLimit bidderApprovalStatus createdAt')
      .sort({ createdAt: -1 });

    // 2. Unpaid Hammer Lots (Lots marked sold with paymentStatus Pending or Awaiting_Approval)
    const unpaidLots = await AuctionLot.find({
      status: 'sold',
      paymentStatus: { $in: ['Pending', 'Awaiting_Approval'] }
    })
      .populate('winner', 'name email phone customerTier')
      .populate('vendor', 'name email')
      .select('title lotNumber winningBid totalPaidByBuyer paymentStatus fulfilmentStatus endDate winner vendor gsReference reminderSent reminderSentAt createdAt')
      .sort({ endDate: -1 });

    // Clean up any test lots/events accidentally created under admin account
    if (req.user && req.user._id) {
      await AuctionLot.deleteMany({ vendor: req.user._id, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
      await Event.deleteMany({ vendorId: req.user._id, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
    }

    // Auto-seed pending vendor review records if none exist
    try {
      const pEventCount = await Event.countDocuments({ approvalStatus: 'pending_approval' });
      const pLotCount = await AuctionLot.countDocuments({ status: 'pending_approval' });
      let seedVendor = await User.findOne({ role: 'vendor' });
      if (!seedVendor) seedVendor = await User.findOne({ role: { $in: ['vendor', 'admin', 'super_admin'] } });

      if (seedVendor && pEventCount === 0) {
        await Event.create({
          title: 'Vergelegen Estate Heritage Cabernet & Bordeaux Blend Tasting',
          slug: 'vergelegen-heritage-cabernet-tasting-' + Date.now().toString().slice(-4),
          type: 'Wine Tasting',
          format: 'Physical',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          startTime: '18:30',
          endTime: '21:30',
          location: 'Vergelegen Wine Estate Manor House, Somerset West',
          city: 'Cape Town',
          capacity: 35,
          ticketTiers: [
            { name: 'General Admission', price: 450, quantity: 25, benefits: ['Library Vintage Flight of 5 Wines', 'Artisanal Charcuterie Pairing'] },
            { name: 'Winemaker VIP Table', price: 950, quantity: 10, benefits: ["Private Cellar Tour with Luke O'Cuinneagain", 'Rare 2001 V vintage sampling'] }
          ],
          description: 'Exclusive vendor submission from Vergelegen Wine Estate featuring library reserve vintages.',
          hostName: "Luke O'Cuinneagain",
          hostTitle: 'Managing Winemaker',
          image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80',
          vendorId: seedVendor._id,
          status: 'upcoming',
          approvalStatus: 'pending_approval',
        });
      }

      if (seedVendor && pLotCount === 0) {
        const lotCount = await AuctionLot.countDocuments();
        const lotNumber = `GS-2026-${String(lotCount + 1).padStart(5, '0')}`;
        await AuctionLot.create({
          title: '1970 The Glenlivet 50 Year Old Single Cask Private Reserve',
          description: 'Vendor consignment: Bottled from a single sherry butt, extraordinary provenance with original wooden presentation case and wax seal intact.',
          category: 'Single Malt Scotch',
          lotNumber,
          startingBid: 95000,
          reservePrice: 140000,
          bidIncrement: 5000,
          currentBid: 95000,
          startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
          status: 'pending_approval',
          vendor: seedVendor._id,
          distillery: 'The Glenlivet',
          expression: 'Single Cask 50 Year Old',
          vintage: '1970',
          ageStatement: '50 Years',
          fillLevel: 'Into Neck',
          boxCondition: 'Original Box / Case Pristine',
          sealCondition: 'Intact & Pristine',
          condition: 'Pristine Cellar Condition',
          provenance: 'Privately Cellared Under Climate Control by Consignor',
          authenticationStatus: 'Pending',
          images: ['https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&auto=format&fit=crop&q=80']
        });
      }
    } catch (seedErr) {
      console.warn('Review seed check skipped:', seedErr.message);
    }

    // 3. Live, Upcoming, Sold & Closed Auction Lots (Vendor Consignments & Telemetry)
    const liveLots = await AuctionLot.find({
      status: { $in: ['live', 'extended', 'upcoming', 'pending_approval', 'sold', 'closed', 'rejected', 'unsold'] }
    })
      .populate('highBidder', 'name email phone bidderNumber bidderLevel')
      .populate('winner', 'name email phone customerTier bidderNumber')
      .populate('vendor', 'name email storeName')
      .select('title lotNumber currentBid reservePrice startingBid bidIncrement bidCount status startDate endDate images category distillery expression vintage bottlingYear ageStatement fillLevel highBidder winner winningBid totalPaidByBuyer paymentStatus vendor authenticationStatus authenticationNotes createdAt')
      .sort({ createdAt: -1 })
      .limit(80);

    // 4. Tasting Experiences & Vendor Submissions
    const allEvents = await Event.find({
      status: { $ne: 'cancelled' }
    })
      .populate('vendorId', 'name email storeName')
      .sort({ createdAt: -1 })
      .limit(60);

    const eventSummaries = await Promise.all(
      allEvents.map(async (evt) => {
        const bookingsCount = await Booking.countDocuments({
          event: evt._id,
          paymentStatus: { $in: ['Paid', 'Completed'] }
        });
        const checkedInCount = await Booking.countDocuments({
          event: evt._id,
          ticketStatus: 'Used'
        });

        return {
          id: evt._id,
          _id: evt._id,
          title: evt.title,
          slug: evt.slug,
          type: evt.type,
          format: evt.format,
          date: evt.date,
          startTime: evt.startTime,
          endTime: evt.endTime,
          location: evt.location,
          city: evt.city,
          capacity: evt.capacity,
          soldTickets: bookingsCount,
          checkedInCount,
          status: evt.status,
          approvalStatus: evt.approvalStatus || 'approved',
          approvalNote: evt.approvalNote || '',
          approvedAt: evt.approvedAt,
          approvedBy: evt.approvedBy,
          description: evt.description,
          hostName: evt.hostName,
          hostTitle: evt.hostTitle,
          ticketTiers: evt.ticketTiers || [],
          vendor: evt.vendorId ? {
            id: evt.vendorId._id,
            name: evt.vendorId.storeName || evt.vendorId.name || 'Vendor Partner',
            email: evt.vendorId.email
          } : null
        };
      })
    );

    res.json({
      success: true,
      stats: {
        pendingKycCount: pendingBidders.length,
        unpaidLotsCount: unpaidLots.length,
        liveAuctionsCount: liveLots.filter(l => l.status === 'live').length,
        upcomingEventsCount: allEvents.filter(e => (e.approvalStatus || 'approved') === 'approved').length,
        pendingEventsCount: allEvents.filter(e => e.approvalStatus === 'pending_approval').length,
        pendingLotsCount: liveLots.filter(l => l.status === 'pending_approval').length,
      },
      pendingBidders,
      unpaidLots,
      liveLots,
      events: eventSummaries
    });
  } catch (err) {
    console.error('Error fetching auction operations summary:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving auction operations summary' });
  }
};

// @desc    Get all registered / approved / pending bidders
// @route   GET /api/crm/auctions/bidders
// @access  Staff / CRM
exports.getAllBidders = async (req, res) => {
  try {
    const { status = 'all', search } = req.query;
    const query = {};

    if (status === 'pending') {
      query.bidderApprovalStatus = { $in: ['pending_approval', 'pending_verification'] };
    } else if (status === 'approved') {
      query.bidderApprovalStatus = 'approved';
    } else if (status === 'rejected') {
      query.bidderApprovalStatus = 'rejected';
    } else {
      // Return all users that have bidder credentials or approval records
      query.$or = [
        { bidderApprovalStatus: { $exists: true, $ne: null } },
        { bidderLevel: { $exists: true, $ne: null } },
        { biddingLimit: { $gt: 0 } },
        { role: 'customer' }
      ];
    }

    if (search && search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { name: reg },
            { email: reg },
            { phone: reg },
            { idNumber: reg }
          ]
        }
      ];
      delete query.$or;
    }

    const bidders = await User.find(query)
      .select('name email phone idType idNumber idDocumentUrl proofOfResidenceUrl bidderLevel biddingLimit bidderApprovalStatus bidderApprovedAt createdAt')
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: bidders.length,
      bidders
    });
  } catch (err) {
    console.error('Error fetching bidders:', err);
    res.status(500).json({ success: false, message: 'Server error fetching bidders' });
  }
};

// @desc    Approve or reject high-value bidder KYC or adjust limits
// @route   PUT /api/crm/auctions/bidder/:id/kyc
// @access  Staff / CRM
exports.updateBidderKyc = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit, level, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Bidder not found' });
    }

    if (status) user.bidderApprovalStatus = status; // 'approved' | 'rejected' | 'pending_verification'
    if (status === 'approved' || user.bidderApprovalStatus === 'approved') {
      user.bidderApprovalStatus = 'approved';
      user.kycVerified = true;
      user.isAgeVerified = true;
      user.isBiddingSuspended = false;
      user.bidderRejectionReason = undefined;
      user.bidderApprovedAt = new Date();
      user.bidderApprovedBy = req.user ? req.user._id : undefined;
      user.biddingLimit = (limit !== undefined && limit !== null && Number(limit) > 0) ? Number(limit) : (user.biddingLimit || 25000);
      
      if (!user.bidderNumber) {
        user.bidderNumber = `GS-B${Math.floor(1000 + Math.random() * 9000)}`;
      }

      if (level) {
        const validLevels = ['level_1_registered', 'level_2_verified', 'level_3_enhanced', 'level_4_vip'];
        let mappedLevel = level;
        if (level === 'Gold' || level === 'VIP' || level === 'vip' || level === 'level_4') mappedLevel = 'level_4_vip';
        else if (level === 'Silver' || level === 'enhanced' || level === 'level_3') mappedLevel = 'level_3_enhanced';
        else if (level === 'Bronze' || level === 'verified' || level === 'level_2') mappedLevel = 'level_2_verified';
        else if (level === 'registered' || level === 'level_1') mappedLevel = 'level_1_registered';
        user.bidderLevel = validLevels.includes(mappedLevel) ? mappedLevel : 'level_2_verified';
      } else if (!user.bidderLevel || user.bidderLevel === 'level_1_registered') {
        user.bidderLevel = 'level_2_verified';
      }

      // Send approval notification email
      if (user.email) {
        try {
          await sendEmail({
            to: user.email,
            subject: '✅ 18+ Bidder Verification Approved — The Grand Store Auctions',
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 32px; border-radius: 12px; max-width: 600px; margin: auto;">
                <h2 style="color: #10b981; margin-top: 0;">Bidder Verification Approved</h2>
                <p>Dear ${user.name},</p>
                <p>Your auction registration has been verified and approved by the Administrator.</p>
                <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 18px 0;">
                  <p style="margin: 0; color: #94a3b8;">Assigned Paddle Number: <strong style="color: #ffffff;">${user.bidderNumber}</strong></p>
                  <p style="margin: 8px 0 0 0; color: #94a3b8;">Approved Bidding Limit: <strong style="color: #10b981;">R ${Number(user.biddingLimit).toLocaleString()}</strong></p>
                  <p style="margin: 8px 0 0 0; color: #94a3b8;">Bidder Level: <strong style="color: #38bdf8;">${user.bidderLevel.replace(/_/g, ' ').toUpperCase()}</strong></p>
                </div>
                <p style="color: #cbd5e1; font-size: 13px;">You may now participate and place bids across all active fine wine and rare spirits catalog lots.</p>
              </div>
            `
          });
        } catch (e) {
          console.warn('Bidder approval email notice skipped:', e.message);
        }
      }
    } else if (status === 'rejected') {
      user.bidderApprovalStatus = 'rejected';
      user.bidderRejectionReason = reason || 'Documentation verification failed';
    }

    await user.save();

    res.json({
      success: true,
      message: `Bidder ${user.name} KYC updated successfully (${user.bidderApprovalStatus || 'updated'})`,
      bidder: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        approvalStatus: user.bidderApprovalStatus,
        biddingLimit: user.biddingLimit,
        bidderLevel: user.bidderLevel,
        bidderNumber: user.bidderNumber
      }
    });
  } catch (err) {
    console.error('Error updating bidder KYC:', err);
    res.status(500).json({ success: false, message: 'Server error updating bidder KYC' });
  }
};

// @desc    Record or confirm hammer lot payment
// @route   PUT /api/crm/auctions/lot/:id/payment
// @access  Staff / CRM
exports.recordHammerLotPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentReference, notes } = req.body;

    const lot = await AuctionLot.findById(id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Auction lot not found' });
    }

    lot.paymentStatus = paymentStatus || 'Paid';
    if (lot.paymentStatus === 'Paid') {
      lot.fulfilmentStatus = 'Payment Cleared';
      lot.isPaid = true;
    }

    await lot.save();

    // If an unpaid hammer recovery task exists, auto-complete it
    await CrmTask.updateMany(
      { 'linkedEntity.entityId': lot._id, category: 'auction_followup', status: { $ne: 'completed' } },
      {
        status: 'completed',
        completedAt: new Date(),
        completedBy: req.user?._id,
        completionReason: `Hammer payment cleared via CRM by ${req.user?.name || 'Treasury'}. Ref: ${paymentReference || 'Direct'}`
      }
    );

    res.json({
      success: true,
      message: `Hammer lot ${lot.lotNumber || lot._id} payment status updated to ${lot.paymentStatus}`,
      lot
    });
  } catch (err) {
    console.error('Error recording hammer payment:', err);
    res.status(500).json({ success: false, message: 'Server error updating hammer lot payment' });
  }
};

// @desc    Send Payment Reminder to winning bidder (Section 10 48h SLA)
// @route   POST /api/crm/auctions/lot/:id/remind
// @access  Staff / CRM
exports.sendPaymentReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const lot = await AuctionLot.findById(id).populate('winner', 'name email phone');
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    lot.reminderSent = true;
    lot.reminderSentAt = new Date();
    await lot.save();

    let emailSent = false;
    if (lot.winner && lot.winner.email) {
      const amountDue = Number(lot.totalPaidByBuyer || lot.winningBid || 0).toLocaleString();
      const html = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 32px 24px; border-radius: 12px; max-width: 600px; margin: auto;">
          <div style="border-bottom: 2px solid #d97706; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: #d97706; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">The Grand Store</h1>
            <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Auction Allocation & Treasury Clearing</p>
          </div>

          <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 12px;">Dear ${lot.winner.name || 'Valued Patron'},</p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">
            This is an official Section 10 payment reminder regarding your winning hammer allocation on:
          </p>

          <div style="background-color: #1e293b; border-left: 4px solid #d97706; padding: 18px; margin: 20px 0; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #ffffff;">${lot.title}</h3>
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">Lot Reference: <strong>#${lot.lotNumber || '—'}</strong> (${lot.gsReference || 'GS-AUC'})</p>
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 13px; color: #cbd5e1;">Total Hammer Due (incl. Premium & VAT):</span>
              <span style="font-size: 22px; font-weight: bold; color: #38bdf8;">R ${amountDue}</span>
            </div>
          </div>

          <div style="background-color: #451a03; border: 1px solid #78350f; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px; color: #fde68a; line-height: 1.5;">
              ⚠️ <strong>Section 10 Statutory 48h SLA Notice:</strong> Winning bidders must clear settlement within 48 hours of hammer fall. Unsettled lots are subject to forfeiture and re-listing.
            </p>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">
            To complete your settlement, please log in to your Grand Store account or contact the Treasury Concierge Desk for verified EFT clearing instructions.
          </p>

          <div style="text-align: center; margin: 28px 0 12px 0;">
            <a href="${process.env.PUBLIC_SITE_URL || 'https://grandstoreglobal.com'}/customer/auctions" 
               style="background-color: #d97706; color: #0b0f19; font-weight: bold; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-size: 13px; display: inline-block;">
              Settle Lot Payout &rarr;
            </a>
          </div>

          <div style="border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px; text-align: center; font-size: 11px; color: #64748b;">
            The Grand Store International (Pty) Ltd • Operations Command Center • Stellenbosch
          </div>
        </div>
      `;

      try {
        await sendEmail({
          to: lot.winner.email,
          subject: `[Action Required] Section 10 Payment Reminder: ${lot.title} (Lot #${lot.lotNumber || '—'})`,
          html
        });
        emailSent = true;
      } catch (mailErr) {
        console.warn('Could not dispatch reminder email via SMTP:', mailErr.message);
      }
    }

    res.json({
      success: true,
      message: emailSent 
        ? `Section 10 Payment reminder email notification successfully dispatched to ${lot.winner?.email}!`
        : `Payment reminder recorded for ${lot.winner?.name || 'winning bidder'} (Lot #${lot.lotNumber || lot._id})`,
      emailSent,
      lot
    });
  } catch (err) {
    console.error('Error sending payment reminder:', err);
    res.status(500).json({ success: false, message: 'Server error dispatching reminder' });
  }
};

// @desc    Default an unpaid hammer lot (Past 48h SLA)
// @route   PUT /api/crm/auctions/lot/:id/default
// @access  Staff / CRM
exports.defaultLot = async (req, res) => {
  try {
    const { id } = req.params;
    const lot = await AuctionLot.findById(id).populate('winner', 'name email');
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Lot not found' });
    }

    lot.status = 'unsold';
    lot.paymentStatus = 'Failed';
    lot.fulfilmentStatus = 'Defaulted';
    await lot.save();

    // Penalize / note winning bidder if present
    if (lot.winner) {
      await User.findByIdAndUpdate(lot.winner._id, {
        $inc: { defaultedLotsCount: 1 }
      });
    }

    res.json({
      success: true,
      message: `Lot #${lot.lotNumber || lot._id} marked as Defaulted and returned to unsold inventory.`,
      lot
    });
  } catch (err) {
    console.error('Error defaulting lot:', err);
    res.status(500).json({ success: false, message: 'Server error defaulting lot' });
  }
};

// @desc    Admin creation forbidden (Vendors consign lots)
// @route   POST /api/crm/auctions/lots
// @access  Staff / CRM
exports.createLot = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Admins cannot create auction lots directly. Lots must be consigned by registered vendors, and approved/authenticated by admin.'
  });
};

// @desc    Approve & Authenticate Auction Lot (Consigned by Vendor)
// @route   PUT /api/crm/auctions/lots/:id/approve
// @access  Staff / CRM
exports.approveLot = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetStatus, note } = req.body;
    const lot = await AuctionLot.findById(id).populate('vendor', 'name email storeName');
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Auction lot not found' });
    }

    const now = new Date();
    let computedStatus = 'upcoming';
    if (lot.startDate && new Date(lot.startDate) <= now && (!lot.endDate || new Date(lot.endDate) > now)) {
      computedStatus = 'live';
    }

    lot.status = targetStatus || (lot.status === 'pending_approval' ? computedStatus : lot.status);
    lot.authenticationStatus = 'Authenticated';
    lot.authenticatedAt = new Date();
    lot.authenticatedBy = req.user._id;
    if (note) lot.authenticationNotes = note;

    await lot.save();

    res.json({
      success: true,
      message: `Auction lot #${lot.lotNumber || lot._id} ("${lot.title}") approved and authenticated!`,
      lot
    });
  } catch (err) {
    console.error('Error approving lot:', err);
    res.status(500).json({ success: false, message: 'Server error approving lot: ' + err.message });
  }
};

// @desc    Reject Consigned Auction Lot
// @route   PUT /api/crm/auctions/lots/:id/reject
// @access  Staff / CRM
exports.rejectLot = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const lot = await AuctionLot.findById(id).populate('vendor', 'name email storeName');
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Auction lot not found' });
    }

    lot.status = 'rejected';
    lot.authenticationStatus = 'Rejected';
    lot.authenticationNotes = reason || 'Lot consignment declined by curator.';

    await lot.save();

    res.json({
      success: true,
      message: `Auction lot #${lot.lotNumber || lot._id} marked as rejected.`,
      lot
    });
  } catch (err) {
    console.error('Error rejecting lot:', err);
    res.status(500).json({ success: false, message: 'Server error rejecting lot: ' + err.message });
  }
};

// @desc    Update Auction Lot
// @route   PUT /api/crm/auctions/lots/:id
// @access  Staff / CRM
exports.updateLot = async (req, res) => {
  try {
    const { id } = req.params;
    const lot = await AuctionLot.findById(id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Auction lot not found' });
    }

    Object.assign(lot, req.body);
    if (req.body.startDate) lot.startDate = new Date(req.body.startDate);
    if (req.body.endDate) lot.endDate = new Date(req.body.endDate);

    await lot.save();

    res.json({
      success: true,
      message: `Auction lot #${lot.lotNumber || lot._id} updated successfully`,
      lot
    });
  } catch (err) {
    console.error('Error updating auction lot:', err);
    res.status(500).json({ success: false, message: 'Server error updating auction lot' });
  }
};

// @desc    Delete or Archive Auction Lot
// @route   DELETE /api/crm/auctions/lots/:id
// @access  Staff / CRM
exports.deleteLot = async (req, res) => {
  try {
    const { id } = req.params;
    const lot = await AuctionLot.findById(id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Auction lot not found' });
    }

    if (lot.bidCount > 0 && lot.status === 'live') {
      lot.status = 'closed';
      await lot.save();
      return res.json({ success: true, message: 'Lot has active bids and was safely marked Closed', lot });
    }

    await AuctionLot.findByIdAndDelete(id);
    res.json({ success: true, message: 'Auction lot deleted successfully' });
  } catch (err) {
    console.error('Error deleting auction lot:', err);
    res.status(500).json({ success: false, message: 'Server error deleting auction lot' });
  }
};

// @desc    Place Live Floor / Phone Bid
// @route   POST /api/crm/auctions/lots/:id/floor-bid
// @access  Staff / CRM
exports.placeFloorBid = async (req, res) => {
  try {
    const { id } = req.params;
    const { bidderId, bidderName, amount, bidderNumber } = req.body;

    const lot = await AuctionLot.findById(id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Auction lot not found' });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= (lot.currentBid || 0)) {
      return res.status(400).json({
        success: false,
        message: `Floor bid must exceed current bid of R ${(lot.currentBid || 0).toLocaleString()}`
      });
    }

    let bidderUser = null;
    if (bidderId) {
      bidderUser = await User.findById(bidderId);
    }
    const finalUserId = bidderUser ? bidderUser._id : req.user._id;

    // Create Bid record
    const bid = await Bid.create({
      user: finalUserId,
      lot: lot._id,
      amount: numericAmount,
      placedCurrency: 'ZAR',
      placedAmount: numericAmount,
      bidType: 'manual',
      bidderNumber: bidderNumber || (bidderName ? `FLOOR-${bidderName}` : `FLOOR-B${Date.now().toString().slice(-4)}`),
      status: 'valid'
    });

    // Update lot state
    lot.currentBid = numericAmount;
    lot.bidCount = (lot.bidCount || 0) + 1;
    lot.lastBidTime = new Date();
    lot.highBidder = finalUserId;
    if (numericAmount >= lot.reservePrice) {
      lot.reserveMet = true;
    }
    await lot.save();

    res.json({
      success: true,
      message: `Floor bid of R ${numericAmount.toLocaleString()} recorded on Lot #${lot.lotNumber || lot._id}`,
      lot,
      bid
    });
  } catch (err) {
    console.error('Error placing floor bid:', err);
    res.status(500).json({ success: false, message: 'Server error recording floor bid' });
  }
};

// @desc    Declare Manual Hammer Fall (Award winner & transition to unpaid queue)
// @route   PUT /api/crm/auctions/lots/:id/hammer
// @access  Staff / CRM
exports.declareHammerFall = async (req, res) => {
  try {
    const { id } = req.params;
    const { winnerId, hammerPrice, notes } = req.body;

    const lot = await AuctionLot.findById(id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Auction lot not found' });
    }

    const finalPrice = hammerPrice ? Number(hammerPrice) : (lot.currentBid || lot.startingBid);
    const buyerPremiumAmount = Math.round(finalPrice * 0.05);
    const barChargeAmount = Math.round(finalPrice * 0.02);
    const vatAmount = Math.round((finalPrice + buyerPremiumAmount) * 0.15);
    const totalPaidByBuyer = finalPrice + buyerPremiumAmount + barChargeAmount + vatAmount;

    lot.status = 'sold';
    lot.winningBid = finalPrice;
    lot.buyerPremiumAmount = buyerPremiumAmount;
    lot.barChargeAmount = barChargeAmount;
    lot.vatAmount = vatAmount;
    lot.totalPaidByBuyer = totalPaidByBuyer;
    lot.paymentStatus = 'Pending';
    lot.fulfilmentStatus = 'Awaiting Payment';
    lot.winner = winnerId || lot.highBidder || req.user._id;
    lot.gsReference = `GS-26-AUC-HAM-${Date.now().toString().slice(-6)}`;
    await lot.save();

    // Create Section 10 Payment SLA Follow-up Task in CrmTask
    await CrmTask.create({
      title: `SLA Section 10: Collect Hammer Payment for Lot #${lot.lotNumber}`,
      description: `Hammer fell at R ${finalPrice.toLocaleString()} (Total due: R ${totalPaidByBuyer.toLocaleString()}). Collect payment within 48h SLA. Notes: ${notes || 'Floor hammer fall'}`,
      category: 'auction_followup',
      priority: 'high',
      linkedEntity: {
        entityType: 'AuctionLot',
        entityId: lot._id,
        referenceCode: lot.lotNumber
      },
      assignedTo: req.user._id,
      assignedBy: req.user._id,
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h SLA
      status: 'open'
    });

    res.json({
      success: true,
      message: `Hammer fell! Lot #${lot.lotNumber || lot._id} marked SOLD at R ${finalPrice.toLocaleString()}. Transferred to Unpaid Hammer Queue.`,
      lot
    });
  } catch (err) {
    console.error('Error declaring hammer fall:', err);
    res.status(500).json({ success: false, message: 'Server error declaring hammer fall' });
  }
};

// @desc    Admin creation forbidden (Vendors submit tasting events)
// @route   POST /api/crm/events
// @access  Staff / CRM
exports.createEvent = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Admins cannot create tasting events directly. Events must be submitted by vendor estates and approved by admin.'
  });
};

// @desc    Approve Tasting Event (Submitted by Vendor)
// @route   PUT /api/crm/events/:id/approve
// @access  Staff / CRM
exports.approveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const event = await Event.findById(id).populate('vendorId', 'name email storeName');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Tasting event not found' });
    }

    event.approvalStatus = 'approved';
    event.status = 'upcoming';
    event.approvedAt = new Date();
    event.approvedBy = req.user._id;
    if (note) event.approvalNote = note;

    await event.save();

    res.json({
      success: true,
      message: `Tasting event "${event.title}" approved and published to website!`,
      event
    });
  } catch (err) {
    console.error('Error approving event:', err);
    res.status(500).json({ success: false, message: 'Server error approving event: ' + err.message });
  }
};

// @desc    Reject Tasting Event (Submitted by Vendor)
// @route   PUT /api/crm/events/:id/reject
// @access  Staff / CRM
exports.rejectEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const event = await Event.findById(id).populate('vendorId', 'name email storeName');
    if (!event) {
      return res.status(404).json({ success: false, message: 'Tasting event not found' });
    }

    event.approvalStatus = 'rejected';
    event.approvalNote = reason || 'Declined by Grand Store Sommelier curation team.';

    await event.save();

    res.json({
      success: true,
      message: `Tasting event "${event.title}" marked as rejected.`,
      event
    });
  } catch (err) {
    console.error('Error rejecting event:', err);
    res.status(500).json({ success: false, message: 'Server error rejecting event: ' + err.message });
  }
};

// @desc    Update Tasting Event
// @route   PUT /api/crm/events/:id
// @access  Staff / CRM
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    Object.assign(event, req.body);
    if (req.body.date) event.date = new Date(req.body.date);

    await event.save();

    res.json({
      success: true,
      message: `Event "${event.title}" updated successfully`,
      event
    });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ success: false, message: 'Server error updating event' });
  }
};

// @desc    Delete or Cancel Tasting Event
// @route   DELETE /api/crm/events/:id
// @access  Staff / CRM
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const bookingsCount = await Booking.countDocuments({ event: id });
    if (bookingsCount > 0) {
      event.status = 'cancelled';
      await event.save();
      return res.json({ success: true, message: 'Event has active bookings and was marked Cancelled', event });
    }

    await Event.findByIdAndDelete(id);
    res.json({ success: true, message: 'Event deleted from directory' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ success: false, message: 'Server error deleting event' });
  }
};

// @desc    Register and Admit Walk-in Guest at the Door Desk
// @route   POST /api/crm/events/:id/walk-in
// @access  Staff / CRM
exports.registerWalkInGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, ticketType, price, paymentMethod, quantity = 1 } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Find or create guest user
    let guestUser = null;
    if (email && email.trim()) {
      guestUser = await User.findOne({ email: email.toLowerCase().trim() });
    }
    if (!guestUser) {
      const tempEmail = email?.trim() || `walkin.${Date.now()}.${Math.random().toString(36).substring(2, 6)}@guest.grandstore.co.za`;
      guestUser = await User.create({
        name: name || 'Door Walk-In Guest',
        email: tempEmail,
        phone: phone || '',
        role: 'customer',
        isAgeVerified: true,
        customerTier: 'retail',
        password: Math.random().toString(36).substring(2)
      });
    }

    const unitPrice = Number(price) || (event.ticketTiers?.[0]?.price || 350);
    const subTotal = unitPrice * Number(quantity);
    const total = subTotal;
    const ticketId = `WALK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const tier = event.ticketTiers?.find(t => t.name.toLowerCase() === (ticketType || '').toLowerCase()) || event.ticketTiers?.[0];
    const tierId = tier ? tier._id : new mongoose.Types.ObjectId();

    const booking = await Booking.create({
      user: guestUser._id,
      event: event._id,
      vendor: event.vendorId || req.user._id,
      ticketType: ticketType || (tier ? tier.name : 'Door Walk-In'),
      ticketTierId: tierId,
      unitPrice,
      quantity: Number(quantity),
      subTotal,
      totalPrice: total,
      paymentMethod: 'Bank Transfer', // Direct door settlement
      paymentStatus: 'Paid',
      ticketStatus: 'Used', // Walk-in is admitted directly at door!
      inventoryStatus: 'sold',
      ticketId,
      gsReference: `GS-26-EVT-WALK-${Date.now().toString().slice(-6)}`
    });

    if (tier) {
      tier.sold = (tier.sold || 0) + Number(quantity);
      await event.save();
    }

    res.json({
      success: true,
      message: `Walk-in guest ${guestUser.name} registered and checked in successfully!`,
      booking: {
        bookingId: booking._id,
        ticketId: booking.ticketId,
        userName: guestUser.name,
        userEmail: guestUser.email,
        userPhone: guestUser.phone,
        ticketType: booking.ticketType,
        quantity: booking.quantity,
        totalPaid: booking.totalPrice,
        paymentStatus: booking.paymentStatus,
        ticketStatus: booking.ticketStatus,
        checkedIn: true,
        bookedAt: booking.createdAt
      }
    });
  } catch (err) {
    console.error('Error registering walk-in guest:', err);
    res.status(500).json({ success: false, message: 'Server error registering walk-in guest: ' + err.message });
  }
};

// @desc    Get Tasting Event Guest List (Desk Check-in View)
// @route   GET /api/crm/events/:id/guests
// @access  Staff / CRM
exports.getEventGuestList = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const bookings = await Booking.find({ event: id })
      .populate('user', 'name email phone dateOfBirth crmCustomerType customerTier address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        location: event.location,
        capacity: event.capacity,
        ticketTiers: event.ticketTiers || []
      },
      guests: bookings.map(b => ({
        bookingId: b._id,
        ticketId: b.ticketId,
        userName: b.user ? b.user.name : (b.guestName || 'Guest Collector'),
        userEmail: b.user ? b.user.email : (b.guestEmail || 'N/A'),
        userPhone: b.user ? b.user.phone : (b.guestPhone || 'N/A'),
        userTier: b.user?.customerTier || b.user?.crmCustomerType || 'Standard',
        ticketType: b.ticketType,
        quantity: b.quantity || 1,
        unitPrice: b.unitPrice || 0,
        subTotal: b.subTotal || 0,
        vatAmount: b.vatAmount || 0,
        totalPaid: b.totalPrice || 0,
        gsReference: b.gsReference || ('GS-EVT-' + String(b._id).slice(-6).toUpperCase()),
        paymentMethod: b.paymentMethod || 'PayFast',
        paymentStatus: b.paymentStatus || 'Paid',
        ticketStatus: b.ticketStatus || 'Valid',
        checkedIn: b.ticketStatus === 'Used',
        bookedAt: b.createdAt || b.bookingDate,
        paymentProcessedAt: b.paymentProcessedAt
      }))
    });
  } catch (err) {
    console.error('Error fetching event guest list:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving guest list' });
  }
};

// @desc    Check-in tasting guest at the door (Toggle ticket status)
// @route   PUT /api/crm/events/bookings/:bookingId/checkin
// @access  Staff / CRM
exports.toggleGuestCheckIn = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate('user', 'name');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking pass not found' });
    }

    // Toggle between Used and Valid
    const newStatus = booking.ticketStatus === 'Used' ? 'Valid' : 'Used';
    booking.ticketStatus = newStatus;
    await booking.save();

    res.json({
      success: true,
      message: `Guest ${booking.user ? booking.user.name : 'Collector'} marked as ${newStatus === 'Used' ? 'Checked In' : 'Not Checked In'}`,
      ticketStatus: newStatus,
      checkedIn: newStatus === 'Used'
    });
  } catch (err) {
    console.error('Error updating guest check-in:', err);
    res.status(500).json({ success: false, message: 'Server error updating guest check-in' });
  }
};

// @desc    Get Live Bids for a specific Auction Lot (Telemetry view for Admin)
// @route   GET /api/crm/auctions/lots/:id/bids
// @access  Staff / CRM
exports.getLotBids = async (req, res) => {
  try {
    const { id } = req.params;
    const lot = await AuctionLot.findById(id)
      .populate('highBidder', 'name email phone bidderNumber bidderLevel')
      .populate('winner', 'name email phone bidderNumber customerTier');
    if (!lot) return res.status(404).json({ success: false, message: 'Auction lot not found' });

    const bids = await Bid.find({ lot: id, isMaxBid: false })
      .populate('user', 'name email phone bidderNumber bidderLevel')
      .sort({ amount: -1, createdAt: -1 })
      .limit(60);

    return res.json({
      success: true,
      lot: {
        id: lot._id,
        _id: lot._id,
        title: lot.title,
        lotNumber: lot.lotNumber,
        currentBid: lot.currentBid,
        reservePrice: lot.reservePrice,
        startingBid: lot.startingBid,
        status: lot.status,
        highBidder: lot.highBidder,
        winner: lot.winner,
        winningBid: lot.winningBid,
        totalPaidByBuyer: lot.totalPaidByBuyer,
        paymentStatus: lot.paymentStatus,
        bidCount: lot.bidCount,
        endDate: lot.endDate
      },
      bids: bids.map(b => ({
        id: b._id,
        _id: b._id,
        amount: b.amount,
        createdAt: b.createdAt,
        type: b.bidType || 'online',
        bidder: {
          name: b.user?.name || 'Anonymous Collector',
          email: b.user?.email || '',
          phone: b.user?.phone || '',
          bidderNumber: b.user?.bidderNumber || b.bidderNumber || ('GS-B' + String(b.user?._id || b._id).slice(-4)),
          level: b.user?.bidderLevel || 'level_2_verified'
        }
      }))
    });
  } catch (err) {
    console.error('Error fetching lot bids:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving lot bids' });
  }
};

