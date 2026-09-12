const Event = require("../models/Event");
const Booking = require("../models/Booking");
const PlatformSettings = require("../models/PlatformSettings");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const { getNextSequence } = require("../utils/sequenceGenerator");

// @desc    Create a new event (Vendor only)
// @route   POST /api/events
// @access  Private (Vendor)
const createEvent = async (req, res) => {
  try {
    if (req.user.role !== "vendor_active" && req.user.role !== "event_host") {
      return res
        .status(403)
        .json({ message: "Only approved vendors or event hosts can create events" });
    }

    if (req.user.role === "event_host") {
      const currentEventsCount = await Event.countDocuments({ vendorId: req.user._id });
      if (currentEventsCount >= (req.user.allowedHostLimit || 0)) {
        return res.status(403).json({ message: `You have reached your limit of ${req.user.allowedHostLimit || 0} events. Contact support to increase it.` });
      }
    }

    const {
      title,
      type,
      format,
      date,
      startTime,
      endTime,
      location,
      city,
      description,
      hostName,
      hostTitle,
      capacity,
      ticketTiers,
      tastingJourney,
      tastingProducts,
    } = req.body;

    let image = null;
    if (req.file) {
      image = req.file.path;
    }

    // Parse JSON strings back into objects/arrays if they come from FormData
    const parsedTicketTiers = ticketTiers ? JSON.parse(ticketTiers) : [];
    const parsedTastingJourney = tastingJourney
      ? JSON.parse(tastingJourney)
      : [];
    const parsedTastingProducts = tastingProducts
      ? JSON.parse(tastingProducts)
      : [];

    const newEvent = new Event({
      title,
      type,
      format,
      date,
      startTime,
      endTime,
      location,
      city,
      description,
      hostName,
      hostTitle,
      image,
      capacity: Number(capacity) || 0,
      ticketTiers: parsedTicketTiers,
      tastingJourney: parsedTastingJourney,
      tastingProducts: parsedTastingProducts,
      vendorId: req.user._id,
      approvalStatus: "approved",
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error creating event" });
  }
};

// @desc    Get all approved events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    // Only return events that are approved
    const events = await Event.find({ approvalStatus: "approved" })
      .sort({ date: 1 })
      .populate("vendorId", "name vendorProfile");
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error fetching events" });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("vendorId", "name vendorProfile")
      .populate("tastingProducts")
      .lean();

    if (event) {
      if (event.vendorId && event.vendorId._id) {
        const EstateProfile = require('../models/EstateProfile');
        const estate = await EstateProfile.findOne({ vendor: event.vendorId._id }).select('slug');
        if (estate) {
          event.vendorSlug = estate.slug;
        }
      }
      res.json(event);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    res.status(500).json({ message: "Server error fetching event" });
  }
};

// @desc    Get all events for a specific vendor
// @route   GET /api/events/vendor
// @access  Private (Vendor)
const getVendorEvents = async (req, res) => {
  try {
    const events = await Event.find({ vendorId: req.user._id }).sort({
      date: -1,
    });
    res.json(events);
  } catch (error) {
    console.error("Error fetching vendor events:", error);
    res.status(500).json({ message: "Server error fetching vendor events" });
  }
};

// @desc    Book an event
// @route   POST /api/events/:id/book
// @access  Private
const bookEvent = async (req, res) => {
  try {
    const { ticketType, quantity, totalPrice } = req.body;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Generate a unique ticket ID
    const ticketId = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // Fetch platform fee settings
    let settings = await PlatformSettings.findOne();
    if (!settings) settings = await PlatformSettings.create({});

    // Accounting calculations
    const ticketTier = event.ticketTiers.find((t) => t.name === ticketType);
    const ticketUnitPrice = ticketTier
      ? ticketTier.price
      : totalPrice / quantity;
    const subTotal = ticketUnitPrice * quantity;
    const commissionPct = settings.eventCommissionPct || 10;
    const commissionAmount = parseFloat(
      ((subTotal * commissionPct) / 100).toFixed(2),
    );
    const vatPct = settings.vatPct || 15;
    const vatAmount = parseFloat(((subTotal * vatPct) / 100).toFixed(2));
    const organizerPayable = parseFloat(
      (subTotal - commissionAmount - vatAmount).toFixed(2),
    );
    const customerTotal = parseFloat(subTotal.toFixed(2));

    // GS Reference
    const year = new Date().getFullYear().toString().slice(-2);
    const seqNum = await getNextSequence("eventBooking");
    const gsReference = `GS-${year}-EVT-BKG-${seqNum.toString().padStart(6, "0")}`;

    const booking = new Booking({
      user: req.user._id,
      event: eventId,
      vendor: event.vendorId,
      ticketType,
      quantity,
      subTotal,
      commissionPct,
      commissionAmount,
      vatPct,
      vatAmount,
      organizerPayable,
      totalPrice: customerTotal,
      gsReference,
      ticketId,
      paymentStatus: "Pending",
      ticketStatus: "Pending",
    });

    const savedBooking = await booking.save();

    res.status(201).json(savedBooking);
  } catch (error) {
    console.error("Error booking event:", error);
    res.status(500).json({ message: "Server error booking event" });
  }
};

/**
 * Process the ledger transactions, wallet updates, and event sold quantities after a successful event payment
 * This function will be called by the PayFast ITN Webhook Controller
 */
const processEventPayment = async (bookingId, gatewayDetails = {}) => {
  const { processEventPayment: processEventPaymentV2 } = require("./eventControllerV2");
  return await processEventPaymentV2(bookingId, gatewayDetails);
};

const cancelEventPayment = async (bookingId, reason) => {
  const { cancelEventPayment: cancelEventPaymentV2 } = require("./eventControllerV2");
  return await cancelEventPaymentV2(bookingId, reason);
};

// @desc    Get user's event bookings
// @route   GET /api/events/bookings/my-tickets
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "title date startTime location image")
      .sort({ bookingDate: -1 });

    const QRCode = require("qrcode");
    for (const b of bookings) {
      if (!b.qrCodeData && b.ticketId) {
        try {
          const qrPayload = JSON.stringify({
            ticketId: b.ticketId,
            gsReference: b.gsReference,
            event: b.event?.title,
            date: b.event?.date,
            tier: b.ticketType,
            quantity: b.quantity,
          });
          b.qrCodeData = await QRCode.toDataURL(qrPayload, {
            errorCorrectionLevel: "H",
            margin: 1,
            color: { dark: "#000000", light: "#ffffff" },
          });
          await Booking.updateOne({ _id: b._id }, { $set: { qrCodeData: b.qrCodeData } });
        } catch (qrErr) {
          console.error("Error auto-generating qrCodeData in getUserBookings:", qrErr);
        }
      }
    }

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Server error fetching tickets" });
  }
};

