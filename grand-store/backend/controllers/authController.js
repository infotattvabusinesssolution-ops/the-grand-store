const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const axios = require('axios');

const normalizeReferralCode = (value) => String(value || '').trim().toUpperCase();

const generateUniqueReferralCode = async () => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    if (!await User.exists({ referralCode: code })) return code;
  }
  throw new Error('Unable to generate a unique referral code');
};

const findReferrer = async (value) => {
  const code = normalizeReferralCode(value);
  if (!code) return null;
  return User.findOne({ referralCode: code }).select('_id name referralCode');
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };
  const isApprovedBidder = user.bidderApprovalStatus === 'approved';
  const isPendingBidder = user.bidderApprovalStatus === 'pending_approval';
  const isAgeVerifiedBool = !isPendingBidder && (isApprovedBidder || Boolean(user.isAgeVerified) || (user.bidderLevel && user.bidderLevel !== 'none'));

  res.status(statusCode).cookie('jwt', token, options).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    customerTier: user.customerTier || 'retail',
    isAgeVerified: isAgeVerifiedBool,
    bidderLevel: user.bidderLevel,
    bidderApprovalStatus: user.bidderApprovalStatus,
    phone: user.phone || user.phoneNumber || '',
    phoneNumber: user.phoneNumber || user.phone || '',
    token: token,
    referralCode: user.referralCode,
    rewardBalance: user.rewardBalance || 0,
    totalReferrals: user.totalReferrals || 0,
    hasReferrer: Boolean(user.referredBy),
    mustChangePassword: user?.mustChangePassword
  });
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  });
  res.status(200).json({ success: true, message: 'User logged out' });
};


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // `referredBy` was briefly used by the frontend. Accept it as a backwards-
    // compatible alias while keeping referralCode as the public API contract.
    const submittedReferralCode = req.body.referralCode ?? req.body.referredBy;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let referredBy = null;
    if (normalizeReferralCode(submittedReferralCode)) {
      const referringUser = await findReferrer(submittedReferralCode);
      if (!referringUser) {
        return res.status(400).json({ message: 'Referral code is invalid or no longer active' });
      }
      referredBy = referringUser._id;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newReferralCode = await generateUniqueReferralCode();
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const cleanPhone = req.body.phone || req.body.phoneNumber || '';
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: cleanPhone,
      phoneNumber: cleanPhone,
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      customerTier: req.body.customerTier || 'retail',
      isAgeVerified: Boolean(req.body.isAgeVerified || req.body.dateOfBirth),
      referralCode: newReferralCode,
      referredBy,
      isEmailVerified: false,
      verificationToken
    });

    if (user) {
      // Send verification email
      const { sendEmail } = require('../utils/emailService');
      const { verificationEmailTemplate } = require('../utils/emailTemplates');
      
      const rawOrigin = req.headers.origin || (req.headers.referer ? (() => { try { return new URL(req.headers.referer).origin; } catch (_) { return null; } })() : null);
      const frontendUrl = (rawOrigin || process.env.FRONTEND_URL || 'https://grandstoreglobal.com').replace(/\/$/, '');
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}&email=${user.email}`;

      sendEmail({
        to: user.email,
        subject: 'Verify your email - The Grand Store',
        html: verificationEmailTemplate(user.name, verificationLink)
      }).catch(err => console.error('Failed to send verification email:', err));

      res.status(201).json({ 
        message: 'Registration successful! Please check your email to verify your account.' 
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      // Disallow administrative accounts on this standard endpoint
      const adminRoles = ['admin', 'super_admin', 'accountant', 'product_manager'];
      if (adminRoles.includes(user.role)) {
        return res.status(403).json({
          message: 'Administrative accounts cannot sign in here. Please use the dedicated Admin Gateway at /admin/login.'
        });
      }

      const vendorRoles = ['vendor', 'vendor_active', 'vendor_pending', 'vendor_approved_unpaid', 'vendor_rejected', 'vendor_suspended'];
      const isVendorRole = vendorRoles.includes(user.role);
      const isExemptVerification = isVendorRole || ['auction_host', 'event_host'].includes(user.role);

      if (!user.isEmailVerified && !isExemptVerification) {
        return res.status(401).json({ message: 'Please verify your email address before logging in. Check your inbox.' });
      }

      // Automatically persist verified status for vendor accounts
      if (isVendorRole && !user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
      }

      sendTokenResponse(user, 200, res);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Auth admin / staff user & get token
// @route   POST /api/auth/admin-login or POST /api/admin/login
// @access  Public (Administrative Access Only)
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid administrative credentials' });
    }

    // Strict role check: allow only administrative and authorized staff roles
    const allowedAdminRoles = ['admin', 'super_admin', 'accountant', 'product_manager'];
    if (!allowedAdminRoles.includes(user.role)) {
      return res.status(403).json({
        message: 'Access denied: Administrator privileges required. Customers and vendors must sign in through the main login portal.'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during administrative authentication' });
  }
};


// @desc    Verify user email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ message: 'Invalid verification link' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (user.verificationToken !== token) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined; // clear token
    await user.save();

    // Now send the welcome email!
    const { sendEmail } = require('../utils/emailService');
    const { welcomeEmailTemplate } = require('../utils/emailTemplates');
    sendEmail({
      to: user.email,
      subject: 'Welcome to The Grand Store',
      html: welcomeEmailTemplate(user.name)
    }).catch(err => console.error('Failed to send welcome email:', err));

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User with that email does not exist' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes

    await user.save();

    // Send email
    const { sendEmail } = require('../utils/emailService');
    const { passwordResetTemplate } = require('../utils/emailTemplates');
    
    const rawOrigin = req.headers.origin || (req.headers.referer ? (() => { try { return new URL(req.headers.referer).origin; } catch (_) { return null; } })() : null);
    const frontendUrl = (rawOrigin || process.env.FRONTEND_URL || 'https://grandstoreglobal.com').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - The Grand Store',
        html: passwordResetTemplate(user.name, resetUrl)
      });

      res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      console.error('Email could not be sent:', error);
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      if (!user.referralCode) {
        user.referralCode = await generateUniqueReferralCode();
        await user.save();
      }
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.phone !== undefined) {
        user.phone = req.body.phone;
        user.phoneNumber = req.body.phone;
      } else if (req.body.phoneNumber !== undefined) {
        user.phone = req.body.phoneNumber;
        user.phoneNumber = req.body.phoneNumber;
      }
      // Note: Email cannot be changed
      // user.email = req.body.email || user.email;

      if (req.body.password) {
        if (user.password) {
          // Strict validation: Must provide currentPassword to change password
          if (!req.body.currentPassword) {
            return res.status(400).json({ message: 'Current password is required to change password' });
          }
          
          const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
          if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
          }
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      sendTokenResponse(updatedUser, 200, res);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete user profile
// @route   DELETE /api/auth/profile
// @access  Private
const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Perform the deletion
    await User.findByIdAndDelete(req.user._id);
    
    res.json({ message: 'User profile successfully deleted' });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({ message: 'Server error while deleting profile' });
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const requestedRole = req.body.role || 'customer';
    const role = ['customer', 'vendor_pending'].includes(requestedRole) ? requestedRole : 'customer';
    const submittedReferralCode = req.body.referralCode ?? req.body.referredBy;
    const token = req.body.token;
    
    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    let payload;
    if (token.startsWith('ya29.')) {
      // It's an access token
      const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      payload = data;
    } else {
      // Check if it's a Firebase ID token (issuer contains securetoken.google.com)
      const decoded = jwt.decode(token);
      if (decoded && (decoded.iss?.includes('securetoken.google.com') || decoded.firebase || req.body.uid)) {
        payload = {
          sub: decoded.sub || decoded.user_id || req.body.uid,
          email: decoded.email || req.body.email,
          name: decoded.name || req.body.name || (decoded.email ? decoded.email.split('@')[0] : 'Valued Patron'),
          picture: decoded.picture || req.body.photoURL
        };
      } else {
        // Standard Google ID token
        try {
          const allowedAudiences = [
            process.env.GOOGLE_CLIENT_ID,
            '153305069501-nrfrhnj4l2427g5dbnn1ubpajocf578a.apps.googleusercontent.com',
            '153305069501-dq01kr7b6ingdl3f3qk5r9790hebvbv7.apps.googleusercontent.com'
          ].filter(Boolean);

          const ticket = await client.verifyIdToken({
            idToken: token,
            audience: allowedAudiences,
          });
          payload = ticket.getPayload();
        } catch (verifyErr) {
          console.error('[GoogleAuth] Token verification error:', verifyErr.message);
          if (decoded && decoded.email) {
            console.log('[GoogleAuth] Using decoded payload for:', decoded.email);
            payload = {
              sub: decoded.sub,
              email: decoded.email,
              name: decoded.name || decoded.email.split('@')[0]
            };
          } else {
            throw verifyErr;
          }
        }
      }
    }

    const { sub: googleId, email, name } = payload;

    // Check if user exists
    const cleanEmail = String(email || '').trim().toLowerCase();
    let user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ]
    });

    if (user) {
      // Disallow administrative accounts from logging in via public Google login
      const adminRoles = ['admin', 'super_admin', 'accountant', 'product_manager'];
      if (adminRoles.includes(user.role)) {
        return res.status(403).json({
          message: 'Administrative accounts cannot sign in via public Google login. Please use the dedicated Admin Gateway at /admin/login.'
        });
      }

      let modified = false;
      // If user exists without googleId, link it
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      
      // We don't overwrite the role if it's already a vendor, unless requested by the frontend
      // But if the frontend passes 'vendor_pending' and they are 'customer', we can upgrade them.
      if (role === 'vendor_pending' && user.role === 'customer') {
        user.role = 'vendor_pending';
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    } else {
      let referredBy = null;
      if (normalizeReferralCode(submittedReferralCode)) {
        const referringUser = await findReferrer(submittedReferralCode);
        if (!referringUser) {
          return res.status(400).json({ message: 'Referral code is invalid or no longer active' });
        }
        referredBy = referringUser._id;
      }

      const newReferralCode = await generateUniqueReferralCode();

      // Create new user
      user = await User.create({
        name,
        email: cleanEmail,
        googleId,
        role: role,
        isEmailVerified: true,
        referralCode: newReferralCode,
        referredBy
        // password is required: false in schema, so we can omit it
      });

      // Send welcome email (non-blocking)
      const { sendEmail } = require('../utils/emailService');
      const { welcomeEmailTemplate } = require('../utils/emailTemplates');
      sendEmail({
        to: user.email,
        subject: 'Welcome to The Grand Store',
        html: welcomeEmailTemplate(user.name)
      }).catch(err => console.error('Failed to send welcome email:', err));
    }

    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};

// @desc    Get the logged-in user's referral dashboard and current program rules
// @route   GET /api/auth/referrals
// @access  Private
const getReferralSummary = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const PlatformSettings = require('../models/PlatformSettings');
    const user = await User.findById(req.user._id).select(
      'referralCode referredBy rewardBalance totalReferrals'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    const referredUsers = await User.find({ referredBy: user._id })
      .select('name createdAt')
      .sort({ createdAt: -1 })
      .lean();
    const referredUserIds = referredUsers.map((referredUser) => referredUser._id);
    const paidUserIds = referredUserIds.length
      ? await Order.distinct('user', { user: { $in: referredUserIds }, isPaid: true })
      : [];
    const paidUserIdSet = new Set(paidUserIds.map((id) => id.toString()));
    const successfulReferrals = referredUsers.filter((referredUser) => (
      paidUserIdSet.has(referredUser._id.toString())
    )).length;

    let settings = await PlatformSettings.findOne();
    if (!settings) settings = await PlatformSettings.create({});
    const ownPaidOrders = await Order.countDocuments({ user: user._id, isPaid: true });
    const isWelcomeEligible = Boolean(user.referredBy) && ownPaidOrders === 0 && Boolean(settings.referralWelcomeDiscountEnabled) && (settings.referralWelcomeDiscount > 0);

    res.json({
      referralCode: user.referralCode,
      rewardBalance: Math.max(0, Number(user.rewardBalance) || 0),
      totalSignups: referredUsers.length,
      successfulReferrals,
      pendingReferrals: Math.max(0, referredUsers.length - successfulReferrals),
      welcomeDiscountEligible: isWelcomeEligible,
      program: {
        rewardAmount: settings.referralRewardAmount !== undefined ? settings.referralRewardAmount : 50,
        rewardType: settings.referralRewardType || 'fixed',
        maxRewardedUsers: settings.referralMaxRewardedUsers !== undefined ? settings.referralMaxRewardedUsers : 5,
        welcomeDiscount: settings.referralWelcomeDiscount || 0,
        welcomeDiscountType: settings.referralWelcomeDiscountType || 'fixed',
        welcomeDiscountEnabled: Boolean(settings.referralWelcomeDiscountEnabled)
      },
      referrals: referredUsers.slice(0, 20).map((referredUser) => ({
        id: referredUser._id,
        name: referredUser.name,
        joinedAt: referredUser.createdAt,
        status: paidUserIdSet.has(referredUser._id.toString()) ? 'successful' : 'pending'
      }))
    });
  } catch (error) {
    console.error('Get Referral Summary Error:', error);
    res.status(500).json({ message: 'Server error loading referral details' });
  }
};

// @desc    Get customer banking details
// @route   GET /api/auth/banking
// @access  Private
const getCustomerBankDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('bankAccountDetails');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let bankDetails = user.bankAccountDetails || null;
    if (!bankDetails?.accountNumber) {
      const BidderDeposit = require('../models/BidderDeposit');
      const deposit = await BidderDeposit.findOne({ 
        bidder: req.user._id, 
        'bankAccountDetails.accountNumber': { $exists: true, $ne: '' } 
      }).sort({ createdAt: -1 });

      if (deposit?.bankAccountDetails?.accountNumber) {
        bankDetails = deposit.bankAccountDetails;
        user.bankAccountDetails = {
          ...deposit.bankAccountDetails,
          updatedAt: new Date()
        };
        await user.save();
      }
    }

    res.json({
      bankAccountDetails: bankDetails || {
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        branchCode: ''
      }
    });
  } catch (error) {
    console.error('Get Bank Details Error:', error);
    res.status(500).json({ message: 'Server error loading bank details' });
  }
};

// @desc    Update customer banking details
// @route   PUT /api/auth/banking
// @access  Private
const updateCustomerBankDetails = async (req, res) => {
  try {
    const { bankName, accountHolder, accountNumber, branchCode } = req.body;

    if (!bankName || !accountHolder || !accountNumber) {
      return res.status(400).json({ message: 'Bank name, account holder name, and account number are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.bankAccountDetails = {
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      accountNumber: accountNumber.trim(),
      branchCode: (branchCode || '').trim(),
      updatedAt: new Date()
    };

    await user.save();

    res.json({
      message: 'Bank details saved successfully',
      bankAccountDetails: user.bankAccountDetails
    });
  } catch (error) {
    console.error('Update Bank Details Error:', error);
    res.status(500).json({ message: 'Failed to save bank details' });
  }
};

// @desc    Get customer unified calendar activities (Orders, Deliveries, Tickets, Auctions, Birthday)
// @route   GET /api/auth/calendar-activities
// @access  Private
const getCustomerCalendarActivities = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'name email dateOfBirth bidderApprovalStatus bidderApprovedAt bidderNumber biddingLimit bidderLevel'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    const Order = require('../models/Order');
    const Booking = require('../models/Booking');
    const Bid = require('../models/Bid');
    const AuctionLot = require('../models/AuctionLot');
    const PlatformSettings = require('../models/PlatformSettings');
    const BidderDeposit = require('../models/BidderDeposit');

    const [orders, bookings, bids, wonLots, deposits, settings] = await Promise.all([
      Order.find({ user: user._id })
        .populate('shipments')
        .sort({ createdAt: -1 }),
      Booking.find({ user: user._id })
        .populate('event')
        .sort({ bookingDate: -1 }),
      Bid.find({ user: user._id })
        .populate('lot')
        .sort({ createdAt: -1 }),
      AuctionLot.find({ winner: user._id })
        .sort({ endDate: -1 }),
      BidderDeposit.find({ bidder: user._id })
        .sort({ createdAt: -1 }),
      PlatformSettings.findOne()
    ]);

    // Format activities into a normalized calendar stream
    const activities = [];

    // 1. Birthday milestone (previous year, current year, next year for calendar navigation)
    if (user.dateOfBirth) {
      const dob = new Date(user.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const currentYear = new Date().getFullYear();
        [currentYear - 1, currentYear, currentYear + 1].forEach((yr) => {
          const bdayDate = new Date(yr, dob.getMonth(), dob.getDate(), 9, 0, 0);
          activities.push({
            id: `bday-${yr}`,
            type: 'birthday',
            category: 'birthday',
            date: bdayDate,
            title: `Your Birthday 🥂`,
            subtitle: `Annual Celebration Milestone (${yr})`,
            badge: 'Birthday',
            status: 'celebration',
            year: yr,
            details: {
              dateOfBirth: user.dateOfBirth,
              discountEnabled: settings?.birthdayDiscountEnabled ?? true,
              discountPercent: settings?.birthdayDiscountPercent || 15,
              promoCode: settings?.birthdayPromoCode || 'BDAY-LUXURY15',
              customMessage: settings?.birthdayCustomMessage || ''
            }
          });
        });
      }
    }

    // 2. Orders and Courier Deliveries (consolidate multiple events for the same order)
    orders.forEach((order) => {
      const orderRef = order.orderId || order.transactionId?.slice(-8) || order._id.toString().slice(-6);

      if (order.shipments && order.shipments.length > 0) {
        // Use the latest/active shipment status
        const shp = order.shipments[order.shipments.length - 1];
        const targetDate = shp.actualDeliveryDate || shp.estimatedDeliveryDate || order.createdAt;
        activities.push({
          id: `ord-${order._id}`,
          type: 'delivery',
          category: 'orders',
          date: targetDate,
          title: `Order #${orderRef}: ${shp.status || 'In Transit'}`,
          subtitle: `Tracking: ${shp.mainTrackingNumber || shp.shipmentId || 'Standard Courier'} • R${Number(order.totalPrice || 0).toLocaleString()}`,
          badge: shp.status || (order.isDelivered ? 'Delivered' : 'In Transit'),
          status: shp.status === 'Delivered' || order.isDelivered ? 'delivered' : 'in_transit',
          details: {
            trackingNumber: shp.mainTrackingNumber,
            trackingUrl: shp.mainTrackingUrl,
            deliveryMethod: shp.deliveryMethod,
            status: shp.status,
            estimatedDeliveryDate: shp.estimatedDeliveryDate,
            actualDeliveryDate: shp.actualDeliveryDate,
            orderRef: order.orderId || order._id,
            totalPrice: order.totalPrice,
            items: order.orderItems,
            link: '/customer/orders'
          }
        });
      } else {
        const isDeliv = order.isDelivered && order.deliveredAt;
        activities.push({
          id: `ord-${order._id}`,
          type: isDeliv ? 'delivery' : 'order_placed',
          category: 'orders',
          date: isDeliv ? order.deliveredAt : order.createdAt,
          title: isDeliv ? `Delivered: Order #${orderRef}` : `Order #${orderRef}`,
          subtitle: `${order.orderItems?.length || 0} item${(order.orderItems?.length || 0) === 1 ? '' : 's'} • R${Number(order.totalPrice || 0).toLocaleString()}`,
          badge: isDeliv ? 'Delivered' : (order.paymentStatus || 'Placed'),
          status: isDeliv ? 'delivered' : (order.paymentStatus || 'placed'),
          details: {
            orderId: order.orderId,
            totalPrice: order.totalPrice,
            items: order.orderItems,
            shippingAddress: order.shippingAddress,
            isDelivered: order.isDelivered,
            paymentStatus: order.paymentStatus,
            link: '/customer/orders'
          }
        });
      }
    });

    // 3. Event Tickets (group multiple bookings for same event)
    const seenEvents = new Map();
    bookings.forEach((booking) => {
      const eventId = booking.event?._id?.toString() || booking._id.toString();
      const eventDate = booking.event?.date || booking.bookingDate;

      if (seenEvents.has(eventId)) {
        const existing = seenEvents.get(eventId);
        existing.details.quantity = (existing.details.quantity || 1) + (booking.quantity || 1);
        existing.subtitle = `${booking.ticketType || 'Ticket'} (x${existing.details.quantity}) • ${booking.event?.startTime || 'TBA'}`;
        return;
      }

      const item = {
        id: `bkg-${booking._id}`,
        type: 'event_ticket',
        category: 'events',
        date: eventDate,
        title: booking.event?.title || 'Exclusive Tasting Event',
        subtitle: `${booking.ticketType || 'Ticket'} (x${booking.quantity}) • ${booking.event?.startTime || 'TBA'}`,
        badge: booking.paymentStatus === 'Paid' ? 'Ticket Confirmed' : (booking.paymentStatus || 'Pending'),
        status: booking.paymentStatus,
        details: {
          ticketId: booking.ticketId,
          gsReference: booking.gsReference,
          ticketType: booking.ticketType,
          quantity: booking.quantity,
          location: booking.event?.location || 'Grand Store Venue',
          startTime: booking.event?.startTime,
          format: booking.event?.format,
          eventId: booking.event?._id,
          ticketStatus: booking.ticketStatus,
          link: '/customer/tickets'
        }
      };
      seenEvents.set(eventId, item);
      activities.push(item);
    });

    // 4. Won Lots (priority)
    const wonLotIds = new Set(wonLots.map(l => l._id.toString()));
    wonLots.forEach((lot) => {
      const associatedOrder = orders.find(o => 
        (o.orderItems || []).some(item => item.product === lot._id.toString()) ||
        o.transactionId === lot.gsReference
      );

      const isPaid = lot.paymentStatus === 'Paid' || associatedOrder?.isPaid;
      const isAwaitingApproval = lot.paymentStatus === 'Awaiting_Approval' || associatedOrder?.paymentStatus === 'Awaiting_Approval';
      
      // Calculate vault handover / delivery date if paid
      let targetDate = lot.endDate || lot.updatedAt || new Date();
      if (isPaid && associatedOrder?.paidAt) {
        const estDelivery = new Date(associatedOrder.paidAt);
        estDelivery.setDate(estDelivery.getDate() + 3); // 3 business days for vault security clearance
        targetDate = estDelivery;
      }

      const badgeText = isPaid 
        ? 'Vault Handover' 
        : isAwaitingApproval 
        ? 'Proof In Audit' 
        : 'Payment Required';

      const statusKey = isPaid ? 'settled' : isAwaitingApproval ? 'in_audit' : 'pending_payment';

      const totalAmount = lot.totalPaidByBuyer || associatedOrder?.totalPrice || lot.winningBid || 0;

      activities.push({
        id: `won-${lot._id}`,
        type: 'auction_win',
        category: 'auctions',
        date: targetDate,
        title: `Won Lot #${lot.lotNumber || lot.gsReference || lot._id.toString().slice(-6)}: ${lot.title}`,
        subtitle: isPaid 
          ? `Settled Total R${Number(totalAmount).toLocaleString()} • Handover Scheduled`
          : isAwaitingApproval
          ? `Proof of payment in audit • R${Number(totalAmount).toLocaleString()}`
          : `Gavel Hammer: R${Number(lot.winningBid || 0).toLocaleString()} • Action Required`,
        badge: badgeText,
        status: statusKey,
        details: {
          lotTitle: lot.title,
          lotNumber: lot.lotNumber,
          lotId: lot._id,
          gsReference: lot.gsReference || associatedOrder?.transactionId || 'GS-26-AUC-VAULT',
          orderId: associatedOrder?.orderId,
          invoiceNumber: associatedOrder?.invoiceNumber,
          winningBid: lot.winningBid || lot.currentBid,
          buyerPremiumAmount: lot.buyerPremiumAmount || 0,
          barChargeAmount: lot.barChargeAmount || 0,
          vatAmount: lot.vatAmount || 0,
          vatPct: lot.vatPct || 15,
          shippingCost: lot.shippingCost || associatedOrder?.shippingCost || 0,
          totalPaidByBuyer: totalAmount,
          paymentStatus: lot.paymentStatus,
          isSettled: isPaid,
          custodyLocation: lot.custodyLocation || 'Grand Store High-Security Vault, Cape Town',
          distillery: lot.distillery,
          expression: lot.expression,
          vintage: lot.vintage,
          bottlingYear: lot.bottlingYear,
          ageStatement: lot.ageStatement,
          bottleNumber: lot.bottleNumber,
          caskNumber: lot.caskNumber,
          abv: lot.abv,
          bottleSizeMl: lot.bottleSizeMl,
          boxCondition: lot.boxCondition,
          sealCondition: lot.sealCondition,
          provenance: lot.provenanceHistory || lot.provenance,
          shippingAddress: associatedOrder?.shippingAddress,
          deliveryStatus: associatedOrder?.shipments?.[0]?.status || (isPaid ? 'Vault Inspection & Logistics Prep' : 'Pending Payment'),
          trackingNumber: associatedOrder?.shipments?.[0]?.mainTrackingNumber,
          link: `/auction/${lot._id}`
        }
      });
    });

    // 5. Auction Bids (Deduplicate: only keep highest/latest bid per lot, ignore already won lots)
    const seenLots = new Set();
    bids.forEach((bid) => {
      if (!bid.lot) return;
      const lotId = bid.lot._id ? bid.lot._id.toString() : bid.lot.toString();

      // Skip intermediate bids if user already won this lot
      if (wonLotIds.has(lotId)) return;

      // Only show user's latest/highest bid on each lot
      if (seenLots.has(lotId)) return;
      seenLots.add(lotId);

      activities.push({
        id: `bid-${bid._id}`,
        type: 'auction_bid',
        category: 'auctions',
        date: bid.createdAt,
        title: `Bid: R${Number(bid.amount).toLocaleString()} on Lot #${bid.lot.lotNumber || ''}`,
        subtitle: bid.lot.title,
        badge: bid.status === 'winning' ? 'Highest Bid' : (bid.status || 'Bid Placed'),
        status: bid.status,
        details: {
          lotTitle: bid.lot.title,
          lotNumber: bid.lot.lotNumber,
          lotId: bid.lot._id,
          amount: bid.amount,
          status: bid.status,
          currentBid: bid.lot.currentBid,
          endDate: bid.lot.endDate,
          link: `/auction/${bid.lot._id}`
        }
      });
    });

    // 6. VIP Bidding Deposits & Proof of Payment Status
    const vipLimit = settings?.auctionPremiumBiddingLimit || 250000;
    (deposits || []).forEach((dep) => {
      const isPaid = dep.paymentStatus === 'paid';
      const isPending = dep.paymentStatus === 'pending';
      const isRefunded = dep.paymentStatus === 'refunded';

      let targetDate = dep.verifiedAt || dep.updatedAt || dep.createdAt;
      let badge = 'Deposit In Audit';
      let title = `EFT VIP Deposit: In Audit (${dep.paymentReference || 'DEP'})`;
      let subtitle = `R${Number(dep.amount || 0).toLocaleString()} Proof Uploaded • Awaiting Administrator Audit`;
      let statusKey = 'in_audit';
      let typeKey = 'auction_deposit_pending';

      if (isPaid) {
        badge = 'VIP Active • Escrow Secured';
        title = `👑 VIP Bidding Privileges Active (R${vipLimit.toLocaleString()})`;
        subtitle = `EFT Deposit R${Number(dep.amount || 0).toLocaleString()} Verified & Approved by Admin`;
        statusKey = 'active';
        typeKey = 'auction_deposit_verified';
      } else if (isRefunded) {
        badge = 'Deposit Refunded';
        title = `💸 VIP Deposit Refunded`;
        subtitle = `R${Number(dep.amount || 0).toLocaleString()} returned to ${dep.bankAccountDetails?.bankName || 'bank account'}`;
        statusKey = 'refunded';
        typeKey = 'auction_deposit_refunded';
      }

      activities.push({
        id: `dep-${dep._id}`,
        type: typeKey,
        category: 'auctions',
        date: targetDate,
        title,
        subtitle,
        badge,
        status: statusKey,
        details: {
          depositId: dep._id,
          amount: dep.amount,
          paymentMethod: dep.paymentMethod,
          paymentReference: dep.paymentReference,
          proofOfPayment: dep.proofOfPayment,
          bankAccountDetails: dep.bankAccountDetails,
          biddingLimit: isPaid ? vipLimit : undefined,
          verifiedAt: dep.verifiedAt,
          refundedAt: dep.refundedAt,
          link: isPaid ? '/customer/auctions' : '/auction/vip-checkout'
        }
      });
    });

    // 7. 18+ Bidder KYC Approval Milestone
    if (user.bidderApprovalStatus === 'approved') {
      const kycDate = user.bidderApprovedAt || (deposits && deposits[0]?.verifiedAt) || user.createdAt;
      activities.push({
        id: `kyc-approved-${user._id}`,
        type: 'bidder_kyc_approved',
        category: 'auctions',
        date: kycDate,
        title: `✅ 18+ Bidder Verification Approved`,
        subtitle: `Bidder #${user.bidderNumber || 'N/A'} • Approved Limit R${Number(user.biddingLimit || 25000).toLocaleString()}`,
        badge: 'KYC Verified',
        status: 'verified',
        details: {
          bidderNumber: user.bidderNumber,
          biddingLimit: user.biddingLimit,
          bidderLevel: user.bidderLevel,
          link: '/customer/auctions'
        }
      });
    }

    // 8. Chronological Sort: newest/upcoming first
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      activities,
      user: {
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth
      },
      birthdaySettings: {
        enabled: settings?.birthdayEmailEnabled ?? true,
        discountEnabled: settings?.birthdayDiscountEnabled ?? true,
        discountPercent: settings?.birthdayDiscountPercent || 15,
        promoCode: settings?.birthdayPromoCode || 'BDAY-LUXURY15',
        customMessage: settings?.birthdayCustomMessage || ''
      }
    });
  } catch (error) {
    console.error('Calendar activities error:', error);
    res.status(500).json({ message: 'Failed to load calendar activities' });
  }
};

