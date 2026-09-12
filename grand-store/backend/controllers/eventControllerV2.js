const crypto = require("crypto");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const PlatformSettings = require("../models/PlatformSettings");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const { getNextSequence } = require("../utils/sequenceGenerator");
const { getEventDateKey, getEventPhase, parseEventWindow } = require("../utils/eventLifecycle");

const PAID_PAYMENT_STATUSES = ["Paid", "Completed"];
const MAX_TICKETS_PER_BOOKING = 10;
const RESERVATION_MINUTES = Math.max(10, Number(process.env.EVENT_RESERVATION_MINUTES) || 30);
const BANK_TRANSFER_RESERVATION_HOURS = Math.max(1, Number(process.env.EVENT_BANK_TRANSFER_RESERVATION_HOURS) || 24);

const parseJsonField = (value, fallback = []) => {
  if (value === undefined || value === null || value === "") return fallback;
  return typeof value === "string" ? JSON.parse(value) : value;
};

const normalizeEventInput = (body) => {
  for (const field of ["title", "type", "format", "location", "description"]) {
    if (!String(body[field] || "").trim()) return { error: `${field} is required.` };
  }

  const window = parseEventWindow(body);
  if (window.error) return window;

  const capacity = Number(body.capacity);
  if (!Number.isInteger(capacity) || capacity < 1) {
    return { error: "Event capacity must be a positive whole number." };
  }

  let ticketTiers;
  let tastingJourney;
  let tastingProducts;
  try {
    ticketTiers = parseJsonField(body.ticketTiers);
    tastingJourney = parseJsonField(body.tastingJourney);
    tastingProducts = parseJsonField(body.tastingProducts);
  } catch {
    return { error: "Ticket tiers and tasting details must contain valid JSON." };
  }
  if (!Array.isArray(ticketTiers) || ticketTiers.length === 0) {
    return { error: "At least one ticket tier is required." };
  }

  const names = new Set();
  const normalizedTiers = [];
  for (const tier of ticketTiers) {
    const name = String(tier.name || "").trim();
    const price = Number(tier.price);
    const quantity = Number(tier.quantity);
    if (!name || !Number.isFinite(price) || price < 0) {
      return { error: "Every ticket tier needs a name and a non-negative price." };
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { error: "Every ticket tier quantity must be a positive whole number." };
    }
    if (names.has(name.toLowerCase())) return { error: "Ticket tier names must be unique." };
    names.add(name.toLowerCase());
    normalizedTiers.push({
      name,
      price,
      quantity,
      benefits: Array.isArray(tier.benefits) ? tier.benefits.map(String) : [],
      sold: Number(tier.sold) || 0,
      reserved: Number(tier.reserved) || 0,
    });
  }
  if (normalizedTiers.reduce((sum, tier) => sum + tier.quantity, 0) > capacity) {
    return { error: "Combined ticket quantities cannot exceed the event capacity." };
  }

  return {
    value: {
      title: String(body.title).trim(),
      type: body.type,
      format: body.format,
      date: new Date(`${getEventDateKey(body.date)}T00:00:00.000Z`),
      startTime: body.startTime,
      endTime: body.endTime,
      location: String(body.location).trim(),
      city: String(body.city || "").trim(),
      description: String(body.description).trim(),
      hostName: String(body.hostName || "").trim(),
      hostTitle: String(body.hostTitle || "").trim(),
      capacity,
      ticketTiers: normalizedTiers,
      tastingJourney: Array.isArray(tastingJourney) ? tastingJourney : [],
      tastingProducts: Array.isArray(tastingProducts) ? tastingProducts : [],
    },
    window,
  };
};

const createEvent = async (req, res) => {
  try {
    if (!["vendor_active", "event_host"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only approved vendors or event hosts can create events" });
    }
    if (req.user.role === "event_host") {
      const activeCount = await Event.countDocuments({
        vendorId: req.user._id,
        approvalStatus: { $ne: "rejected" },
        status: { $in: ["upcoming", "ongoing"] },
      });
      if (activeCount >= (req.user.allowedHostLimit || 0)) {
        return res.status(403).json({
          message: `You have reached your limit of ${req.user.allowedHostLimit || 0} active events. Contact support to increase it.`,
        });
      }
    }

    const normalized = normalizeEventInput(req.body);
    if (normalized.error) return res.status(400).json({ message: normalized.error });
    const event = await Event.create({
      ...normalized.value,
      image: req.file?.path || null,
      vendorId: req.user._id,
      status: "upcoming",
      approvalStatus: "pending_approval",
    });
    return res.status(201).json({ message: "Event submitted for admin approval.", event });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ message: "Server error creating event" });
  }
};

const withDerivedStatus = (event) => ({ ...event, status: getEventPhase(event) });

const getEvents = async (_req, res) => {
  try {
    const events = await Event.find({ approvalStatus: "approved", status: { $ne: "cancelled" } })
      .sort({ date: 1, startTime: 1 })
      .populate("vendorId", "name vendorProfile")
      .lean();
    return res.json(events.map(withDerivedStatus));
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ message: "Server error fetching events" });
  }
};

const getEventById = async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const query = {
      approvalStatus: "approved",
      status: { $ne: "cancelled" },
    };

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query.$or = [{ _id: idOrSlug }, { slug: idOrSlug }];
    } else {
      query.slug = idOrSlug;
    }

    const event = await Event.findOne(query)
      .populate("vendorId", "name vendorProfile")
      .populate("tastingProducts")
      .lean();
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.vendorId?._id) {
      const EstateProfile = require("../models/EstateProfile");
      const estate = await EstateProfile.findOne({
        $or: [{ vendorId: event.vendorId._id }, { vendor: event.vendorId._id }]
      }).select("slug");
      if (estate) event.vendorSlug = estate.slug;
    }
    return res.json(withDerivedStatus(event));
  } catch (error) {
    console.error("Error fetching event by ID or slug:", error);
    return res.status(500).json({ message: "Server error fetching event" });
  }
};