// @desc    Get event attendees (Vendor)
// @route   GET /api/events/vendor/:id/attendees
// @access  Private (Vendor)
const getEventAttendees = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event || event.vendorId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view these attendees" });
    }

    const attendees = await Booking.find({ event: eventId })
      .populate("user", "name email")
      .sort({ bookingDate: -1 });

    res.json(attendees);
  } catch (error) {
    console.error("Error fetching attendees:", error);
    res.status(500).json({ message: "Server error fetching attendees" });
  }
};

// @desc    Verify event ticket (Vendor)
// @route   POST /api/events/vendor/verify-ticket
// @access  Private (Vendor)
const extractTicketIdentifierLegacy = (input) => {
  if (!input) return "";
  if (typeof input === "object") {
    return input.ticketId || input.ticket_id || input.id || input._id || input.gsReference || "";
  }
  let str = String(input).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  if ((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("[") && str.endsWith("]"))) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === "object") {
        return parsed.ticketId || parsed.ticket_id || parsed.id || parsed._id || parsed.gsReference || str;
      }
    } catch (_) {}
  }
  if (str.startsWith("http://") || str.startsWith("https://")) {
    try {
      const url = new URL(str);
      return url.searchParams.get("ticketId") || url.searchParams.get("ticket") || url.searchParams.get("id") || str.split("/").pop() || str;
    } catch (_) {}
  }
  return str;
};

const verifyTicket = async (req, res) => {
  try {
    const rawInput = req.body.ticketId || req.body.code || req.body.data || req.body.qrData || req.body.ticket;
    const identifier = extractTicketIdentifierLegacy(rawInput);

    if (!identifier) {
      return res.status(400).json({ message: "No ticket code provided." });
    }

    const mongoose = require("mongoose");
    const queryConditions = [
      { ticketId: identifier },
      { gsReference: identifier }
    ];

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      queryConditions.push({ _id: identifier });
    }

    const booking = await Booking.findOne({ $or: queryConditions }).populate(
      "event",
      "title date vendorId location startTime",
    ).populate("user", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Ticket not found. Please verify the ticket ID." });
    }

    const isOwnerVendor = (booking.event?.vendorId && booking.event.vendorId.toString() === req.user._id.toString()) ||
                          (booking.vendor && booking.vendor.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'event_host';

    if (!isOwnerVendor && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Ticket belongs to an event you do not manage" });
    }

    if (booking.ticketStatus === "Used") {
      return res
        .status(400)
        .json({ message: "Ticket has already been used", booking });
    }

    if (booking.ticketStatus === "Cancelled") {
      return res.status(400).json({ message: "Ticket is cancelled", booking });
    }

    booking.ticketStatus = "Used";
    await booking.save();

    res.json({
      message: "Ticket successfully verified and marked as used",
      booking,
    });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    res.status(500).json({ message: "Server error verifying ticket" });
  }
};

// @desc    Join waitlist for an event
// @route   POST /api/events/:id/waitlist
// @access  Private
const joinWaitlist = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is already on waitlist
    const alreadyOnWaitlist = event.waitlist.some(
      (entry) => entry.user.toString() === req.user._id.toString(),
    );

    if (alreadyOnWaitlist) {
      return res
        .status(400)
        .json({ message: "You are already on the waitlist for this event." });
    }

    event.waitlist.push({ user: req.user._id });
    await event.save();

    res.status(200).json({ message: "Successfully joined the waitlist!" });
  } catch (error) {
    console.error("Error joining waitlist:", error);
    res.status(500).json({ message: "Server error joining waitlist" });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  getVendorEvents,
  bookEvent,
  processEventPayment,
  cancelEventPayment,
  getUserBookings,
  getEventAttendees,
  verifyTicket,
  joinWaitlist,
};
