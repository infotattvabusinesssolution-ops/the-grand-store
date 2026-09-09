const mongoose = require("mongoose");
const User = require("../models/User");
const Vendor = require("../models/Vendor");
const Order = require("../models/Order");
const AuctionLot = require("../models/AuctionLot");
const Booking = require("../models/Booking");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/emailService");
const {
  generateEmailTemplate,
  vendorApprovalTemplate,
  genericNotificationTemplate,
} = require("../utils/emailTemplates");

const STAFF_ROLES = ["accountant", "product_manager", "admin"];

const findOrderByIdOrReference = async (orderId) => {
  if (!orderId) return null;
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    const byId = await Order.findById(orderId);
    if (byId) return byId;
  }
  return await Order.findOne({
    $or: [
      { orderId: orderId },
      { invoiceNumber: orderId },
      { transactionId: orderId },
    ],
  });
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $nin: ["admin", "super_admin", ...STAFF_ROLES] } });
    const totalVendors = await Vendor.countDocuments({ status: "approved" });
    const pendingVendors = await Vendor.countDocuments({
      status: "pending_approval",
    });

    // Revenue calculations could be complex, doing a simple sum of completed orders
    const orders = await Order.find({ isPaid: true });
    const totalOrderRevenue = orders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
      0,
    );
    const totalOrderCommission = orders.reduce(
      (sum, order) => sum + (order.commissionAmount || 0),
      0,
    );

    const bookings = await Booking.find({ paymentStatus: "Paid" });
    const totalBookingRevenue = bookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0,
    );
    const totalBookingCommission = bookings.reduce(
      (sum, b) => sum + (b.commissionAmount || 0),
      0,
    );

    const auctions = await AuctionLot.find({
      status: "sold",
      paymentStatus: "Paid",
    });
    const totalAuctionRevenue = auctions.reduce(
      (sum, a) => sum + (a.totalPaidByBuyer || 0),
      0,
    );
    const totalAuctionCommission = auctions.reduce(
      (sum, a) => sum + (a.commissionAmount || 0),
      0,
    );

    const totalRevenue =
      totalOrderRevenue + totalBookingRevenue + totalAuctionRevenue;
    const totalCommission =
      totalOrderCommission + totalBookingCommission + totalAuctionCommission;

    res.json({
      totalUsers,
      totalVendors,
      pendingVendors,
      totalRevenue,
      totalCommission,
      breakdown: {
        shop: { revenue: totalOrderRevenue, commission: totalOrderCommission },
        events: {
          revenue: totalBookingRevenue,
          commission: totalBookingCommission,
        },
        auctions: {
          revenue: totalAuctionRevenue,
          commission: totalAuctionCommission,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $nin: ["admin", "super_admin", ...STAFF_ROLES] } })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get seeded admin staff accounts
// @route   GET /api/admin/staff
// @access  Private/Super Admin
const getStaffAccounts = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: STAFF_ROLES } })
      .select("name email role staffKey mustChangePassword updatedAt")
      .sort({ role: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update a seeded staff member's login credentials
// @route   PUT /api/admin/staff/:id
// @access  Private/Super Admin
const updateStaffCredentials = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Staff account not found" });
    }
    const staff = await User.findById(req.params.id);
    if (!staff || !STAFF_ROLES.includes(staff.role)) {
      return res.status(404).json({ message: "Staff account not found" });
    }

    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (password && password.length < 10) {
      return res.status(400).json({ message: "New passwords must be at least 10 characters" });
    }

    const duplicate = await User.findOne({ email, _id: { $ne: staff._id } });
    if (duplicate) {
      return res.status(409).json({ message: "That email address is already in use" });
    }

    staff.name = name;
    staff.email = email;
    if (password) {
      staff.password = await bcrypt.hash(password, 12);
      staff.mustChangePassword = false;
    }

    await staff.save();
    res.json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      staffKey: staff.staffKey,
      mustChangePassword: staff.mustChangePassword,
      updatedAt: staff.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Create a new staff account
// @route   POST /api/admin/staff
// @access  Private/Super Admin
const createStaffAccount = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, role, and password are required" });
    }
    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid staff role" });
    }
    if (password.length < 10) {
      return res.status(400).json({ message: "Passwords must be at least 10 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "That email address is already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const staffKey = role + '_' + Date.now();

    const newStaff = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      staffKey,
      mustChangePassword: true
    });

    res.status(201).json({
      _id: newStaff._id,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      staffKey: newStaff.staffKey,
      mustChangePassword: newStaff.mustChangePassword,
      createdAt: newStaff.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private/Admin
const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get one vendor application
// @route   GET /api/admin/vendors/:id
// @access  Private/Admin
const getVendorById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const vendor = await Vendor.findById(req.params.id)
      .populate("userId", "name email role isEmailVerified createdAt")
      .lean();

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.json(vendor);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Vendor not found" });
    }
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update vendor status (Approve / Reject)
// @route   PUT /api/admin/vendors/:id/status
// @access  Private/Admin
const updateVendorStatus = async (req, res) => {
  try {
    const { status, reason, registrationFee } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (!["approved", "pending_approval", "rejected", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    vendor.status = status;
    if (registrationFee !== undefined) {
      vendor.registrationFee = registrationFee;
    }
    await vendor.save();

    // Update user role based on status
    const user = await User.findById(vendor.userId);
    if (user) {
      if (status === "approved") {
        user.role = "vendor_approved_unpaid";
      } else if (status === "rejected") {
        user.role = "vendor_rejected";
      } else if (status === "suspended") {
        user.role = "customer";
      }
      await user.save();
    }

    // Send email notification
    try {
      if (user) {
        if (status === "approved") {
          await sendEmail({
            to: user.email,
            subject: 'Your Vendor Account is Approved',
            html: vendorApprovalTemplate(user.name, vendor.registrationFee)
          });
        } else if (status === "rejected") {
          await sendEmail({
            to: user.email,
            subject: 'Update on your Vendor Application',
            html: genericNotificationTemplate(
              'Application Update',
              `Dear ${user.name}, your application to become a vendor has been reviewed. Unfortunately, we are unable to approve your application at this time. Reason: ${reason || 'Not specified'}.`
            )
          });
        }
      }
    } catch (err) {
      console.error('Failed to send vendor status email:', err);
    }

    res.json({ message: `Vendor marked as ${status}`, vendor });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get pending bank transfers
// @route   GET /api/admin/bank-transfers
// @access  Private/Admin
const getPendingBankTransfers = async (req, res) => {
  try {
    const [orders, eventBookings] = await Promise.all([
      Order.find({
        paymentMethod: "Bank Transfer",
        paymentStatus: { $ne: "Pending" },
      })
        .populate("user", "name email")
        .sort({ updatedAt: -1 })
        .lean(),
      Booking.find({
        paymentMethod: "Bank Transfer",
        bankTransferStatus: { $in: ["Awaiting_Approval", "Approved", "Rejected"] },
      })
        .populate("user", "name email")
        .populate("event", "title")
        .sort({ bookingDate: -1 })
        .lean(),
    ]);

    const shopRecords = orders.map((order) => {
      const isAuction = order.orderItems?.some((item) =>
        item.name?.toLowerCase().includes("auction lot") || item.category === "Auction"
      );
      return {
        ...order,
        recordType: isAuction ? "auction" : "shop",
        recordLabel: isAuction ? "Auction lot" : "Shop order",
        reviewStatus: order.paymentStatus,
      };
    });
    const eventRecords = eventBookings.map((booking) => ({
      ...booking,
      recordType: "event",
      recordLabel: "Event ticket",
      orderId: booking.gsReference || booking.ticketId,
      createdAt: booking.bookingDate,
      reviewStatus: booking.bankTransferStatus,
    }));

    res.json([...shopRecords, ...eventRecords].sort((a, b) => (
      new Date(b.updatedAt || b.proofSubmittedAt || b.createdAt) -
      new Date(a.updatedAt || a.proofSubmittedAt || a.createdAt)
    )));
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Send payment reminder to unpaid vendor
// @route   POST /api/admin/vendors/:id/remind-payment
// @access  Private/Super Admin
const remindVendorPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const vendor = await Vendor.findById(req.params.id).populate('userId', 'email name');
    
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.paymentStatus === 'paid') {
      return res.status(400).json({ message: "Vendor has already paid" });
    }

    vendor.paymentReminderSent = true;
    await vendor.save();

    // Send reminder email
    const fee = vendor.registrationFee || 2500;
    
    try {
      if (vendor.userId && vendor.userId.email) {
        await sendEmail({
          to: vendor.userId.email,
          subject: 'Action Required: Pay Registration Fee to Activate Store',
          html: generateEmailTemplate('Action Required: Store Activation Pending', `
            <h3>Action Required: Store Activation Pending</h3>
            <p>Hi ${vendor.userId.name || 'Vendor'},</p>
            <p>Your application to become a vendor on The Grand Store was approved!</p>
            <p>To activate your store and start listing products, you need to pay the registration fee of R${fee}.</p>
            <p>Please log in to your dashboard and complete the payment to activate your account.</p>
          `)
        });
      }
    } catch (emailErr) {
      console.error('Failed to send reminder email to vendor:', emailErr);
    }

    res.json({ message: "Payment reminder sent successfully", vendor });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update vendor payment status
// @route   PUT /api/admin/vendors/:id/payment-status
// @access  Private/Super Admin
const updateVendorPaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    vendor.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid') {
      if (!vendor.paidAt) {
        vendor.paidAt = new Date();
      }
      if (!vendor.maintenanceFee) {
        vendor.maintenanceFee = {};
      }
      vendor.maintenanceFee.status = 'paid';
      if (!vendor.maintenanceFee.lastPaidAt) {
        vendor.maintenanceFee.lastPaidAt = new Date();
      }
      if (!vendor.maintenanceFee.nextDueAt) {
        vendor.maintenanceFee.nextDueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      if (!Array.isArray(vendor.maintenanceFee.paymentHistory)) {
        vendor.maintenanceFee.paymentHistory = [];
      }
      const regFee = Number(vendor.registrationFee || 0);
      const regRef = `REG-EFT-${vendor._id}`;
      const gsRef = `GS-${new Date().getFullYear().toString().slice(-2)}-VND-REG-${vendor._id}-${Date.now().toString().slice(-6)}`;
      vendor.maintenanceFee.paymentHistory.unshift({
        amount: regFee,
        paidAt: new Date(),
        paymentMethod: 'Bank Transfer / EFT (Verified)',
        reference: regRef,
        gsReference: gsRef,
        status: 'cleared'
      });

      try {
        const Transaction = require('../models/Transaction');
        await Transaction.create({
          gsReference: gsRef,
          type: 'payment',
          module: 'vendor',
          amount: regFee,
          netAmount: regFee,
          currency: 'ZAR',
          customer: vendor.userId,
          vendor: vendor.userId,
          gateway: 'Bank Transfer / EFT',
          gatewayTransactionId: regRef,
          status: 'cleared',
          description: `Vendor Registration Fee (EFT Verified) - ${vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Vendor'}`
        });
      } catch (txnErr) {
        console.error('Failed to create Transaction for EFT verified vendor:', txnErr);
      }

      const user = await User.findById(vendor.userId);
      if (user) {
        user.role = 'vendor_active';
        await user.save();
      }
    }
    await vendor.save();
    res.json({ message: 'Payment status updated', vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update vendor maintenance fee schedule / next due date
// @route   PUT /api/admin/vendors/:id/maintenance-fee
// @access  Private/Super Admin
const updateVendorMaintenanceFee = async (req, res) => {
  try {
    const { nextDueAt, status, amount } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    if (!vendor.maintenanceFee) {
      vendor.maintenanceFee = {};
    }

    if (nextDueAt) {
      const parsedDate = new Date(nextDueAt);
      if (!isNaN(parsedDate.getTime())) {
        vendor.maintenanceFee.nextDueAt = parsedDate;
      }
    }
    if (status && ['paid', 'due', 'overdue', 'grace_period'].includes(status)) {
      vendor.maintenanceFee.status = status;
      if (status === 'paid' && !vendor.maintenanceFee.lastPaidAt) {
        vendor.maintenanceFee.lastPaidAt = new Date();
      }
    }
    if (amount !== undefined && !isNaN(Number(amount))) {
      vendor.maintenanceFee.amount = Number(amount);
    }

    await vendor.save();
    return res.json({ message: 'Maintenance fee schedule updated successfully', vendor });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all guest orders with uploaded 18+ verification documents
// @route   GET /api/admin/guest-verifications
// @access  Private (Admin / Staff)
const getGuestVerifications = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      isGuest: true,
      'guestKyc.documentUrl': { $exists: true, $ne: '' }
    };

    if (status && status !== 'all') {
      query['guestKyc.status'] = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .select('orderId invoiceNumber transactionId guestInfo guestKyc shippingAddress totalPrice paymentMethod paymentStatus isPaid createdAt shipments')
      .lean();

    res.json({
      count: orders.length,
      verifications: orders
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching guest verifications', error: error.message });
  }
};

// @desc    Verify and approve guest 18+ KYC document
// @route   PUT /api/admin/orders/:orderId/guest-kyc/verify
// @access  Private (Admin / Staff)
const verifyGuestKyc = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await findOrderByIdOrReference(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.guestKyc) {
      order.guestKyc = {};
    }

    order.guestKyc.status = 'verified';
    order.guestKyc.verifiedAt = new Date();
    order.guestKyc.reviewedBy = req.user ? req.user._id : null;
    order.guestKyc.rejectionReason = '';

    if (!order.ageVerification) {
      order.ageVerification = {};
    }
    order.ageVerification.isVerified = true;
    order.ageVerification.verifiedVia = 'guest_document';
    order.ageVerification.confirmedAt = new Date();

    await order.save();

    // Send confirmation email to guest
    const recipientEmail = order.guestInfo?.email || order.shippingAddress?.email;
    if (recipientEmail) {
      try {
        await sendEmail({
          to: recipientEmail,
          subject: `18+ Verification Approved - Order #${order.orderId || order.invoiceNumber}`,
          html: generateEmailTemplate('18+ Legal Age Verification Approved', `
            <h3>18+ Legal Age Verification Approved</h3>
            <p>Dear ${order.guestInfo?.name || 'Customer'},</p>
            <p>Your identification document for Order <strong>#${order.orderId || order.invoiceNumber}</strong> has been successfully verified and approved by Grand Store Administration.</p>
            <p>Your order will now proceed to dispatch. You will receive courier waybill tracking updates via email and SMS.</p>
          `)
        });
      } catch (emailErr) {
        console.warn('Failed to send guest verification approval email:', emailErr.message);
      }
    }

    res.json({ message: 'Guest 18+ verification approved successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server Error verifying guest document', error: error.message });
  }
};

// @desc    Reject guest 18+ KYC document with reason
// @route   PUT /api/admin/orders/:orderId/guest-kyc/reject
// @access  Private (Admin / Staff)
const rejectGuestKyc = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const order = await findOrderByIdOrReference(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.guestKyc) {
      order.guestKyc = {};
    }

    order.guestKyc.status = 'rejected';
    order.guestKyc.rejectionReason = reason || 'Identification document was unreadable or could not be verified.';
    order.guestKyc.reviewedBy = req.user ? req.user._id : null;

    if (!order.ageVerification) {
      order.ageVerification = {};
    }
    order.ageVerification.isVerified = false;

    await order.save();

    // Send notification email to guest
    const recipientEmail = order.guestInfo?.email || order.shippingAddress?.email;
    if (recipientEmail) {
      try {
        await sendEmail({
          to: recipientEmail,
          subject: `Action Required: 18+ Document Verification for Order #${order.orderId || order.invoiceNumber}`,
          html: generateEmailTemplate('Action Required: 18+ ID Document Verification', `
            <h3>Action Required: 18+ ID Document Verification</h3>
            <p>Dear ${order.guestInfo?.name || 'Customer'},</p>
            <p>Your identification document submitted for Order <strong>#${order.orderId || order.invoiceNumber}</strong> could not be verified.</p>
            <p><strong>Reason:</strong> ${order.guestKyc.rejectionReason}</p>
            <p>Please contact support at info@grandstoreglobal.com with a clear photo or scan of your official ID or passport so your parcel can be cleared for dispatch.</p>
          `)
        });
      } catch (emailErr) {
        console.warn('Failed to send guest verification rejection email:', emailErr.message);
      }
    }

    res.json({ message: 'Guest 18+ verification rejected', order });
  } catch (error) {
    res.status(500).json({ message: 'Server Error rejecting guest document', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllVendors,
  getVendorById,
  updateVendorStatus,
  updateVendorPaymentStatus,
  updateVendorMaintenanceFee,
  remindVendorPayment,
  getPendingBankTransfers,
  getStaffAccounts,
  updateStaffCredentials,
  createStaffAccount,
  getGuestVerifications,
  verifyGuestKyc,
  rejectGuestKyc,
};