const getVendorEvents = async (req, res) => {
  try {
    const events = await Event.find({ vendorId: req.user._id }).sort({ date: -1 }).lean();
    return res.json(events.map(withDerivedStatus));
  } catch (error) {
    console.error("Error fetching vendor events:", error);
    return res.status(500).json({ message: "Server error fetching vendor events" });
  }
};

const getAdminEvents = async (req, res) => {
  try {
    const filter = req.query.approvalStatus ? { approvalStatus: req.query.approvalStatus } : {};
    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .populate("vendorId", "name email vendorProfile")
      .lean();
    return res.json(events.map(withDerivedStatus));
  } catch (error) {
    console.error("Error fetching admin events:", error);
    return res.status(500).json({ message: "Server error fetching events" });
  }
};

const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status === "cancelled") return res.status(400).json({ message: "A cancelled event cannot be approved." });

    const schedule = {
      date: req.body.date || event.date,
      startTime: req.body.startTime || event.startTime,
      endTime: req.body.endTime || event.endTime,
    };
    const window = parseEventWindow(schedule);
    if (window.error) return res.status(400).json({ message: window.error });

    const capacity = Number(req.body.capacity ?? event.capacity);
    const configuredTickets = event.ticketTiers.reduce(
      (sum, tier) => sum + (tier.quantity || 0),
      0,
    );
    if (!Number.isInteger(capacity) || capacity < configuredTickets) {
      return res.status(400).json({ message: `Capacity cannot be lower than ${configuredTickets} configured tickets.` });
    }

    event.date = new Date(`${getEventDateKey(schedule.date)}T00:00:00.000Z`);
    event.startTime = schedule.startTime;
    event.endTime = schedule.endTime;
    event.capacity = capacity;
    event.approvalStatus = "approved";
    event.approvalNote = String(req.body.approvalNote || "").trim();
    event.approvedAt = new Date();
    event.approvedBy = req.user._id;
    event.status = window.startAt <= new Date() ? "ongoing" : "upcoming";
    await event.save();
    return res.json({ message: "Event approved and published.", event });
  } catch (error) {
    console.error("Error approving event:", error);
    return res.status(500).json({ message: "Server error approving event" });
  }
};

const rejectEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (["ongoing", "completed"].includes(getEventPhase(event))) {
      return res.status(400).json({ message: "An active or completed event cannot be rejected." });
    }
    const reason = String(req.body.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "A rejection reason is required." });
    event.approvalStatus = "rejected";
    event.approvalNote = reason;
    event.approvedAt = undefined;
    event.approvedBy = undefined;
    await event.save();
    return res.json({ message: "Event rejected.", event });
  } catch (error) {
    console.error("Error rejecting event:", error);
    return res.status(500).json({ message: "Server error rejecting event" });
  }
};