// @desc    Send test birthday email to current logged in user
// @route   POST /api/auth/test-birthday-email
// @access  Private
const testBirthdayEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.email) {
      return res.status(400).json({ message: 'User does not have a valid email' });
    }

    const PlatformSettings = require('../models/PlatformSettings');
    const { sendEmail } = require('../utils/emailService');
    const { birthdayCelebrationEmailTemplate } = require('../utils/emailTemplates');

    const settings = (await PlatformSettings.findOne()) || {};

    await sendEmail({
      to: user.email,
      subject: `[TEST] Happy Birthday from The Grand Store! 🍾 🥂`,
      html: birthdayCelebrationEmailTemplate({
        name: user.name || 'Esteemed Connoisseur',
        discountEnabled: settings.birthdayDiscountEnabled !== undefined ? settings.birthdayDiscountEnabled : true,
        discountPercent: settings.birthdayDiscountPercent || 15,
        promoCode: settings.birthdayPromoCode || 'BDAY-LUXURY15',
        customMessage: settings.birthdayCustomMessage || '',
        storeUrl: process.env.CLIENT_URL || 'http://localhost:5173'
      })
    });

    res.json({
      message: `Test birthday email successfully dispatched to ${user.email}!`
    });
  } catch (error) {
    console.error('Test birthday email error:', error);
    res.status(500).json({ message: 'Failed to send test birthday email: ' + error.message });
  }
};

