const Vendor = require('../models/Vendor');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');
const { createInAppNotification } = require('./notificationController');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.registerFullVendor = async (req, res) => {
  try {
    const { vendorType, accountInfo, businessInfo, kycInfo, taxInfo, licenceInfo, customsInfo, bankingInfo, productCategories, deliveryInfo, agreements, credentialsInfo, marketInfo, logisticsInfo, storyInfo } = req.body;

    let user;

    // Check if token is provided
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id);
      } catch (err) {
        // Token invalid or expired, continue as unauthenticated
      }
    }

    if (!user) {
      if (!accountInfo || !accountInfo.email) {
        return res.status(400).json({ message: 'Account information is required' });
      }

      const cleanEmail = String(accountInfo.email || '').trim().toLowerCase();
      user = await User.findOne({
        $or: [
          { email: cleanEmail },
          { email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      });

      if (!user) {
        if (!accountInfo.password) {
          return res.status(400).json({ message: 'Password is required for new accounts' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(accountInfo.password, salt);

        // Create new user if they don't exist
        user = await User.create({
          name: accountInfo.name,
          email: cleanEmail,
          password: hashedPassword,
          role: 'vendor_pending',
          isEmailVerified: true
        });
      } else {
        // If user exists, verify password before giving access to update their account
        if (!accountInfo.password) {
          return res.status(401).json({ message: 'Account exists. Please provide your password to proceed.' });
        }
        const isMatch = await bcrypt.compare(accountInfo.password, user.password);
        if (!isMatch) {
          return res.status(401).json({ message: 'Account already exists. Invalid password provided.' });
        }

        // If password matches, update their role
        user.role = 'vendor_pending';
        user.isEmailVerified = true;
        await user.save();
      }
    } else {
      // User was authenticated via token, just update their role
      user.role = 'vendor_pending';
      user.isEmailVerified = true;
      await user.save();
    }

    // Check if vendor application already exists for this user
    let vendor = await Vendor.findOne({ userId: user._id });
    if (vendor) {
      // Overwrite existing application
      vendor.vendorType = vendorType || 'local';
      vendor.businessInfo = businessInfo || {};
      vendor.bankingInfo = bankingInfo || {};
      vendor.productCategories = productCategories || [];
      vendor.agreements = { ...agreements, acceptedAt: Date.now() };
      
      if (vendorType === 'international') {
        vendor.credentialsInfo = credentialsInfo || {};
        vendor.marketInfo = marketInfo || {};
        vendor.logisticsInfo = logisticsInfo || {};
        vendor.storyInfo = storyInfo || {};
      } else {
        vendor.kycInfo = kycInfo || {};
        vendor.taxInfo = taxInfo || {};
        vendor.licenceInfo = licenceInfo || {};
        vendor.customsInfo = customsInfo || {};
        vendor.deliveryInfo = deliveryInfo || {};
      }
      
      vendor.status = 'pending_approval';
      vendor.onboardingStep = vendorType === 'international' ? 9 : 10;
      await vendor.save();
    } else {
      // Create new vendor application
      const vendorData = {
        userId: user._id,
        vendorType: vendorType || 'local',
        businessInfo: businessInfo || {},
        bankingInfo: bankingInfo || {},
        productCategories: productCategories || [],
        agreements: { ...agreements, acceptedAt: Date.now() },
        status: 'pending_approval',
        onboardingStep: vendorType === 'international' ? 9 : 10
      };
      
      if (vendorType === 'international') {
        vendorData.credentialsInfo = credentialsInfo || {};
        vendorData.marketInfo = marketInfo || {};
        vendorData.logisticsInfo = logisticsInfo || {};
        vendorData.storyInfo = storyInfo || {};
      } else {
        vendorData.kycInfo = kycInfo || {};
        vendorData.taxInfo = taxInfo || {};
        vendorData.licenceInfo = licenceInfo || {};
        vendorData.customsInfo = customsInfo || {};
        vendorData.deliveryInfo = deliveryInfo || {};
      }
      
      vendor = await Vendor.create(vendorData);
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getOnboardingProgress = async (req, res) => {
  try {
    let vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      // Create initial draft if not exists
      vendor = await Vendor.create({ userId: req.user._id, status: 'draft' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.saveOnboardingProgress = async (req, res) => {
  try {
    const { step, data } = req.body;
    let vendor = await Vendor.findOne({ userId: req.user._id });
    
    if (!vendor) {
      vendor = new Vendor({ userId: req.user._id });
    }

    // Determine which nested object to update based on the step
    switch (step) {
      case 2:
        vendor.businessInfo = { ...vendor.businessInfo, ...data };
        break;
      case 3:
        vendor.kycInfo = { ...vendor.kycInfo, ...data };
        break;
      case 4:
        vendor.taxInfo = { ...vendor.taxInfo, ...data };
        break;
      case 5:
        vendor.licenceInfo = { ...vendor.licenceInfo, ...data };
        break;
      case 6:
        vendor.customsInfo = { ...vendor.customsInfo, ...data };
        break;
      case 7:
        vendor.bankingInfo = { ...vendor.bankingInfo, ...data };
        break;
      case 8:
        vendor.productCategories = data.categories || [];
        break;
      case 9:
        vendor.deliveryInfo = { ...vendor.deliveryInfo, ...data };
        break;
      case 10:
        vendor.agreements = { ...vendor.agreements, ...data, acceptedAt: Date.now() };
        break;
    }

    vendor.onboardingStep = Math.max(vendor.onboardingStep, step + 1);
    await vendor.save();
    
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Include file metadata so the onboarding UI can identify and label the
    // selected document without relying only on the generated Cloudinary URL.
    res.json({
      url: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.submitApplication = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor application not found' });
    }

    if (vendor.status === 'approved') {
      return res.status(400).json({ message: 'Vendor is already approved' });
    }

    vendor.status = 'pending_approval';
    await vendor.save();

    // Update the user's role to indicate they are pending
    await User.findByIdAndUpdate(req.user._id, { role: 'vendor_pending' });

    res.json({ message: 'Application submitted successfully', vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role !== 'vendor_approved_unpaid') {
      return res.status(400).json({ message: 'User is not in the correct state to apply a coupon' });
    }

    const VendorCoupon = require('../models/VendorCoupon');
    const coupon = await VendorCoupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!coupon) {
      return res.status(400).json({ message: 'Invalid or inactive coupon code' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    // Update Vendor
    const vendor = await Vendor.findOne({ userId: user._id });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });

    const freeMonths = coupon.freeMonths || 1;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + freeMonths);

    vendor.couponUsed = coupon.code;
    vendor.couponRedeemedAt = new Date();
    vendor.freeTrialExpiry = expiryDate;
    vendor.trialStatus = 'active';
    vendor.paymentStatus = 'paid'; // Treat as paid while trial is active
    await vendor.save();

    // Update User Role
    user.role = 'vendor_active';
    await user.save();

    // Increment coupon usage
    coupon.usedCount += 1;
    await coupon.save();

    res.json({ message: 'Coupon applied successfully. Trial is now active.', freeTrialExpiry: expiryDate });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.processVendorPayment = async (vendorId) => {
  try {
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      console.error(`Vendor not found for payment processing: ${vendorId}`);
      return;
    }

    vendor.paymentStatus = 'paid';
    vendor.paidAt = new Date();

    // Initialize Monthly Maintenance Fee
    let monthlyFee = 500;
    try {
      const settings = await PlatformSettings.findOne();
      if (settings && settings.vendorMonthlyMaintenanceFee) {
        monthlyFee = settings.vendorMonthlyMaintenanceFee;
      }
    } catch (e) {
      console.error('Failed to read settings for maintenance fee:', e);
    }

    const regFee = Number(vendor.registrationFee || 0);
    const regRef = `REG-${vendor._id}`;
    const gsRef = `GS-${new Date().getFullYear().toString().slice(-2)}-VND-REG-${vendor._id}-${Date.now().toString().slice(-6)}`;

    vendor.maintenanceFee = {
      amount: monthlyFee,
      status: 'paid',
      lastPaidAt: new Date(),
      nextDueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentHistory: [{
        amount: regFee,
        paidAt: new Date(),
        paymentMethod: 'PayFast',
        reference: regRef,
        gsReference: gsRef,
        status: 'cleared'
      }]
    };

    await vendor.save();

    const user = await User.findById(vendor.userId);
    if (user && user.role === 'vendor_approved_unpaid') {
      user.role = 'vendor_active';
      await user.save();
    }
    
    // Create Transaction record
    const Transaction = require('../models/Transaction');
    if (Transaction) {
      try {
        await Transaction.create({
          gsReference: gsRef,
          type: 'payment',
          module: 'vendor',
          amount: regFee,
          netAmount: regFee,
          currency: 'ZAR',
          customer: vendor.userId,
          vendor: vendor.userId,
          gateway: 'PayFast',
          gatewayTransactionId: regRef,
          status: 'cleared',
          description: `Vendor Registration Fee - ${vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Vendor'}`
        });
      } catch (txnErr) {
        console.error('Failed to create Transaction record for vendor registration payment:', txnErr);
      }
    }

    // In-app notification for vendor
    await createInAppNotification({
      recipient: vendor.userId,
      recipientType: 'vendor',
      title: 'Vendor Account Activated',
      message: `Registration fee received! Your vendor privileges and storefront are now active. Your first monthly maintenance fee of R ${monthlyFee} will be due in 30 days.`,
      type: 'maintenance_fee',
      link: '/vendor/dashboard'
    });

    // In-app notification for admin
    await createInAppNotification({
      recipient: null,
      recipientType: 'admin',
      title: 'Vendor Registration Fee Received',
      message: `${vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Vendor'} paid R ${regFee} registration fee. Account is now active.`,
      type: 'maintenance_fee',
      link: `/admin/vendors/${vendor._id}`
    });

  } catch (error) {
    console.error('Error processing vendor payment:', error);
  }
};

exports.getStoreProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor application not found' });
    }
    res.json({
      businessName: vendor.businessInfo?.legalName || '',
      logoUrl: vendor.businessInfo?.logoUrl || '',
      bannerUrl: vendor.businessInfo?.bannerUrl || '',
      story: vendor.businessInfo?.story || '',
      vendorId: vendor.userId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateStoreProfile = async (req, res) => {
  try {
    const { businessName, logoUrl, bannerUrl, story } = req.body;
    let vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor application not found' });
    }

    if (!vendor.businessInfo) vendor.businessInfo = {};
    if (businessName !== undefined) vendor.businessInfo.legalName = businessName;
    if (logoUrl !== undefined) vendor.businessInfo.logoUrl = logoUrl;
    if (bannerUrl !== undefined) vendor.businessInfo.bannerUrl = bannerUrl;
    if (story !== undefined) vendor.businessInfo.story = story;

    await vendor.save();
    res.json({ message: 'Store profile updated successfully', businessInfo: vendor.businessInfo });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.submitProof = async (req, res) => {
  try {
    const { proofUrl } = req.body;
    if (!proofUrl) {
      return res.status(400).json({ message: 'No proof URL provided' });
    }
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor application not found' });
    }
    vendor.proofOfPaymentUrl = proofUrl;
    vendor.paymentStatus = 'awaiting_verification';
    await vendor.save();
    res.json({ message: 'Proof submitted successfully', vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMaintenanceFeeStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor application not found' });
    }

    let defaultMonthlyFee = 500;
    let graceDays = 7;
    try {
      const settings = await PlatformSettings.findOne();
      if (settings) {
        if (settings.vendorMonthlyMaintenanceFee !== undefined) defaultMonthlyFee = settings.vendorMonthlyMaintenanceFee;
        if (settings.vendorMaintenanceGraceDays !== undefined) graceDays = settings.vendorMaintenanceGraceDays;
      }
    } catch (e) {
      console.error("Error reading platform settings for maintenance fee", e);
    }

    // If maintenanceFee subdocument is not yet initialized, initialize with defaults
    if (!vendor.maintenanceFee || !vendor.maintenanceFee.nextDueAt) {
      vendor.maintenanceFee = {
        amount: defaultMonthlyFee,
        status: 'paid',
        lastPaidAt: vendor.createdAt || new Date(),
        nextDueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentHistory: []
      };
      await vendor.save();
    }

    const now = new Date();
    const nextDue = new Date(vendor.maintenanceFee.nextDueAt);
    const msDiff = nextDue.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    // Evaluate live status (preserve awaiting_verification if manual EFT proof submitted)
    let currentStatus = vendor.maintenanceFee.status === 'awaiting_verification' ? 'awaiting_verification' : 'paid';
    if (currentStatus !== 'awaiting_verification') {
      if (daysRemaining <= 0) {
        if (Math.abs(daysRemaining) <= graceDays) {
          currentStatus = 'due';
        } else {
          currentStatus = 'overdue';
        }
      } else if (daysRemaining <= 5) {
        currentStatus = 'due';
      } else {
        currentStatus = 'paid';
      }
    }

    if (vendor.maintenanceFee.status !== currentStatus) {
      vendor.maintenanceFee.status = currentStatus;
      await vendor.save();
    }

    let bankDetails = {
      bankName: 'First National Bank (FNB)',
      accountName: 'The Grand Store (Pty) Ltd',
      accountNumber: '62800000000',
      branchCode: '250655',
      accountType: 'Business Cheque Account',
      swiftCode: 'FIRNZAJJ'
    };
    try {
      const PlatformSettings = require('../models/PlatformSettings');
      const settings = await PlatformSettings.findOne();
      if (settings?.bankDetails?.accountNumber) {
        bankDetails = {
          bankName: settings.bankDetails.bankName || 'Standard Bank',
          accountName: settings.bankDetails.accountName || 'The Grand Store PTY LTD',
          accountNumber: settings.bankDetails.accountNumber || '0123456789',
          branchCode: settings.bankDetails.branchCode || '051001',
          accountType: settings.bankDetails.accountType || 'Business Cheque',
          swiftCode: settings.bankDetails.swiftCode || 'SBZAJJ'
        };
      }
    } catch (bErr) {
      console.error('Error fetching platform bank details for vendor fee:', bErr);
    }

    res.json({
      vendorId: vendor._id,
      reference: `MNF-${vendor._id.toString().slice(-6).toUpperCase()}`,
      amount: vendor.maintenanceFee.amount || defaultMonthlyFee,
      configuredMonthlyFee: defaultMonthlyFee,
      status: currentStatus,
      proofOfPaymentUrl: vendor.maintenanceFee.proofOfPaymentUrl || null,
      lastPaidAt: vendor.maintenanceFee.lastPaidAt,
      nextDueAt: vendor.maintenanceFee.nextDueAt,
      daysRemaining,
      graceDays,
      bankDetails,
      paymentHistory: vendor.maintenanceFee.paymentHistory || []
    });
  } catch (error) {
    console.error('Error fetching maintenance fee status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const processMaintenanceFeePayment = async (vendorId, { paymentMethod = 'PayFast / Card', reference = null, amount = null } = {}) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new Error('Vendor not found');

  let defaultMonthlyFee = 500;
  try {
    const PlatformSettings = require('../models/PlatformSettings');
    const settings = await PlatformSettings.findOne();
    if (settings && settings.vendorMonthlyMaintenanceFee !== undefined) {
      defaultMonthlyFee = settings.vendorMonthlyMaintenanceFee;
    }
  } catch (e) {
    console.error("Error reading platform settings", e);
  }

  const feeAmount = amount || vendor.maintenanceFee?.amount || defaultMonthlyFee;
  const payRef = reference || `MNF-${vendor._id}-${Date.now().toString().slice(-6)}`;
  const gsRef = `GS-${new Date().getFullYear().toString().slice(-2)}-VND-MNF-${Date.now()}`;

  // Advance nextDueAt by 30 days
  const currentDue = (vendor.maintenanceFee?.nextDueAt && new Date(vendor.maintenanceFee.nextDueAt) > new Date())
    ? new Date(vendor.maintenanceFee.nextDueAt)
    : new Date();
  const newNextDue = new Date(currentDue.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (!vendor.maintenanceFee) vendor.maintenanceFee = {};
  vendor.maintenanceFee.amount = feeAmount;
  vendor.maintenanceFee.status = 'paid';
  vendor.maintenanceFee.lastPaidAt = new Date();
  vendor.maintenanceFee.nextDueAt = newNextDue;
  vendor.paymentStatus = 'paid';
  if (!vendor.paidAt) {
    vendor.paidAt = new Date();
  }

  if (!Array.isArray(vendor.maintenanceFee.paymentHistory)) {
    vendor.maintenanceFee.paymentHistory = [];
  }

  vendor.maintenanceFee.paymentHistory.unshift({
    amount: feeAmount,
    paidAt: new Date(),
    paymentMethod,
    reference: payRef,
    gsReference: gsRef,
    status: 'cleared'
  });

  await vendor.save();

  // Create Transaction Record
  try {
    const Transaction = require('../models/Transaction');
    await Transaction.create({
      gsReference: gsRef,
      type: 'payment',
      module: 'vendor',
      amount: Number(feeAmount),
      netAmount: Number(feeAmount),
      currency: 'ZAR',
      customer: vendor.userId,
      vendor: vendor.userId,
      gateway: paymentMethod,
      gatewayTransactionId: payRef,
      status: 'cleared',
      description: `Monthly Maintenance Fee - ${vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Vendor'}`
    });
  } catch (txnErr) {
    console.error('Failed to create Transaction record for maintenance fee:', txnErr);
  }

  // Ensure user has vendor_active role if approved
  const User = require('../models/User');
  const user = await User.findById(vendor.userId);
  if (user && (user.role === 'vendor_approved_unpaid' || user.role === 'vendor_suspended')) {
    user.role = 'vendor_active';
    await user.save();
  }

  // In-app notification for vendor
  await createInAppNotification({
    recipient: vendor.userId,
    recipientType: 'vendor',
    title: 'Monthly Maintenance Fee Paid',
    message: `Your monthly maintenance fee of R ${feeAmount} has been processed successfully. Store privileges are active through ${newNextDue.toLocaleDateString()}.`,
    type: 'maintenance_fee',
    link: '/vendor/dashboard'
  });

  // In-app notification for admin
  await createInAppNotification({
    recipient: null,
    recipientType: 'admin',
    title: 'Vendor Maintenance Fee Received',
    message: `${vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Vendor'} paid R ${feeAmount} maintenance renewal (${payRef}).`,
    type: 'maintenance_fee',
    link: `/admin/vendors/${vendor._id}`
  });

  // Automated email receipt to vendor (with BCC to admin if configured)
  try {
    const { sendEmail } = require('../utils/emailService');
    const { vendorMaintenanceFeePaidTemplate } = require('../utils/emailTemplates');
    if (user && user.email) {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      await sendEmail({
        to: user.email,
        bcc: adminEmail && adminEmail !== user.email ? adminEmail : undefined,
        subject: `Monthly Maintenance Fee Receipt - R ${Number(feeAmount).toFixed(2)} (${payRef})`,
        html: vendorMaintenanceFeePaidTemplate({
          vendorName: user.name || 'Vendor Partner',
          businessName: vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName,
          amount: feeAmount,
          paymentMethod,
          reference: payRef,
          paidAt: new Date(),
          nextDueAt: newNextDue
        })
      });
      console.log(`Automated maintenance fee receipt email sent to ${user.email} (${payRef})`);
    }
  } catch (emailErr) {
    console.error('Failed to send vendor maintenance fee automated email:', emailErr);
  }

  return vendor;
};

exports.processMaintenanceFeePayment = processMaintenanceFeePayment;

exports.payMaintenanceFee = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor application not found' });
    }

    const paymentMethod = req.body.paymentMethod || 'PayFast / Card';
    const reference = req.body.reference || `MNF-${vendor._id}-${Date.now().toString().slice(-6)}`;

    const updatedVendor = await processMaintenanceFeePayment(vendor._id, {
      paymentMethod,
      reference
    });

    res.json({
      message: 'Monthly maintenance fee paid successfully',
      maintenanceFee: updatedVendor.maintenanceFee
    });
  } catch (error) {
    console.error('Error paying maintenance fee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.submitMaintenanceFeeProof = async (req, res) => {
  try {
    const { proofUrl, reference, amount } = req.body;
    if (!proofUrl) {
      return res.status(400).json({ message: 'No proof of payment document provided' });
    }
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor application not found' });
    }

    const payRef = reference || `EFT-MNF-${vendor._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    if (!vendor.maintenanceFee) vendor.maintenanceFee = {};
    vendor.maintenanceFee.proofOfPaymentUrl = proofUrl;
    vendor.maintenanceFee.status = 'awaiting_verification';

    if (!Array.isArray(vendor.maintenanceFee.paymentHistory)) {
      vendor.maintenanceFee.paymentHistory = [];
    }

    vendor.maintenanceFee.paymentHistory.unshift({
      amount: amount || vendor.maintenanceFee.amount || 500,
      paidAt: new Date(),
      paymentMethod: 'Manual EFT / Bank Transfer',
      reference: payRef,
      status: 'pending_verification',
      proofUrl
    });

    await vendor.save();

    await createInAppNotification({
      recipient: null,
      recipientType: 'admin',
      title: 'Vendor Maintenance Fee EFT Submitted',
      message: `${vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Vendor'} submitted EFT proof of payment (${payRef}) for monthly maintenance fee.`,
      type: 'maintenance_fee',
      link: `/admin/vendors/${vendor._id}`
    });

    await createInAppNotification({
      recipient: vendor.userId,
      recipientType: 'vendor',
      title: 'EFT Proof of Payment Received',
      message: `Your proof of payment (${payRef}) for the monthly maintenance fee has been submitted and is awaiting admin verification.`,
      type: 'maintenance_fee',
      link: '/vendor/dashboard'
    });

    res.json({
      message: 'Proof of payment submitted successfully. Your payment is awaiting admin verification.',
      vendor
    });
  } catch (error) {
    console.error('Error submitting maintenance fee proof:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get Vendor Banking Information
// @route   GET /api/vendor/banking
// @access  Private/Vendor
exports.getVendorBanking = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const Wallet = require('../models/Wallet');
    const wallet = await Wallet.findOne({ vendorId: req.user._id });

    // Fall back to wallet payoutDetails if vendor.bankingInfo has missing values
    const bankingInfo = vendor.bankingInfo || wallet?.payoutDetails || {
      bankName: '',
      accountName: '',
      accountNumber: '',
      branchCode: '',
      accountType: 'Cheque / Current',
      swiftCode: '',
      bankConfirmationUrl: '',
      payoutPreference: 'Monthly',
      isVerified: false
    };

    res.json({
      bankingInfo: {
        bankName: bankingInfo.bankName || '',
        accountName: bankingInfo.accountName || vendor.businessInfo?.legalName || vendor.businessInfo?.tradingName || req.user.name || '',
        accountNumber: bankingInfo.accountNumber || '',
        branchCode: bankingInfo.branchCode || '',
        accountType: bankingInfo.accountType || 'Cheque / Current',
        swiftCode: bankingInfo.swiftCode || '',
        bankConfirmationUrl: bankingInfo.bankConfirmationUrl || '',
        payoutPreference: bankingInfo.payoutPreference || 'Monthly',
        isVerified: Boolean(bankingInfo.isVerified),
        verifiedAt: bankingInfo.verifiedAt || null,
        updatedAt: bankingInfo.updatedAt || vendor.updatedAt || null
      },
      businessName: vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || ''
    });
  } catch (error) {
    console.error('Get Vendor Banking Error:', error);
    res.status(500).json({ message: 'Server error fetching bank details', error: error.message });
  }
};

// @desc    Update Vendor Banking Information
// @route   PUT /api/vendor/banking
// @access  Private/Vendor
exports.updateVendorBanking = async (req, res) => {
  try {
    const { bankName, accountName, accountNumber, branchCode, accountType, swiftCode, bankConfirmationUrl, payoutPreference } = req.body;

    if (!bankName || !accountName || !accountNumber || !branchCode) {
      return res.status(400).json({ message: 'Bank Name, Account Holder Name, Account Number, and Branch Code are required.' });
    }

    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const cleanBank = {
      bankName: String(bankName).trim(),
      accountName: String(accountName).trim(),
      accountNumber: String(accountNumber).trim(),
      branchCode: String(branchCode).trim(),
      accountType: accountType ? String(accountType).trim() : 'Cheque / Current',
      swiftCode: swiftCode ? String(swiftCode).trim() : '',
      bankConfirmationUrl: bankConfirmationUrl ? String(bankConfirmationUrl).trim() : (vendor.bankingInfo?.bankConfirmationUrl || ''),
      payoutPreference: ['Weekly', 'Fortnightly', 'Monthly'].includes(payoutPreference) ? payoutPreference : (vendor.bankingInfo?.payoutPreference || 'Monthly'),
      isVerified: vendor.bankingInfo?.isVerified ?? false,
      updatedAt: new Date()
    };

    vendor.bankingInfo = {
      ...vendor.bankingInfo,
      ...cleanBank
    };
    await vendor.save();

    // Synchronize to Wallet
    const Wallet = require('../models/Wallet');
    await Wallet.findOneAndUpdate(
      { vendorId: req.user._id },
      {
        $set: {
          'payoutDetails.bankName': cleanBank.bankName,
          'payoutDetails.accountName': cleanBank.accountName,
          'payoutDetails.accountNumber': cleanBank.accountNumber,
          'payoutDetails.branchCode': cleanBank.branchCode,
          'payoutDetails.accountType': cleanBank.accountType,
          'payoutDetails.swiftCode': cleanBank.swiftCode,
          'payoutDetails.bankConfirmationUrl': cleanBank.bankConfirmationUrl,
          'payoutDetails.updatedAt': new Date()
        }
      },
      { upsert: true, new: true }
    );

    // Synchronize to User account
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'bankAccountDetails.bankName': cleanBank.bankName,
        'bankAccountDetails.accountHolder': cleanBank.accountName,
        'bankAccountDetails.accountNumber': cleanBank.accountNumber,
        'bankAccountDetails.branchCode': cleanBank.branchCode,
        'bankAccountDetails.updatedAt': new Date()
      }
    });

    // Notify Admin of banking update
    try {
      await createInAppNotification({
        recipient: null,
        recipientType: 'admin',
        title: 'Vendor Bank Details Updated',
        message: `${vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || req.user.name} updated settlement banking details (${cleanBank.bankName} - ***${cleanBank.accountNumber.slice(-4)}).`,
        type: 'vendor_banking',
        link: `/admin/vendors/${vendor._id}`
      });
    } catch (notifErr) {
      console.warn('Failed to send admin notification for bank update:', notifErr.message);
    }

    res.json({
      message: 'Bank details saved successfully',
      bankingInfo: vendor.bankingInfo
    });
  } catch (error) {
    console.error('Update Vendor Banking Error:', error);
    res.status(500).json({ message: 'Failed to update bank details', error: error.message });
  }
};