const bookEvent = async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_BOOKING) {
    return res.status(400).json({ message: `Choose between 1 and ${MAX_TICKETS_PER_BOOKING} tickets.` });
  }

  const paymentMethod = req.body.paymentMethod || "PayFast";
  if (!["PayFast", "Bank Transfer"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Select a valid payment method." });
  }

  const settings = (await PlatformSettings.findOne()) || new PlatformSettings();
  const commissionPct = settings.eventCommissionPct ?? 10;
  const vatPct = settings.vatPct ?? 15;
  const seqNum = await getNextSequence("eventBooking");
  const year = new Date().getFullYear().toString().slice(-2);
  const gsReference = `GS-${year}-EVT-BKG-${seqNum.toString().padStart(6, "0")}`;
  const ticketId = `TKT-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
  const reservationDurationMs = paymentMethod === "Bank Transfer"
    ? BANK_TRANSFER_RESERVATION_HOURS * 60 * 60 * 1000
    : RESERVATION_MINUTES * 60 * 1000;
  const reservationExpiresAt = new Date(Date.now() + reservationDurationMs);
  const session = await mongoose.startSession();

  try {
    let savedBooking;
    let bookedEvent;
    await session.withTransaction(async () => {
      const event = await Event.findById(req.params.id).session(session);
      if (!event) throw Object.assign(new Error("Event not found"), { statusCode: 404 });
      if (event.approvalStatus !== "approved" || !["upcoming", "ongoing"].includes(getEventPhase(event))) {
        throw Object.assign(new Error("This event is not open for booking."), { statusCode: 400 });
      }

      const tier = req.body.ticketTierId
        ? event.ticketTiers.id(req.body.ticketTierId)
        : event.ticketTiers.find((item) => item.name === req.body.ticketType);
      if (!tier) throw Object.assign(new Error("Select a valid ticket tier."), { statusCode: 400 });
      const available = tier.quantity - (tier.sold || 0) - (tier.reserved || 0);
      if (available < quantity) {
        throw Object.assign(new Error(`Only ${Math.max(0, available)} tickets remain in this tier.`), { statusCode: 409 });
      }

      tier.reserved = (tier.reserved || 0) + quantity;
      await event.save({ session });
      const unitPrice = Number(tier.price);
      const subTotal = Number((unitPrice * quantity).toFixed(2));
      const commissionAmount = Number((subTotal * commissionPct / 100).toFixed(2));
      const vatAmount = Number((subTotal * vatPct / (100 + vatPct)).toFixed(2));
      const organizerPayable = Number(Math.max(0, subTotal - commissionAmount - vatAmount).toFixed(2));

      [savedBooking] = await Booking.create([{
        user: req.user._id,
        event: event._id,
        vendor: event.vendorId,
        ticketType: tier.name,
        ticketTierId: tier._id,
        unitPrice,
        quantity,
        subTotal,
        commissionPct,
        commissionAmount,
        vatPct,
        vatAmount,
        organizerPayable,
        totalPrice: subTotal,
        gsReference,
        ticketId,
        paymentMethod,
        bankTransferStatus: paymentMethod === "Bank Transfer" ? "Awaiting_Proof" : undefined,
        paymentStatus: "Pending",
        ticketStatus: "Pending",
        inventoryStatus: "reserved",
        reservationExpiresAt,
      }], { session });
      bookedEvent = event;
    });

    if (paymentMethod === "Bank Transfer") {
      try {
        const { sendEmail } = require("../utils/emailService");
        const { eventBankTransferInstructionsTemplate } = require("../utils/emailTemplates");
        const User = require("../models/User");
        const customer = await User.findById(req.user._id).select("email");
        if (customer?.email) {
          await sendEmail({
            to: customer.email,
            subject: `Payment Required - ${savedBooking.gsReference}`,
            html: eventBankTransferInstructionsTemplate(savedBooking, bookedEvent, settings.bankDetails || {}),
          });
        }
      } catch (emailError) {
        console.error("Failed to send event bank transfer instructions:", emailError);
      }
    }

    const bookingResponse = savedBooking.toObject ? savedBooking.toObject() : { ...savedBooking };
    if (!["Paid", "Completed"].includes(bookingResponse.paymentStatus)) {
      delete bookingResponse.ticketId;
      delete bookingResponse.qrCodeData;
    }

    return res.status(201).json(bookingResponse);
  } catch (error) {
    console.error("Error booking event:", error);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Server error booking event",
    });
  } finally {
    await session.endSession();
  }
};

const processEventPayment = async (bookingId, gatewayDetails = {}) => {
  let result = { processed: false };
  try {
    let booking = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) {
      booking = await Booking.findOne({ $or: [{ ticketId: bookingId }, { gsReference: bookingId }] });
    }
    if (!booking) throw new Error("Event booking not found");

    if (["Refunded", "Cancelled", "Failed"].includes(booking.paymentStatus)) {
      throw new Error(`Cannot process payment for ${booking.paymentStatus.toLowerCase()} booking`);
    }

    const event = await Event.findById(booking.event);
    if (!event) throw new Error("Event not found for booking");

    const isAlreadyPaid = PAID_PAYMENT_STATUSES.includes(booking.paymentStatus) &&
      (booking.inventoryStatus === "sold" || ["Valid", "Used"].includes(booking.ticketStatus));

    if (!isAlreadyPaid) {
      const tier = booking.ticketTierId
        ? event.ticketTiers.id(booking.ticketTierId)
        : event.ticketTiers.find((item) => item.name === booking.ticketType);
      if (!tier) throw new Error("Ticket tier no longer exists");

      if (booking.inventoryStatus === "reserved") {
        tier.reserved = Math.max(0, (tier.reserved || 0) - booking.quantity);
      } else if ((tier.reserved || 0) >= booking.quantity) {
        tier.reserved -= booking.quantity;
      }
      tier.sold = (tier.sold || 0) + booking.quantity;
      await event.save();

      booking.paymentStatus = "Paid";
      booking.ticketStatus = "Valid";
      booking.inventoryStatus = "sold";
      if (booking.paymentMethod === "Bank Transfer") booking.bankTransferStatus = "Approved";
      booking.paymentProcessedAt = new Date();
      booking.gatewayTransactionId = gatewayDetails.gatewayTransactionId || `PF-${Date.now()}`;

      const seqNum = await getNextSequence("eventTransaction");
      const seq = seqNum.toString().padStart(6, "0");
      const transactionYear = new Date().getFullYear().toString().slice(-2);
      await Transaction.create([
        { gsReference: `GS-${transactionYear}-EVT-TXN-${seq}`, type: "payment", module: "events", amount: booking.totalPrice, netAmount: Number((booking.totalPrice * 0.975).toFixed(2)), customer: booking.user, vendor: booking.vendor, gatewayTransactionId: booking.gatewayTransactionId, status: "cleared", description: `Event Ticket Purchase - ${event.title}` },
        { gsReference: `GS-${transactionYear}-EVT-COM-${seq}`, type: "commission", module: "events", amount: booking.commissionAmount, netAmount: booking.commissionAmount, customer: booking.user, vendor: booking.vendor, status: "cleared", description: `Event Commission - ${event.title}` },
        { gsReference: `GS-${transactionYear}-EVT-VAT-${seq}`, type: "vat", module: "events", amount: booking.vatAmount, netAmount: booking.vatAmount, customer: booking.user, vendor: booking.vendor, status: "cleared", description: `Event VAT - ${event.title}` },
        { gsReference: `GS-${transactionYear}-EVT-PAYABLE-${seq}`, type: "payout", module: "events", amount: booking.organizerPayable, netAmount: booking.organizerPayable, customer: booking.user, vendor: booking.vendor, status: "pending", description: `Event Vendor Payable - ${event.title}` },
      ]);

      if (booking.vendor) {
        await Wallet.findOneAndUpdate(
          { vendorId: booking.vendor },
          { $setOnInsert: { vendorId: booking.vendor }, $inc: { pendingBalance: booking.organizerPayable, totalEarned: booking.organizerPayable } },
          { upsert: true }
        );
      }
    }

    // Ensure Real Scannable QR Code Data URL is always generated and saved
    let qrPngBuffer = null;
    try {
      const QRCode = require("qrcode");
      const qrPayload = JSON.stringify({
        ticketId: booking.ticketId,
        gsReference: booking.gsReference,
        event: event.title,
        date: event.date,
        tier: booking.ticketType,
        quantity: booking.quantity,
      });

      if (!booking.qrCodeData) {
        booking.qrCodeData = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: "H",
          margin: 1,
          color: { dark: "#000000", light: "#ffffff" },
        });
      }

      qrPngBuffer = await QRCode.toBuffer(qrPayload, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        color: { dark: "#000000", light: "#ffffff" },
      });
    } catch (qrErr) {
      console.error("QR Code generation error:", qrErr);
    }

    await booking.save();
    result = { processed: true, booking, event, isAlreadyPaid };
  } catch (error) {
    console.error("Error processing event payment:", error);
    throw error;
  }

  // Send Confirmation Email with PDF Pass attachment and CID QR Code
  if (result.processed && !result.booking.emailDispatched) {
    try {
      const { sendEmail } = require("../utils/emailService");
      const { eventTicketConfirmationTemplate } = require("../utils/emailTemplates");
      const User = require("../models/User");
      const userId = result.booking.user?._id || result.booking.user;
      let user = (result.booking.user && result.booking.user.email)
        ? result.booking.user
        : (userId ? await User.findById(userId) : null);

      const recipientEmail = user?.email || result.booking.customerEmail;

      if (recipientEmail) {
        let pdfAttachment = null;
        try {
          const pdfBuffer = await generateTicketPdf({
            booking: result.booking,
            event: result.event,
            user,
            qrDataUrl: result.booking.qrCodeData,
          });
          if (pdfBuffer) {
            pdfAttachment = {
              filename: `TheGrandStore-VIP-Pass-${result.booking.ticketId}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
              contentDisposition: "attachment",
              disposition: "attachment",
            };
          }
        } catch (pdfErr) {
          console.error("Error generating PDF ticket pass for email:", pdfErr);
        }

        const attachments = [];
        if (pdfAttachment) {
          attachments.push(pdfAttachment);
        }

        // Add QR code image as CID attachment for Gmail inline rendering
        let qrPngBuffer = null;
        try {
          const QRCode = require("qrcode");
          const qrPayload = JSON.stringify({
            ticketId: result.booking.ticketId,
            gsReference: result.booking.gsReference,
            event: result.event.title,
            date: result.event.date,
            tier: result.booking.ticketType,
            quantity: result.booking.quantity,
          });
          qrPngBuffer = await QRCode.toBuffer(qrPayload, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 300,
          });
        } catch (qrBufferErr) {
          if (result.booking.qrCodeData && result.booking.qrCodeData.includes("base64,")) {
            qrPngBuffer = Buffer.from(result.booking.qrCodeData.split("base64,")[1], "base64");
          }
        }

        if (qrPngBuffer) {
          // Inline CID for Gmail and HTML email body
          attachments.push({
            filename: "ticket-qr.png",
            content: qrPngBuffer,
            contentType: "image/png",
            cid: "ticketqrcode",
            contentDisposition: "inline",
          });
          // Downloadable image attachment in email client
          attachments.push({
            filename: `VIP-Pass-QR-${result.booking.ticketId}.png`,
            content: qrPngBuffer,
            contentType: "image/png",
            contentDisposition: "attachment",
            disposition: "attachment",
          });
        }

        await sendEmail({
          to: recipientEmail,
          subject: `VIP Event Pass • ${result.event.title} [${result.booking.ticketId}]`,
          html: eventTicketConfirmationTemplate({
            booking: result.booking,
            event: result.event,
            user,
            qrCodeDataUrl: result.booking.qrCodeData,
            qrCodeCid: "cid:ticketqrcode",
          }),
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        result.booking.emailDispatched = true;
        await result.booking.save();
        console.log(`[EVENT TICKET] Successfully dispatched VIP pass email with QR & PDF attachment to ${recipientEmail}`);
      }
    } catch (error) {
      console.error("Failed to send event ticket email:", error);
    }
  }

  return { success: true, booking: result.booking, event: result.event };
};