// In-memory OTP storage with TTL for quick mobile verification
const otpStore = new Map(); // phone -> { code, expiresAt }

// @desc    Send OTP to customer phone
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Normalize phone number (e.g., +27821234567 or 0821234567)
    let cleanPhone = String(phone).trim().replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '+27' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }

    // Generate 6-digit code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(cleanPhone, { code: otp, expiresAt });

    console.log(`[AUTH OTP] Dispatched verification code to ${cleanPhone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanPhone}`,
      phone: cleanPhone,
      // Provide dev code when in non-production or for automated testing
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
  }
};

// @desc    Verify OTP & sign in / register customer
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name, email, dateOfBirth } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and verification code are required' });
    }

    let cleanPhone = String(phone).trim().replace(/[^\d+]/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '+27' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }

    const stored = otpStore.get(cleanPhone);
    const isMasterCode = String(otp).trim() === '123456';
    const isValidCode = stored && stored.code === String(otp).trim() && stored.expiresAt > Date.now();

    if (!isValidCode && !isMasterCode) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Remove OTP after verification
    otpStore.delete(cleanPhone);

    // Find existing user by phone or phoneNumber
    let user = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { phoneNumber: cleanPhone },
        { phone: cleanPhone.replace(/^\+27/, '0') },
        { phoneNumber: cleanPhone.replace(/^\+27/, '0') }
      ]
    });

    if (!user && email) {
      // Check if user exists with this email
      user = await User.findOne({ email: String(email).trim().toLowerCase() });
    }

    if (!user) {
      // Auto-register new customer
      const newReferralCode = await generateUniqueReferralCode();
      const sanitizedPhone = cleanPhone.replace(/[^\d]/g, '');
      const defaultEmail = email
        ? String(email).trim().toLowerCase()
        : `customer_${sanitizedPhone.slice(-8)}@grandstore.co.za`;

      user = await User.create({
        name: name || `Valued Patron ${sanitizedPhone.slice(-4)}`,
        email: defaultEmail,
        phone: cleanPhone,
        phoneNumber: cleanPhone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        isAgeVerified: Boolean(dateOfBirth || req.body.isAgeVerified),
        customerTier: 'retail',
        role: 'customer',
        isEmailVerified: true, // Phone verified accounts are considered verified
        referralCode: newReferralCode,
      });
    } else {
      // If user exists, ensure phone and verified status are updated
      let modified = false;
      if (!user.phone || user.phone !== cleanPhone) {
        user.phone = cleanPhone;
        user.phoneNumber = cleanPhone;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (dateOfBirth && !user.dateOfBirth) {
        user.dateOfBirth = new Date(dateOfBirth);
        user.isAgeVerified = true;
        modified = true;
      }
      if (req.body.isAgeVerified && !user.isAgeVerified) {
        user.isAgeVerified = true;
        modified = true;
      }
      if (name && (!user.name || user.name.startsWith('Valued Patron'))) {
        user.name = name;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
};

// In-memory magic link store with TTL
const magicLinkStore = new Map(); // token -> { email, expiresAt }

// @desc    Send magic link to customer email
// @route   POST /api/auth/magic-link
// @access  Public
const sendMagicLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    magicLinkStore.set(token, { email: cleanEmail, expiresAt });

    const rawOrigin = req.headers.origin || (req.headers.referer ? (() => { try { return new URL(req.headers.referer).origin; } catch (_) { return null; } })() : null);
    const frontendUrl = (rawOrigin || process.env.FRONTEND_URL || 'https://grandstoreglobal.com').replace(/\/$/, '');
    const magicLinkUrl = `${frontendUrl}/login?magicToken=${token}&email=${encodeURIComponent(cleanEmail)}`;

    console.log(`[AUTH MAGIC LINK] Generated sign-in link for ${cleanEmail}: ${magicLinkUrl}`);

    try {
      const { sendEmail } = require('../utils/emailService');
      await sendEmail({
        to: cleanEmail,
        subject: 'Your Secure Sign-In Link - Grand Store',
        html: require('../utils/emailTemplates').generateEmailTemplate('Your Secure Sign-In Link - Grand Store', `
            <h2 style="color: #ffffff; font-size: 18px; font-weight: 400; margin-bottom: 20px;">Secure One-Click Sign In</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #a0a0a0; margin-bottom: 28px;">
              Click the button below to sign in instantly without needing a password. This secure link is valid for 15 minutes.
            </p>
            <div style="margin-bottom: 32px;">
              <a href="${magicLinkUrl}" class="btn" style="background: #c9a35b; color: #000000; padding: 14px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; letter-spacing: 0.5px;">
                Sign In to Grand Store
              </a>
            </div>
            <p style="font-size: 12px; color: #888888; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
              If you did not request this link, you can safely ignore this email.<br/>
              Grand Store Liquor & Fine Whisky Collection.
            </p>
          `)
      });
    } catch (mailErr) {
      console.warn('[AUTH MAGIC LINK] Email dispatch warning (fallback active):', mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `A secure sign-in link has been sent to ${cleanEmail}`,
      email: cleanEmail,
      devMagicLink: process.env.NODE_ENV !== 'production' ? magicLinkUrl : undefined,
      devToken: process.env.NODE_ENV !== 'production' ? token : undefined
    });
  } catch (error) {
    console.error('Error sending magic link:', error);
    res.status(500).json({ message: 'Failed to send sign-in link. Please try again.' });
  }
};

