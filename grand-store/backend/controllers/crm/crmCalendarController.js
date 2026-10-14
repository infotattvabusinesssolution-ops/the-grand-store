const AuctionLot = require('../../models/AuctionLot');
const BidderDeposit = require('../../models/BidderDeposit');
const Event = require('../../models/Event');
const Booking = require('../../models/Booking');
const Order = require('../../models/Order');
const Shipment = require('../../models/Shipment');
const VendorSettlement = require('../../models/VendorSettlement');
const CrmTask = require('../../models/CrmTask');
const ExportEnquiry = require('../../models/ExportEnquiry');
const User = require('../../models/User');

/**
 * Consolidated CRM Master Operations Calendar Controller
 * Aggregates:
 * 1. Auctions: Lots starting, ending/closing, live bidding
 * 2. VIP Deposits & Approvals: Bidder deposits, KYC submissions, lot & event approvals
 * 3. Event Tickets: Tasting sessions, guest reservations, check-in schedules
 * 4. Orders Placed: New orders, authorizations, high-value allocations
 * 5. Deliveries & Transit: Dispatches, estimated arrivals, customs clearance & delivery completions
 * 6. Settlements & Operations: 30-day payout milestones, staff tasks & export consignments
 */
exports.getCalendarEvents = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      month, 
      year, 
      category, 
      actor, 
      search 
    } = req.query;

    let rangeStart;
    let rangeEnd;

    if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
    } else {
      const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
      const targetMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();

      // Extend by 7 days before and 14 days after to cover full month-grid overflow
      rangeStart = new Date(targetYear, targetMonth, 1 - 7, 0, 0, 0, 0);
      rangeEnd = new Date(targetYear, targetMonth + 1, 14, 23, 59, 59, 999);
    }

    const events = [];

    // Helper to safely format dates
    const toIso = (d) => (d instanceof Date && !isNaN(d) ? d.toISOString() : null);

    // ==========================================
    // 1. AUCTIONS (Lots Opening & Closing)
    // ==========================================
    if (!category || category === 'all' || category === 'auctions') {
      try {
        const lots = await AuctionLot.find({
          $or: [
            { startDate: { $gte: rangeStart, $lte: rangeEnd } },
            { endDate: { $gte: rangeStart, $lte: rangeEnd } }
          ]
        })
          .populate('vendor', 'name email storeName')
          .populate('winner', 'name email phone')
          .select('title lotNumber startingBid currentBid reservePrice startDate endDate status vendor winner distillery vintage images')
          .lean();

        for (const lot of lots) {
          // Lot Start Event
          if (lot.startDate && lot.startDate >= rangeStart && lot.startDate <= rangeEnd) {
            events.push({
              id: `lot_start_${lot._id}`,
              date: toIso(lot.startDate),
              endDate: toIso(lot.endDate),
              title: `Auction Opens: ${lot.title}`,
              subtitle: `Lot #${lot.lotNumber || 'N/A'} • Starting Bid: R${Number(lot.startingBid || 0).toLocaleString()}`,
              category: 'auctions',
              eventType: 'auction_start',
              actor: 'vendor',
              actorName: lot.vendor?.storeName || lot.vendor?.name || 'Vendor Consignor',
              actorEmail: lot.vendor?.email,
              status: lot.status,
              priority: lot.status === 'live' ? 'urgent' : 'medium',
              amount: lot.currentBid || lot.startingBid,
              currency: 'ZAR',
              reference: lot.lotNumber ? `LOT-${lot.lotNumber}` : `LOT-${lot._id.toString().slice(-6)}`,
              image: lot.images?.[0] || null,
              link: '/auctions-events',
              meta: {
                lotId: lot._id,
                reservePrice: lot.reservePrice,
                distillery: lot.distillery,
                vintage: lot.vintage
              }
            });
          }

          // Lot End / Hammer Event
          if (lot.endDate && lot.endDate >= rangeStart && lot.endDate <= rangeEnd) {
            const isSold = ['sold', 'closed'].includes(lot.status) && lot.winner;
            events.push({
              id: `lot_end_${lot._id}`,
              date: toIso(lot.endDate),
              title: isSold ? `Hammer Fall (Sold): ${lot.title}` : `Auction Closes: ${lot.title}`,
              subtitle: isSold
                ? `Winning Bid: R${Number(lot.currentBid || 0).toLocaleString()} • Winner: ${lot.winner?.name || 'Patron'}`
                : `Lot #${lot.lotNumber || 'N/A'} • Status: ${lot.status}`,
              category: 'auctions',
              eventType: 'auction_close',
              actor: isSold ? 'customer' : 'vendor',
              actorName: isSold ? (lot.winner?.name || 'Private Collector') : (lot.vendor?.name || 'Vendor'),
              actorEmail: isSold ? lot.winner?.email : lot.vendor?.email,
              status: lot.status,
              priority: isSold ? 'urgent' : 'high',
              amount: lot.currentBid || lot.reservePrice,
              currency: 'ZAR',
              reference: lot.lotNumber ? `LOT-${lot.lotNumber}` : `LOT-${lot._id.toString().slice(-6)}`,
              image: lot.images?.[0] || null,
              link: '/auctions-events',
              meta: {
                lotId: lot._id,
                winnerId: lot.winner?._id,
                currentBid: lot.currentBid
              }
            });
          }
        }
      } catch (err) {
        console.warn('[CRM Calendar] Auction lots query error:', err.message);
      }
    }

    // ==========================================
    // 2. VIP DEPOSITS & APPROVALS
    // ==========================================
    if (!category || category === 'all' || category === 'vip_approvals') {
      try {
        // A. Bidder VIP Deposits
        const deposits = await BidderDeposit.find({
          createdAt: { $gte: rangeStart, $lte: rangeEnd }
        })
          .populate('bidder', 'name email phone customerTier')
          .populate('lot', 'title lotNumber')
          .lean();

        for (const dep of deposits) {
          events.push({
            id: `vip_deposit_${dep._id}`,
            date: toIso(dep.createdAt),
            title: `VIP Bidder Deposit: ${dep.bidder?.name || 'Patron'}`,
            subtitle: `Amount: R${Number(dep.amount || 10000).toLocaleString()} • Status: ${dep.paymentStatus} (${dep.paymentMethod?.toUpperCase()})`,
            category: 'vip_approvals',
            eventType: 'vip_deposit',
            actor: 'customer',
            actorName: dep.bidder?.name || 'Anonymous Bidder',
            actorEmail: dep.bidder?.email,
            actorPhone: dep.bidder?.phone,
            status: dep.paymentStatus,
            priority: dep.paymentStatus === 'pending' ? 'urgent' : 'medium',
            amount: dep.amount,
            currency: 'ZAR',
            reference: dep.paymentReference || `DEP-${dep._id.toString().slice(-6)}`,
            link: '/auctions-events',
            meta: {
              depositId: dep._id,
              proofOfPayment: dep.proofOfPayment,
              lotTitle: dep.lot?.title,
              tier: dep.tier
            }
          });
        }

        // B. Pending Vendor Consignments & Lot Approvals
        const pendingLots = await AuctionLot.find({
          status: 'pending_approval',
          createdAt: { $gte: rangeStart, $lte: rangeEnd }
        })
          .populate('vendor', 'name email storeName')
          .select('title startingBid reservePrice createdAt vendor images')
          .lean();

        for (const pLot of pendingLots) {
          events.push({
            id: `lot_approval_${pLot._id}`,
            date: toIso(pLot.createdAt),
            title: `Vendor Lot Approval Required: ${pLot.title}`,
            subtitle: `Consignor: ${pLot.vendor?.storeName || pLot.vendor?.name} • Reserve: R${Number(pLot.reservePrice || 0).toLocaleString()}`,
            category: 'vip_approvals',
            eventType: 'lot_approval',
            actor: 'vendor',
            actorName: pLot.vendor?.storeName || pLot.vendor?.name || 'Consignor',
            actorEmail: pLot.vendor?.email,
            status: 'pending_approval',
            priority: 'urgent',
            amount: pLot.reservePrice,
            currency: 'ZAR',
            reference: `LOT-APP-${pLot._id.toString().slice(-6)}`,
            image: pLot.images?.[0] || null,
            link: '/auctions-events',
            meta: { lotId: pLot._id }
          });
        }
      } catch (err) {
        console.warn('[CRM Calendar] VIP deposits query error:', err.message);
      }
    }

    // ==========================================
    // 3. EVENT TICKETS & PRIVATE TASTINGS
    // ==========================================
    if (!category || category === 'all' || category === 'events') {
      try {
        // A. Tasting Events Scheduled
        const tastingEvents = await Event.find({
          date: { $gte: rangeStart, $lte: rangeEnd }
        })
          .populate('vendorId', 'name email storeName')
          .select('title type format date startTime endTime location status vendorId ticketTiers')
          .lean();

        for (const ev of tastingEvents) {
          events.push({
            id: `event_${ev._id}`,
            date: toIso(ev.date),
            title: `Tasting Event: ${ev.title}`,
            subtitle: `${ev.type} • ${ev.startTime || '18:00'} - ${ev.endTime || '21:00'} • Status: ${ev.status}`,
            category: 'events',
            eventType: 'tasting_event',
            actor: 'vendor',
            actorName: ev.vendorId?.storeName || ev.vendorId?.name || 'Estate Sommelier',
            actorEmail: ev.vendorId?.email,
            status: ev.status,
            priority: ev.status === 'upcoming' ? 'high' : 'medium',
            amount: ev.ticketTiers?.[0]?.price || 0,
            currency: 'ZAR',
            reference: `EVT-${ev._id.toString().slice(-6)}`,
            link: '/auctions-events',
            meta: {
              eventId: ev._id,
              location: ev.location,
              format: ev.format
            }
          });
        }

        // B. Event Ticket Bookings
        const bookings = await Booking.find({
          createdAt: { $gte: rangeStart, $lte: rangeEnd }
        })
          .populate('user', 'name email phone')
          .populate('event', 'title date location startTime')
          .populate('vendor', 'name storeName')
          .select('ticketId ticketType quantity totalPrice paymentStatus ticketStatus createdAt user event vendor gsReference')
          .lean();

        for (const bkg of bookings) {
          events.push({
            id: `booking_${bkg._id}`,
            date: toIso(bkg.createdAt),
            title: `Ticket Issued: ${bkg.ticketType} (${bkg.quantity}x)`,
            subtitle: `Event: ${bkg.event?.title || 'Private Tasting'} • Patron: ${bkg.user?.name || 'Guest'} (R${Number(bkg.totalPrice || 0).toLocaleString()})`,
            category: 'events',
            eventType: 'ticket_booking',
            actor: 'customer',
            actorName: bkg.user?.name || 'Ticket Holder',
            actorEmail: bkg.user?.email,
            actorPhone: bkg.user?.phone,
            status: bkg.ticketStatus || bkg.paymentStatus,
            priority: bkg.paymentStatus === 'Paid' ? 'medium' : 'high',
            amount: bkg.totalPrice,
            currency: 'ZAR',
            reference: bkg.ticketId || bkg.gsReference || `TKT-${bkg._id.toString().slice(-6)}`,
            link: '/auctions-events',
            meta: {
              bookingId: bkg._id,
              eventTitle: bkg.event?.title,
              eventDate: bkg.event?.date,
              ticketQuantity: bkg.quantity
            }
          });
        }
      } catch (err) {
        console.warn('[CRM Calendar] Events & bookings query error:', err.message);
      }
    }

    // ==========================================
    // 4. ORDERS PLACED
    // ==========================================
    if (!category || category === 'all' || category === 'orders') {
      try {
        const orders = await Order.find({
          createdAt: { $gte: rangeStart, $lte: rangeEnd }
        })
          .populate('user', 'name email phone customerTier')
          .select('orderId totalPrice status paymentStatus isPaid createdAt user orderItems shippingAddress isGift')
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        for (const ord of orders) {
          const itemCount = (ord.orderItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
          const topProduct = ord.orderItems?.[0]?.name || 'Luxury Selection';
          const isHighValue = ord.totalPrice >= 5000;

          events.push({
            id: `order_${ord._id}`,
            date: toIso(ord.createdAt),
            title: `Order Placed: #${ord.orderId || ord._id.toString().slice(-8)}`,
            subtitle: `${ord.user?.name || 'Customer'} • R${Number(ord.totalPrice || 0).toLocaleString()} • ${itemCount} items (${topProduct})`,
            category: 'orders',
            eventType: 'order_placed',
            actor: 'customer',
            actorName: ord.user?.name || 'Retail Client',
            actorEmail: ord.user?.email,
            actorPhone: ord.user?.phone || ord.shippingAddress?.phone,
            status: ord.status,
            priority: isHighValue ? 'urgent' : 'medium',
            amount: ord.totalPrice,
            currency: 'ZAR',
            reference: ord.orderId || `ORD-${ord._id.toString().slice(-6)}`,
            link: '/orders',
            meta: {
              orderId: ord._id,
              isPaid: ord.isPaid,
              paymentStatus: ord.paymentStatus,
              isGift: ord.isGift,
              city: ord.shippingAddress?.city
            }
          });
        }
      } catch (err) {
        console.warn('[CRM Calendar] Orders query error:', err.message);
      }
    }

    // ==========================================
    // 5. DELIVERIES & TRANSIT
    // ==========================================
    if (!category || category === 'all' || category === 'deliveries') {
      try {
        // Shipments with estimated or actual delivery dates
        const shipments = await Shipment.find({
          $or: [
            { estimatedDeliveryDate: { $gte: rangeStart, $lte: rangeEnd } },
            { actualDeliveryDate: { $gte: rangeStart, $lte: rangeEnd } },
            { createdAt: { $gte: rangeStart, $lte: rangeEnd } }
          ]
        })
          .populate('customerId', 'name email phone')
          .populate('vendorId', 'name storeName')
          .populate('orderId', 'orderId totalPrice shippingAddress')
          .select('shipmentId orderRef status deliveryMethod estimatedDeliveryDate actualDeliveryDate createdAt customerId vendorId orderId tcgWaybillNumber aramexWaybillNumber logisticsException')
          .lean();

        for (const shp of shipments) {
          const waybill = shp.aramexWaybillNumber || shp.tcgWaybillNumber || 'Pending Dispatch';
          const isDelayed = shp.logisticsException?.isException || shp.status === 'Delayed';
          const deliveryDate = shp.actualDeliveryDate || shp.estimatedDeliveryDate || shp.createdAt;

          events.push({
            id: `shipment_${shp._id}`,
            date: toIso(deliveryDate),
            title: shp.actualDeliveryDate
              ? `Delivered: ${shp.shipmentId || shp.orderRef}`
              : `Delivery Expected: ${shp.shipmentId || shp.orderRef}`,
            subtitle: `${shp.customerId?.name || 'Customer'} • Waybill: ${waybill} • Status: ${shp.status}`,
            category: 'deliveries',
            eventType: shp.actualDeliveryDate ? 'delivery_completed' : 'delivery_transit',
            actor: 'customer',
            actorName: shp.customerId?.name || 'Recipient',
            actorEmail: shp.customerId?.email,
            status: shp.status,
            priority: isDelayed ? 'urgent' : (shp.status === 'Delivered' ? 'low' : 'high'),
            reference: shp.shipmentId || shp.orderRef || `SHP-${shp._id.toString().slice(-6)}`,
            link: '/orders',
            meta: {
              shipmentId: shp._id,
              orderRef: shp.orderRef,
              waybill,
              deliveryMethod: shp.deliveryMethod,
              isException: shp.logisticsException?.isException,
              exceptionType: shp.logisticsException?.exceptionType
            }
          });
        }
      } catch (err) {
        console.warn('[CRM Calendar] Shipments query error:', err.message);
      }
    }

    // ==========================================
    // 6. SETTLEMENTS & OPERATION DEADLINES
    // ==========================================
    if (!category || category === 'all' || category === 'settlements') {
      try {
        // 30-Day Vendor Settlement Payouts Due
        const settlements = await VendorSettlement.find({
          payoutDueDate: { $gte: rangeStart, $lte: rangeEnd }
        })
          .select('settlementReference vendorName orderNumber payoutDueDate payoutAmount status')
          .lean();

        for (const set of settlements) {
          events.push({
            id: `settle_${set._id}`,
            date: toIso(set.payoutDueDate),
            title: `Vendor Payout Due: ${set.vendorName}`,
            subtitle: `Ref: ${set.settlementReference} • Payout: R${Number(set.payoutAmount || 0).toLocaleString()} • Status: ${set.status}`,
            category: 'settlements',
            eventType: 'vendor_settlement',
            actor: 'vendor',
            actorName: set.vendorName,
            status: set.status,
            priority: set.status === 'pending' ? 'high' : 'medium',
            amount: set.payoutAmount,
            currency: 'ZAR',
            reference: set.settlementReference,
            link: '/settlements',
            meta: {
              settlementId: set._id,
              orderNumber: set.orderNumber
            }
          });
        }

        // Staff Tasks & Operations Follow-ups
        const tasks = await CrmTask.find({
          dueDate: { $gte: rangeStart, $lte: rangeEnd }
        })
          .populate('assignedTo', 'name email')
          .select('title category priority status dueDate assignedTo description')
          .lean();

        for (const tsk of tasks) {
          events.push({
            id: `task_${tsk._id}`,
            date: toIso(tsk.dueDate),
            title: `Task Deadline: ${tsk.title}`,
            subtitle: `Assigned: ${tsk.assignedTo?.name || 'Operations Desk'} • Category: ${tsk.category} • Priority: ${tsk.priority}`,
            category: 'settlements',
            eventType: 'staff_task',
            actor: 'internal',
            actorName: tsk.assignedTo?.name || 'Staff Member',
            status: tsk.status,
            priority: tsk.priority,
            reference: `TSK-${tsk._id.toString().slice(-6)}`,
            link: '/',
            meta: {
              taskId: tsk._id,
              taskCategory: tsk.category,
              description: tsk.description
            }
          });
        }
      } catch (err) {
        console.warn('[CRM Calendar] Settlements & tasks query error:', err.message);
      }
    }

    // ==========================================
    // FILTERING (Actor & Search)
    // ==========================================
    let filteredEvents = events.filter(e => Boolean(e.date));

    if (actor && actor !== 'all') {
      filteredEvents = filteredEvents.filter(e => e.actor === actor);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filteredEvents = filteredEvents.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.subtitle && e.subtitle.toLowerCase().includes(q)) ||
        (e.reference && e.reference.toLowerCase().includes(q)) ||
        (e.actorName && e.actorName.toLowerCase().includes(q)) ||
        (e.actorEmail && e.actorEmail.toLowerCase().includes(q))
      );
    }

    // Sort chronologically ascending
    filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute summary metrics for executive dashboard
    const todayStr = new Date().toISOString().slice(0, 10);
    const summary = {
      totalEvents: filteredEvents.length,
      todayEvents: filteredEvents.filter(e => e.date?.startsWith(todayStr)).length,
      auctionsCount: filteredEvents.filter(e => e.category === 'auctions').length,
      vipApprovalsCount: filteredEvents.filter(e => e.category === 'vip_approvals').length,
      eventsTicketsCount: filteredEvents.filter(e => e.category === 'events').length,
      ordersCount: filteredEvents.filter(e => e.category === 'orders').length,
      deliveriesCount: filteredEvents.filter(e => e.category === 'deliveries').length,
      settlementsCount: filteredEvents.filter(e => e.category === 'settlements').length,
      rangeStart: toIso(rangeStart),
      rangeEnd: toIso(rangeEnd)
    };

    res.json({
      success: true,
      summary,
      events: filteredEvents
    });
  } catch (err) {
    console.error('[CRM Calendar Controller Error]:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to aggregate calendar operations events',
      error: err.message
    });
  }
};