const cancelEventPayment = async (bookingId, reason = "Payment cancelled") => {
  try {
    let booking = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) {
      booking = await Booking.findOne({ $or: [{ ticketId: bookingId }, { gsReference: bookingId }] });
    }
    if (!booking) {
      return { cancelled: false, message: "Event booking not found" };
    }

    if (["Paid", "Completed"].includes(booking.paymentStatus)) {
      return { cancelled: false, message: "Paid booking cannot be cancelled via gateway cancel" };
    }

    // Release reserved seats from event tier
    if (booking.inventoryStatus === "reserved") {
      const event = await Event.findById(booking.event);
      if (event && event.ticketTiers) {
        const tier = booking.ticketTierId
          ? event.ticketTiers.id(booking.ticketTierId)
          : event.ticketTiers.find((item) => item.name === booking.ticketType);
        if (tier) {
          tier.reserved = Math.max(0, (tier.reserved || 0) - booking.quantity);
          await event.save();
        }
      }
      booking.inventoryStatus = "released";
    }

    booking.paymentStatus = "Cancelled";
    booking.ticketStatus = "Cancelled";
    booking.reservationExpiresAt = null;
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    await booking.save();

    // Dispatch payment failure notice to customer's Gmail
    if (!booking.failureEmailDispatched) {
      try {
        const { sendEmail } = require("../utils/emailService");
        const { paymentFailedEmailTemplate } = require("../utils/emailTemplates");
        const User = require("../models/User");
        const userId = booking.user?._id || (mongoose.Types.ObjectId.isValid(booking.user) ? booking.user : null);
        const user = userId ? await User.findById(userId) : null;
        const recipientEmail = booking.user?.email || user?.email || booking.customerEmail;
        const customerName = booking.user?.name || user?.name || "Valued Patron";
        const event = await Event.findById(booking.event);

        if (recipientEmail) {
          const storeUrl = process.env.FRONTEND_URL || "https://grandstoreglobal.com";
          const retryUrl = `${storeUrl}/customer/event-order/${booking._id}?payment=cancel`;
          await sendEmail({
            to: recipientEmail,
            subject: `Payment Notice • Event Booking [${booking.ticketId || booking.gsReference}] Unsuccessful`,
            html: paymentFailedEmailTemplate({
              customerName,
              reference: booking.ticketId || booking.gsReference || String(booking._id),
              itemName: `Event Ticket: ${event?.title || "Grand Store Event"} (${booking.quantity}x ${booking.ticketType})`,
              amount: booking.totalPrice,
              retryUrl,
              reason: reason || "Your ticket payment attempt was cancelled or could not be completed on PayFast. Reserved tickets have been released.",
            }),
          });
          booking.failureEmailDispatched = true;
          await booking.save();
        }
      } catch (emailErr) {
        console.warn("cancelEventPayment: failed to send payment failure email:", emailErr.message);
      }
    }

    console.log(`[EVENT TICKET] Successfully cancelled booking ${booking._id} (${booking.gsReference}): ${reason}`);
    return { cancelled: true, booking };
  } catch (err) {
    console.error("Error in cancelEventPayment:", err);
    throw err;
  }
};