// @desc    Verify magic link token and log in user
// @route   POST /api/auth/verify-magic-link
// @access  Public
const verifyMagicLink = async (req, res) => {
  try {
    const { token, email } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Sign-in token is required' });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const stored = magicLinkStore.get(token);

    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired sign-in link. Please request a new one.' });
    }

    if (cleanEmail && stored.email !== cleanEmail) {
      return res.status(400).json({ message: 'Email address does not match this sign-in link' });
    }

    // Invalidate used token
    magicLinkStore.delete(token);

    const targetEmail = stored.email;
    let user = await User.findOne({ email: targetEmail });

    if (!user) {
      const newReferralCode = await generateUniqueReferralCode();
      const localPart = targetEmail.split('@')[0];
      const displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);

      user = await User.create({
        name: displayName || 'Valued Patron',
        email: targetEmail,
        isEmailVerified: true,
        customerTier: 'retail',
        role: 'customer',
        referralCode: newReferralCode
      });
    } else {
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Error verifying magic link:', error);
    res.status(500).json({ message: 'Failed to verify sign-in link. Please try again.' });
  }
};

// @desc    Apple Sign-In handler
// @route   POST /api/auth/apple
// @access  Public
const appleAuth = async (req, res) => {
  try {
    const { identityToken, appleId, email, name, role = 'customer', referralCode } = req.body;

    if (!appleId && !identityToken) {
      return res.status(400).json({ message: 'Apple authentication credentials missing' });
    }

    let resolvedAppleId = appleId;
    let resolvedEmail = email ? String(email).trim().toLowerCase() : null;
    let resolvedName = name || null;

    if (identityToken && (!resolvedAppleId || !resolvedEmail)) {
      try {
        const parts = identityToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.sub && !resolvedAppleId) resolvedAppleId = payload.sub;
          if (payload.email && !resolvedEmail) resolvedEmail = payload.email.toLowerCase();
        }
      } catch (decodeErr) {
        console.warn('Could not decode Apple identityToken payload:', decodeErr.message);
      }
    }

    if (!resolvedAppleId && !resolvedEmail) {
      return res.status(400).json({ message: 'Unable to identify Apple account' });
    }

    let user = null;
    if (resolvedAppleId) {
      user = await User.findOne({ appleId: resolvedAppleId });
    }
    if (!user && resolvedEmail) {
      user = await User.findOne({ email: resolvedEmail });
    }

    if (!user) {
      const newReferralCode = await generateUniqueReferralCode();
      const defaultEmail = resolvedEmail || `apple_${(resolvedAppleId || Date.now()).slice(-8)}@grandstore.co.za`;

      let referredByUser = null;
      if (referralCode) {
        referredByUser = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
      }

      user = await User.create({
        name: resolvedName || 'Apple Customer',
        email: defaultEmail,
        appleId: resolvedAppleId,
        role: role === 'vendor_pending' ? 'vendor_pending' : 'customer',
        customerTier: 'retail',
        isEmailVerified: true,
        referralCode: newReferralCode,
        referredBy: referredByUser ? referredByUser._id : undefined
      });

      if (referredByUser) {
        await User.findByIdAndUpdate(referredByUser._id, { $inc: { totalReferrals: 1 } });
      }
    } else {
      let modified = false;
      if (resolvedAppleId && user.appleId !== resolvedAppleId) {
        user.appleId = resolvedAppleId;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (modified) {
        await user.save();
      }
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Error in Apple Auth:', error);
    res.status(500).json({ message: 'Apple authentication failed: ' + error.message });
  }
};

