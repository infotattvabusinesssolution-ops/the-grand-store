const AuctionLot = require('../../models/AuctionLot');
const Event = require('../../models/Event');
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const CrmTask = require('../../models/CrmTask');

// @desc    Get Auction & Tasting Operations Hub Summary
// @route   GET /api/crm/auctions/summary
// @access  Staff / CRM
exports.getAuctionOperationsSummary = async (req, res) => {
  try {
    // 1. Pending Bidder KYC Verification Queue
    const pendingBidders = await User.find({
      bidderApprovalStatus: { $in: ['pending_approval', 'pending_verification'] }
    })
      .select('name email phone idType idNumber idDocumentUrl proofOfResidenceUrl bidderLevel biddingLimit createdAt')
      .sort({ createdAt: -1 });

    // 2. Unpaid Hammer Lots (Lots marked sold with paymentStatus Pending)
    const unpaidLots = await AuctionLot.find({
      status: 'sold',
      paymentStatus: { $in: ['Pending', 'Awaiting_Approval'] }
    })
      .populate('winner', 'name email phone')
      .populate('vendor', 'name email')
      .select('title lotNumber winningBid totalPaidByBuyer paymentStatus endDate winner vendor gsReference')
      .sort({ endDate: -1 });

    // 3. Live & Upcoming Auctions
    const liveLots = await AuctionLot.find({
      status: { $in: ['live', 'extended', 'upcoming'] }
    })
      .select('title lotNumber currentBid reservePrice startingBid bidCount status endDate images')
      .sort({ endDate: 1 })
      .limit(10);

    // 4. Upcoming Tasting Events & Attendee Counts
    const upcomingEvents = await Event.find({
      status: { $in: ['upcoming', 'ongoing'] }
    })
      .sort({ date: 1 })
      .limit(6);

    const eventSummaries = await Promise.all(
      upcomingEvents.map(async (evt) => {
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
          title: evt.title,
          type: evt.type,
          format: evt.format,
          date: evt.date,
          startTime: evt.startTime,
          location: evt.location,
          capacity: evt.capacity,
          soldTickets: bookingsCount,
          checkedInCount,
          status: evt.status
        };
      })
    );

    res.json({
      success: true,
      stats: {
        pendingKycCount: pendingBidders.length,
        unpaidLotsCount: unpaidLots.length,
        liveAuctionsCount: liveLots.filter(l => l.status === 'live').length,
        upcomingEventsCount: upcomingEvents.length
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

// @desc    Approve or reject high-value bidder KYC
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

    user.bidderApprovalStatus = status; // 'approved' or 'rejected'
    if (status === 'approved') {
      user.bidderApprovedAt = new Date();
      user.bidderApprovedBy = req.user._id;
      if (limit) user.biddingLimit = Number(limit);
      if (level) {
        const validLevels = ['level_1_registered', 'level_2_verified', 'level_3_enhanced', 'level_4_vip'];
        let mappedLevel = level;
        if (level === 'Gold' || level === 'VIP' || level === 'vip' || level === 'level_4') mappedLevel = 'level_4_vip';
        else if (level === 'Silver' || level === 'enhanced' || level === 'level_3') mappedLevel = 'level_3_enhanced';
        else if (level === 'Bronze' || level === 'verified' || level === 'level_2') mappedLevel = 'level_2_verified';
        else if (level === 'registered' || level === 'level_1') mappedLevel = 'level_1_registered';
        user.bidderLevel = validLevels.includes(mappedLevel) ? mappedLevel : 'level_2_verified';
      }
    } else {
      user.bidderRejectionReason = reason || 'Documentation verification failed';
    }

    await user.save();

    res.json({
      success: true,
      message: `Bidder KYC ${status} successfully`,
      bidder: {
        id: user._id,
        name: user.name,
        approvalStatus: user.bidderApprovalStatus,
        biddingLimit: user.biddingLimit,
        bidderLevel: user.bidderLevel
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
    }

    await lot.save();

    // If an unpaid hammer recovery task exists, auto-complete it
    await CrmTask.updateMany(
      { relatedEntityId: lot._id, type: 'payment_followup', status: { $ne: 'completed' } },
      {
        status: 'completed',
        completedAt: new Date(),
        completedBy: req.user._id,
        completionReason: `Hammer payment cleared via CRM by ${req.user.name}. Ref: ${paymentReference || 'Direct'}`
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
      .populate('user', 'name email phone dateOfBirth crmCustomerType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        location: event.location,
        capacity: event.capacity
      },
      guests: bookings.map(b => ({
        bookingId: b._id,
        ticketId: b.ticketId,
        userName: b.user ? b.user.name : 'Guest',
        userEmail: b.user ? b.user.email : 'N/A',
        userPhone: b.user ? b.user.phone : 'N/A',
        ticketType: b.ticketType,
        quantity: b.quantity,
        totalPaid: b.totalPrice,
        paymentStatus: b.paymentStatus,
        ticketStatus: b.ticketStatus, // 'Valid' or 'Used'
        checkedIn: b.ticketStatus === 'Used',
        bookedAt: b.createdAt
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
      message: `Guest ${booking.user ? booking.user.name : ''} marked as ${newStatus}`,
      ticketStatus: newStatus,
      checkedIn: newStatus === 'Used'
    });
  } catch (err) {
    console.error('Error updating guest check-in:', err);
    res.status(500).json({ success: false, message: 'Server error updating guest check-in' });
  }
};