// Public/authenticated endpoint to download ticket pass as PDF
const downloadTicketPdf = async (req, res) => {
  try {
    const { bookingId } = req.params;
    let booking = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) {
      booking = await Booking.findOne({ $or: [{ ticketId: bookingId }, { gsReference: bookingId }] });
    }
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isPaid = ["Paid", "Completed"].includes(booking.paymentStatus);
    if (!isPaid) {
      return res.status(403).json({
        message: "VIP Admission pass and official PDF ticket are locked until payment is verified and cleared."
      });
    }

    const eventId = booking.event?._id || booking.event;
    const event = (booking.event && booking.event.title) ? booking.event : (eventId ? await Event.findById(eventId) : null);
    const User = require("../models/User");
    const userId = booking.user?._id || booking.user;
    const user = (booking.user && booking.user.name) ? booking.user : (userId ? await User.findById(userId) : null);

    if (!booking.qrCodeData) {
      const QRCode = require("qrcode");
      const qrPayload = JSON.stringify({
        ticketId: booking.ticketId,
        gsReference: booking.gsReference,
        event: event?.title,
        date: event?.date,
        tier: booking.ticketType,
        quantity: booking.quantity,
      });
      booking.qrCodeData = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "H",
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { qrCodeData: booking.qrCodeData } }
      );
    }

    const pdfBuffer = await generateTicketPdf({
      booking,
      event: event || { title: "Grand Store Event", location: "Cape Town", date: new Date() },
      user: user || { name: "Guest" },
      qrDataUrl: booking.qrCodeData,
    });

    if (req.query.format === "base64" || req.query.format === "json") {
      return res.json({
        success: true,
        ticketId: booking.ticketId,
        gsReference: booking.gsReference,
        paymentStatus: booking.paymentStatus,
        ticketStatus: booking.ticketStatus,
        emailDispatched: booking.emailDispatched,
        customerEmail: user?.email,
        paymentProcessedAt: booking.paymentProcessedAt,
        bookingDate: booking.bookingDate,
        pdfBase64: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
        qrBase64: booking.qrCodeData,
        filename: `TheGrandStore-VIP-Pass-${booking.ticketId}.pdf`,
        qrFilename: `VIP-Pass-QR-${booking.ticketId}.png`,
      });
    }

    const isDownload = req.query.download === "true" || req.query.download === "1";
    res.set({
      "Content-Type": isDownload ? "application/octet-stream" : "application/pdf",
      "Content-Disposition": `attachment; filename="TheGrandStore-Pass-${booking.ticketId}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading ticket PDF:", error);
    return res.status(500).json({ message: "Could not generate ticket PDF", error: error.message });
  }
};

// Resend Ticket Pass email with PDF attachment
const resendTicketEmail = async (req, res) => {
  try {
    const { bookingId } = req.params;
    let booking = null;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await Booking.findById(bookingId);
    }
    if (!booking) {
      booking = await Booking.findOne({ $or: [{ ticketId: bookingId }, { gsReference: bookingId }] });
    }
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (
      req.user &&
      booking.user &&
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res.status(403).json({ message: "Not authorized to resend tickets for this booking" });
    }

    const isPaid = ["Paid", "Completed"].includes(booking.paymentStatus);
    if (!isPaid) {
      return res.status(403).json({
        message: "VIP Admission pass email is only available after payment has been verified."
      });
    }

    const eventId = booking.event?._id || booking.event;
    const event = (booking.event && booking.event.title) ? booking.event : (eventId ? await Event.findById(eventId) : null);
    const User = require("../models/User");
    const userId = booking.user?._id || booking.user;
    const user = (booking.user && booking.user.name) ? booking.user : (userId ? await User.findById(userId) : null);

    const recipientEmail = user?.email || req.user?.email;
    if (!recipientEmail) {
      return res.status(400).json({ message: "No recipient email address on record" });
    }

    if (!booking.qrCodeData) {
      const QRCode = require("qrcode");
      const qrPayload = JSON.stringify({
        ticketId: booking.ticketId,
        gsReference: booking.gsReference,
        event: event?.title,
        date: event?.date,
        tier: booking.ticketType,
        quantity: booking.quantity,
      });
      booking.qrCodeData = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "H",
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { qrCodeData: booking.qrCodeData } }
      );
    }

    let pdfAttachment = null;
    try {
      const pdfBuffer = await generateTicketPdf({
        booking,
        event: event || { title: "Grand Store Event", location: "Cape Town", date: new Date() },
        user: user || req.user || { name: "Valued Patron" },
        qrDataUrl: booking.qrCodeData,
      });
      if (pdfBuffer) {
        pdfAttachment = {
          filename: `TheGrandStore-VIP-Pass-${booking.ticketId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
          contentDisposition: "attachment",
          disposition: "attachment",
        };
      }
    } catch (pdfErr) {
      console.error("Error generating PDF ticket pass for resend email:", pdfErr);
    }

    const attachments = [];
    if (pdfAttachment) {
      attachments.push(pdfAttachment);
    }

    let qrPngBuffer = null;
    try {
      const QRCode = require("qrcode");
      const qrPayload = JSON.stringify({
        ticketId: booking.ticketId,
        gsReference: booking.gsReference,
        event: event?.title,
        date: event?.date,
        tier: booking.ticketType,
        quantity: booking.quantity,
      });
      qrPngBuffer = await QRCode.toBuffer(qrPayload, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
      });
    } catch (qrBufferErr) {
      if (booking.qrCodeData && booking.qrCodeData.includes("base64,")) {
        qrPngBuffer = Buffer.from(booking.qrCodeData.split("base64,")[1], "base64");
      }
    }

    if (qrPngBuffer) {
      // Inline CID for Gmail HTML body
      attachments.push({
        filename: "ticket-qr.png",
        content: qrPngBuffer,
        contentType: "image/png",
        cid: "ticketqrcode",
        contentDisposition: "inline",
      });
      // Downloadable image attachment in email client
      attachments.push({
        filename: `VIP-Pass-QR-${booking.ticketId}.png`,
        content: qrPngBuffer,
        contentType: "image/png",
        contentDisposition: "attachment",
        disposition: "attachment",
      });
    }

    await sendEmail({
      to: recipientEmail,
      subject: `VIP Event Pass • ${event?.title || 'Grand Store Event'} [${booking.ticketId}]`,
      html: eventTicketConfirmationTemplate({
        booking,
        event: event || { title: "Grand Store Event", location: "Cape Town", date: new Date() },
        user: user || req.user || { name: "Valued Patron" },
        qrCodeDataUrl: booking.qrCodeData,
        qrCodeCid: "cid:ticketqrcode",
      }),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return res.json({
      success: true,
      message: `VIP Pass email successfully resent to ${recipientEmail} with PDF attachment!`,
    });
  } catch (error) {
    console.error("Error in resendTicketEmail:", error);
    return res.status(500).json({ message: "Could not resend ticket email", error: error.message });
  }
};