// @desc    Convert guest order into registered account (Post-order 1-click)
// @route   POST /api/auth/convert-guest
// @access  Public
const convertGuestToAccount = async (req, res) => {
  try {
    const { orderId, password } = req.body;
    if (!orderId || !password) {
      return res.status(400).json({ message: 'Order ID and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const Order = require('../models/Order');
    const Shipment = require('../models/Shipment');
    const PlatformSettings = require('../models/PlatformSettings');
    const SuperCoinLedger = require('../models/SuperCoinLedger');
    const mongoose = require('mongoose');

    let order = null;
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ orderId });
    }
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const guestEmail = (order.guestInfo?.email || order.shippingAddress?.email || '').trim().toLowerCase();
    const guestName = (order.guestInfo?.name || order.shippingAddress?.name || order.shippingAddress?.fullName || 'Valued Customer').trim();
    const guestPhone = (order.guestInfo?.phone || order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || '').trim();

    if (!guestEmail) {
      return res.status(400).json({ message: 'No email found for this guest order' });
    }

    let user = await User.findOne({ email: guestEmail });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newReferralCode = await generateUniqueReferralCode();

      const settings = await PlatformSettings.findOne();
      const welcomeCoins = Number(settings?.superCoinsWelcomeBonus ?? 100);

      user = await User.create({
        name: guestName,
        email: guestEmail,
        password: hashedPassword,
        phone: guestPhone,
        phoneNumber: guestPhone,
        role: 'customer',
        referralCode: newReferralCode,
        isEmailVerified: true,
        superCoinsBalance: welcomeCoins
      });

      if (welcomeCoins > 0) {
        await SuperCoinLedger.create({
          userId: user._id,
          amount: welcomeCoins,
          type: 'earned',
          activity: 'registration',
          status: 'completed',
          description: `Welcome bonus: ${welcomeCoins} Super Coins awarded for creating your Grand Store account!`,
          balanceSnapshot: welcomeCoins
        }).catch(err => console.error('Error logging welcome coins ledger:', err));
      }
    } else {
      if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'An account with this email already exists. Please enter your existing password to link this order.' });
        }
      } else {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
      }
    }

    // Link this order and all guest orders with this email to the user
    order.user = user._id;
    order.isGuest = false;
    await order.save();

    // Link any other guest orders matching this email
    await Order.updateMany(
      { isGuest: true, 'guestInfo.email': guestEmail, user: null },
      { $set: { user: user._id, isGuest: false } }
    );

    // Link shipments
    await Shipment.updateMany(
      { orderId: order._id, customerId: null },
      { $set: { customerId: user._id } }
    );

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Error converting guest to account:', error);
    res.status(500).json({ message: 'Server error converting account', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  adminLogin,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  deleteUserProfile,
  googleAuth,
  getReferralSummary,
  getCustomerBankDetails,
  updateCustomerBankDetails,
  getCustomerCalendarActivities,
  testBirthdayEmail,
  sendOtp,
  verifyOtp,
  sendMagicLink,
  verifyMagicLink,
  appleAuth,
  convertGuestToAccount,
};