// Generate high-resolution luxury PDF Ticket Pass
const generateTicketPdf = async ({ booking, event, user, qrDataUrl }) => {
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Luxury dark background
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 297, "F");

  // Dual gold borders
  doc.setDrawColor(201, 163, 91);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, 190, 277);
  doc.setLineWidth(0.4);
  doc.rect(13, 13, 184, 271);

  // Header Brand Logo at Top
  try {
    const fs = require("fs");
    const path = require("path");
    const possibleLogoPaths = [
      path.join(__dirname, "../assets/logo.png"),
      path.join(__dirname, "../assets/grand-store-email-lockup.png"),
      path.join(__dirname, "../../frontend/public/logo.png"),
    ];
    const logoPath = possibleLogoPaths.find((p) => fs.existsSync(p));
    if (logoPath) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString("base64");
      // Center logo: 65mm wide, 20.6mm high at y = 17mm
      doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", 72.5, 17, 65, 20.6, "BRAND_LOGO", "FAST");
    } else {
      doc.setTextColor(201, 163, 91);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("THE GRAND STORE", 105, 30, { align: "center" });
    }
  } catch (logoErr) {
    console.warn("Could not embed logo in ticket PDF:", logoErr.message);
    doc.setTextColor(201, 163, 91);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("THE GRAND STORE", 105, 30, { align: "center" });
  }

  doc.setFontSize(9.5);
  doc.setTextColor(190, 170, 130);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL VIP CELLAR ACCESS PASS", 105, 41, { align: "center" });

  // Gold divider
  doc.setDrawColor(201, 163, 91);
  doc.setLineWidth(0.5);
  doc.line(30, 46, 180, 46);

  // Event Details
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(event?.title || "Exclusive Tasting Experience", 105, 58, { align: "center", maxWidth: 160 });

  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  const eventDateFormatted = new Date(event?.date || Date.now()).toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Date: ${eventDateFormatted}`, 105, 69, { align: "center" });
  doc.text(`Time: ${event?.startTime || "18:00 Doors Open"}`, 105, 76, { align: "center" });
  doc.text(`Venue: ${event?.location || "The Grand Store Private Vault"}`, 105, 83, { align: "center", maxWidth: 160 });

  // Card Box for Pass Details
  doc.setFillColor(20, 18, 15);
  doc.setDrawColor(201, 163, 91);
  doc.rect(25, 93, 160, 56, "FD");

  doc.setTextColor(201, 163, 91);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PASS HOLDER:", 35, 104);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(user?.name || "Distinguished Guest", 35, 111);

  doc.setTextColor(201, 163, 91);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TICKET ID:", 35, 122);
  doc.setTextColor(245, 215, 127);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(booking.ticketId || "N/A", 35, 129);

  doc.setTextColor(201, 163, 91);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("REF:", 35, 139);
  doc.setTextColor(170, 170, 170);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(booking.gsReference || "N/A", 48, 139);

  doc.setTextColor(201, 163, 91);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TIER & QUANTITY:", 115, 104);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`${booking.ticketType} (Qty: ${booking.quantity})`, 115, 111);

  doc.setTextColor(201, 163, 91);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("STATUS & TOTAL:", 115, 122);
  doc.setTextColor(74, 222, 128);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`R ${Number(booking.totalPrice || 0).toLocaleString("en-ZA")} • VERIFIED`, 115, 129);

  doc.setTextColor(201, 163, 91);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("ADMISSION:", 115, 139);
  doc.setTextColor(74, 222, 128);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("VALID FOR ENTRY", 140, 139);

  // QR Code
  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(63, 156, 84, 84, 3, 3, "F");
    doc.addImage(qrDataUrl, "PNG", 65, 158, 80, 80);
  }

  doc.setTextColor(201, 163, 91);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SCAN AT RECEPTION FOR VIP CELLAR ADMISSION", 105, 252, { align: "center" });

  doc.setTextColor(140, 140, 140);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Strictly 18+ • Non-Transferable Digital Access Pass • The Grand Store PTY LTD", 105, 264, { align: "center" });
  doc.text("Please present this document on your mobile device or as a printed pass on arrival.", 105, 270, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
};

const uploadEventBankTransferProof = async (req, res) => {
  try {
    const proofUrl = String(req.body.proofUrl || "").trim();
    if (!proofUrl) return res.status(400).json({ message: "Proof of payment URL is required." });

    try {
      const parsedUrl = new URL(proofUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Unsupported protocol");
    } catch {
      return res.status(400).json({ message: "Enter a valid HTTP or HTTPS proof URL." });
    }

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Event booking not found." });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot modify this booking." });
    }
    if (booking.paymentMethod !== "Bank Transfer") {
      return res.status(400).json({ message: "This booking does not use bank transfer." });
    }
    if (booking.paymentStatus !== "Pending" || booking.inventoryStatus !== "reserved") {
      return res.status(400).json({ message: "This ticket reservation can no longer accept payment proof." });
    }
    if (booking.reservationExpiresAt && booking.reservationExpiresAt <= new Date()) {
      return res.status(410).json({ message: "This ticket reservation has expired. Please book again." });
    }

    booking.proofUrl = proofUrl;
    booking.proofSubmittedAt = new Date();
    booking.bankTransferStatus = "Awaiting_Approval";
    booking.paymentRejectionReason = undefined;
    booking.reservationExpiresAt = undefined;
    await booking.save();

    return res.json({
      message: "Proof uploaded successfully. Your ticket is awaiting payment verification.",
      booking,
    });
  } catch (error) {
    console.error("Error uploading event payment proof:", error);
    return res.status(500).json({ message: "Server error uploading payment proof." });
  }
};

const approveEventBankTransfer = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Event booking not found." });
    if (PAID_PAYMENT_STATUSES.includes(booking.paymentStatus)) {
      return res.status(400).json({ message: "This event booking is already paid." });
    }
    if (
      booking.paymentMethod !== "Bank Transfer" ||
      booking.bankTransferStatus !== "Awaiting_Approval" ||
      !booking.proofUrl
    ) {
      return res.status(400).json({ message: "This event payment is not ready for approval." });
    }

    const result = await processEventPayment(booking._id, {
      gatewayTransactionId: `BANK-${booking.gsReference || booking._id}`,
    });
    return res.json({ message: "Event payment approved and ticket issued.", booking: result.booking });
  } catch (error) {
    console.error("Error approving event bank transfer:", error);
    return res.status(500).json({ message: error.message || "Server error approving event payment." });
  }
};

const rejectEventBankTransfer = async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  if (!reason) return res.status(400).json({ message: "A rejection reason is required." });

  const session = await mongoose.startSession();
  let rejectedBooking;
  try {
    await session.withTransaction(async () => {
      const booking = await Booking.findById(req.params.bookingId).session(session);
      if (!booking) throw Object.assign(new Error("Event booking not found."), { statusCode: 404 });
      if (
        booking.paymentMethod !== "Bank Transfer" ||
        booking.bankTransferStatus !== "Awaiting_Approval" ||
        booking.paymentStatus !== "Pending"
      ) {
        throw Object.assign(new Error("This event payment is not awaiting review."), { statusCode: 400 });
      }

      const event = await Event.findById(booking.event).session(session);
      const tier = event && (booking.ticketTierId
        ? event.ticketTiers.id(booking.ticketTierId)
        : event.ticketTiers.find((item) => item.name === booking.ticketType));
      if (tier && booking.inventoryStatus === "reserved") {
        tier.reserved = Math.max(0, (tier.reserved || 0) - booking.quantity);
        await event.save({ session });
      }

      booking.paymentStatus = "Failed";
      booking.ticketStatus = "Cancelled";
      booking.inventoryStatus = "released";
      booking.bankTransferStatus = "Rejected";
      booking.paymentRejectionReason = reason;
      rejectedBooking = await booking.save({ session });
    });

    try {
      const { sendEmail } = require("../utils/emailService");
      const { genericNotificationTemplate } = require("../utils/emailTemplates");
      const User = require("../models/User");
      const customer = await User.findById(rejectedBooking.user).select("email");
      if (customer?.email) {
        await sendEmail({
          to: customer.email,
          subject: `Event Payment Rejected - ${rejectedBooking.gsReference}`,
          html: genericNotificationTemplate("Event Payment Rejected", `Your bank transfer proof was rejected.<br><br><strong>Reason:</strong> ${reason}<br><br>The ticket reservation has been released. Please book again or contact support if you need help.`),
        });
      }
    } catch (emailError) {
      console.error("Failed to send event payment rejection email:", emailError);
    }

    return res.json({ message: "Event payment rejected and ticket inventory released.", booking: rejectedBooking });
  } catch (error) {
    console.error("Error rejecting event bank transfer:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Server error rejecting event payment." });
  } finally {
    await session.endSession();
  }
};

const releaseExpiredReservations = async (now = new Date()) => {
  const expired = await Booking.find({
    paymentStatus: "Pending",
    inventoryStatus: "reserved",
    reservationExpiresAt: { $lte: now },
  }).select("_id");
  let released = 0;
  for (const record of expired) {
    try {
      const booking = await Booking.findOne({ _id: record._id, paymentStatus: "Pending", inventoryStatus: "reserved" });
      if (!booking) continue;
      const event = await Event.findById(booking.event);
      const tier = event && (booking.ticketTierId ? event.ticketTiers.id(booking.ticketTierId) : event.ticketTiers.find((item) => item.name === booking.ticketType));
      if (tier) {
        tier.reserved = Math.max(0, (tier.reserved || 0) - booking.quantity);
        await event.save();
      }
      booking.paymentStatus = "Failed";
      booking.ticketStatus = "Cancelled";
      booking.inventoryStatus = "released";
      booking.reservationExpiresAt = null;
      await booking.save();
      released += 1;
    } catch (err) {
      console.error(`Failed to release reservation ${record._id}:`, err);
    }
  }
  return released;
};

const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "title date startTime endTime location image status")
      .sort({ bookingDate: -1 });

    const sanitizedBookings = bookings.map((b) => {
      const doc = b.toObject ? b.toObject() : { ...b };
      const isPaid = ["Paid", "Completed"].includes(doc.paymentStatus);
      if (!isPaid) {
        delete doc.ticketId;
        delete doc.qrCodeData;
      }
      return doc;
    });

    return res.json(sanitizedBookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({ message: "Server error fetching tickets" });
  }
};

const getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event || event.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view these attendees" });
    }
    const attendees = await Booking.find({ event: event._id, paymentStatus: { $in: PAID_PAYMENT_STATUSES } })
      .populate("user", "name email")
      .sort({ bookingDate: -1 });
    return res.json(attendees);
  } catch (error) {
    console.error("Error fetching attendees:", error);
    return res.status(500).json({ message: "Server error fetching attendees" });
  }
};

const extractTicketIdentifier = (input) => {
  if (!input) return "";
  if (typeof input === "object") {
    return input.ticketId || input.ticket_id || input.id || input._id || input.gsReference || "";
  }
  let str = String(input).trim();
  // Strip enclosing single/double quotes if present
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  // Try parsing JSON if payload is formatted as JSON string (e.g. from React Native QR code)
  if ((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("[") && str.endsWith("]"))) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === "object") {
        return parsed.ticketId || parsed.ticket_id || parsed.id || parsed._id || parsed.gsReference || str;
      }
    } catch (_) {}
  }
  // Try extracting ticket ID if payload is a URL
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
    const identifier = extractTicketIdentifier(rawInput);

    if (!identifier) {
      return res.status(400).json({ message: "No ticket code provided." });
    }

    const queryConditions = [
      { ticketId: identifier },
      { gsReference: identifier }
    ];

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      queryConditions.push({ _id: identifier });
    }

    const booking = await Booking.findOne({ $or: queryConditions })
      .populate("event", "title date vendorId location startTime")
      .populate("user", "name email phone");

    if (!booking) {
      return res.status(404).json({ message: "Ticket not found. Please verify the ticket ID." });
    }

    if (!booking.event) {
      return res.status(400).json({ message: "The event linked to this ticket no longer exists." });
    }

    const isOwnerVendor = (booking.event.vendorId && booking.event.vendorId.toString() === req.user._id.toString()) ||
                          (booking.vendor && booking.vendor.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'event_host';

    if (!isOwnerVendor && !isAdmin) {
      return res.status(403).json({ message: "Ticket belongs to an event you do not manage" });
    }

    if (!PAID_PAYMENT_STATUSES.includes(booking.paymentStatus) && booking.bankTransferStatus !== "Approved") {
      return res.status(400).json({ message: "This ticket has not been paid.", booking });
    }

    if (booking.ticketStatus === "Used") {
      return res.status(400).json({ message: "Ticket has already been used", booking });
    }

    if (booking.ticketStatus === "Cancelled") {
      return res.status(400).json({ message: "Ticket has been cancelled", booking });
    }

    const update = await Booking.updateOne(
      { _id: booking._id, ticketStatus: { $ne: "Used" } },
      { $set: { ticketStatus: "Used" } }
    );

    if (update.modifiedCount !== 1 && booking.ticketStatus === "Used") {
      return res.status(409).json({ message: "Ticket was already checked in.", booking });
    }

    booking.ticketStatus = "Used";
    return res.json({ 
      message: "Ticket successfully verified and checked in", 
      booking 
    });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    return res.status(500).json({ message: "Server error verifying ticket" });
  }
};

const joinWaitlist = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.approvalStatus !== "approved" || !["upcoming", "ongoing"].includes(getEventPhase(event))) {
      return res.status(400).json({ message: "This event is not accepting a waitlist." });
    }
    const available = event.ticketTiers.reduce((sum, tier) => sum + tier.quantity - (tier.sold || 0) - (tier.reserved || 0), 0);
    if (available > 0) return res.status(400).json({ message: "Tickets are still available for this event." });
    if (event.waitlist.some((entry) => entry.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: "You are already on the waitlist for this event." });
    }
    event.waitlist.push({ user: req.user._id });
    await event.save();
    return res.json({ message: "Successfully joined the waitlist!" });
  } catch (error) {
    console.error("Error joining waitlist:", error);
    return res.status(500).json({ message: "Server error joining waitlist" });
  }
};

module.exports = {
  approveEventBankTransfer,
  approveEvent,
  bookEvent,
  createEvent,
  getAdminEvents,
  getEventAttendees,
  getEventById,
  getEvents,
  getUserBookings,
  getVendorEvents,
  joinWaitlist,
  normalizeEventInput,
  processEventPayment,
  cancelEventPayment,
  rejectEventBankTransfer,
  rejectEvent,
  releaseExpiredReservations,
  downloadTicketPdf,
  resendTicketEmail,
  generateTicketPdf,
  uploadEventBankTransferProof,
  verifyTicket,
};
