const BRAND_COLOR_GOLD = '#c9a35b';
const BRAND_COLOR_DARK = '#050505';
const BRAND_COLOR_LIGHT = '#f5f5f5';

const formatRand = (amount) => `R ${Number(amount || 0).toFixed(2)}`;

const generateEmailTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${BRAND_COLOR_DARK};
      color: ${BRAND_COLOR_LIGHT};
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0a0a0a;
      border: 1px solid #222;
    }
    .header {
      padding: 40px 20px;
      text-align: center;
      background-color: ${BRAND_COLOR_DARK};
      border-bottom: 2px solid ${BRAND_COLOR_GOLD};
    }
    .logo {
      font-family: 'Times New Roman', Times, serif;
      font-size: 28px;
      font-weight: bold;
      color: ${BRAND_COLOR_LIGHT};
      text-transform: uppercase;
      letter-spacing: 4px;
      margin: 0;
    }
    .logo-gold {
      color: ${BRAND_COLOR_GOLD};
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
      font-size: 16px;
      color: #e0e0e0;
    }
    h1, h2, h3 {
      color: ${BRAND_COLOR_GOLD};
      font-family: 'Times New Roman', Times, serif;
      font-weight: normal;
      margin-top: 0;
    }
    h1 {
      font-size: 24px;
      letter-spacing: 1px;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 30px;
      background-color: ${BRAND_COLOR_GOLD};
      color: ${BRAND_COLOR_DARK};
      text-decoration: none;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 14px;
      margin-top: 20px;
      border-radius: 2px;
    }
    .footer {
      padding: 30px;
      text-align: center;
      background-color: ${BRAND_COLOR_DARK};
      border-top: 1px solid #222;
      font-size: 12px;
      color: #888;
      letter-spacing: 0.5px;
    }
    .divider {
      height: 1px;
      background-color: #222;
      margin: 30px 0;
    }
    .details-box {
      background-color: #111;
      border: 1px solid #333;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .details-box p {
      margin: 5px 0;
    }
    a {
      color: ${BRAND_COLOR_GOLD};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">The <span class="logo-gold">Grand</span> Store</div>
    </div>
    <div class="content">
      ${content}
      <br><br>
      Best Regards,<br>
      <strong style="color: ${BRAND_COLOR_GOLD}">The Grand Store Team</strong>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} The Grand Store. All rights reserved.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  </div>
</body>
</html>
`;

const welcomeEmailTemplate = (name) => {
  const content = `
    <h1>Welcome to The Grand Store!</h1>
    <p>Dear ${name},</p>
    <p>We are absolutely thrilled to welcome you to The Grand Store, your ultimate destination for premium and exclusive products.</p>
    <p>Your account has been successfully created. You can now explore our curated collections, track your orders, and enjoy a seamless luxury shopping experience.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">Start Shopping</a>
  `;
  return generateEmailTemplate('Welcome to The Grand Store', content);
};

const verificationEmailTemplate = (name, verificationLink) => {
  const content = `
    <h1>Verify Your Email Address</h1>
    <p>Dear ${name},</p>
    <p>Thank you for registering at The Grand Store. To complete your registration and secure your account, please verify your email address by clicking the button below.</p>
    <a href="${verificationLink}" class="btn">Verify Email</a>
    <p style="margin-top: 30px; font-size: 14px; color: #888;">If the button doesn't work, you can copy and paste this link into your browser:<br>${verificationLink}</p>
  `;
  return generateEmailTemplate('Verify your email - The Grand Store', content);
};

const passwordResetTemplate = (name, resetUrl) => {
  const content = `
    <h1>Password Reset Request</h1>
    <p>Dear ${name},</p>
    <p>We received a request to reset your password for The Grand Store. If you didn't make this request, you can safely ignore this email.</p>
    <p>To reset your password, please click the button below. This link is valid for 10 minutes.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p style="margin-top: 30px; font-size: 14px; color: #888;">If the button doesn't work, you can copy and paste this link into your browser:<br>${resetUrl}</p>
  `;
  return generateEmailTemplate('Password Reset Request - The Grand Store', content);
};

const newsletterWelcomeTemplate = () => {
  const content = `
    <h1>Thank You for Subscribing!</h1>
    <p>Welcome to The Grand Store Newsletter.</p>
    <p>You are now on the list to receive our latest updates, exclusive offers, and invitations to premium events. We promise to only send you the best of what we have to offer.</p>
    <p>Stay tuned for our upcoming curations!</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">Visit Our Store</a>
  `;
  return generateEmailTemplate('Welcome to The Grand Store Newsletter', content);
};

const orderConfirmationTemplate = (order) => {
  let itemsHtml = order.orderItems.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #333;">${item.name} (x${item.quantity || item.qty || 1})</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #333; text-align: right;">${formatRand(item.price * (item.quantity || item.qty || 1))}</td>
    </tr>
  `).join('');

  const orderReference = order.invoiceNumber || order.orderId || order._id;

  const content = `
    <h1>Order Confirmation</h1>
    <p>Dear Customer,</p>
    <p>Thank you for your purchase from The Grand Store. Your payment for order <strong>#${orderReference}</strong> was successful. Your PDF receipt is attached to this email.</p>
    
    <div class="details-box">
      <h3 style="margin-top: 0;">Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        ${itemsHtml}
        <tr>
          <td style="padding: 15px 0 5px; font-weight: bold;">Subtotal</td>
          <td style="padding: 15px 0 5px; text-align: right;">${formatRand(order.subTotal)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0;">Shipping</td>
          <td style="padding: 5px 0; text-align: right;">${formatRand(order.shippingCost)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; font-weight: bold; color: ${BRAND_COLOR_GOLD}; font-size: 16px;">Total</td>
          <td style="padding: 5px 0; text-align: right; font-weight: bold; color: ${BRAND_COLOR_GOLD}; font-size: 16px;">${formatRand(order.totalPrice)}</td>
        </tr>
      </table>
    </div>
    
    <div class="details-box">
      <h3 style="margin-top: 0;">Shipping Address</h3>
      <p>${order.shippingAddress?.address || ''}</p>
      <p>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.postalCode || ''}</p>
      <p>${order.shippingAddress?.country || ''}</p>
    </div>

    <div class="details-box" style="border-left: 4px solid ${BRAND_COLOR_GOLD}; background: #14120c; margin-top: 15px;">
      <h3 style="margin-top: 0; color: ${BRAND_COLOR_GOLD}; font-size: 15px;">📦 Live Tracking & Dispatch Notifications</h3>
      <p style="margin-bottom: 6px; font-size: 13px; color: #ddd;">
        Real-time courier waybill tracking links, SMS delivery PINs, and collection alerts will be automatically sent to:
      </p>
      <p style="margin: 4px 0; font-size: 13px;">
        ✉️ <strong>Email:</strong> ${order.guestInfo?.email || order.shippingAddress?.email || (order.user?.email) || 'On file'}
      </p>
      <p style="margin: 4px 0; font-size: 13px;">
        📱 <strong>Phone / SMS:</strong> ${order.guestInfo?.phone || order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || (order.user?.phone) || 'On file'}
      </p>
    </div>

    ${order.isGuest && order.guestKyc?.documentUrl ? `
    <div class="details-box" style="border-left: 4px solid #10b981; background: #0c1813; margin-top: 15px;">
      <h3 style="margin-top: 0; color: #10b981; font-size: 15px;">🛡️ 18+ Legal Age Verification Document Received</h3>
      <p style="margin: 0; font-size: 13px; color: #d1fae5; line-height: 1.5;">
        Your official identification document (${(order.guestKyc.idType || 'ID/Passport').toUpperCase()}) has been securely submitted to Grand Store Administration for compliance clearance. Your order is confirmed and will be dispatched once verified.
      </p>
    </div>
    ` : `
    <div class="details-box" style="border-left: 4px solid #3b82f6; background: #0c1420; margin-top: 15px;">
      <h3 style="margin-top: 0; color: #60a5fa; font-size: 15px;">🛡️ 18+ Certified Order</h3>
      <p style="margin: 0; font-size: 13px; color: #dbeafe; line-height: 1.5;">
        This order has been verified under South African liquor compliance regulations. An adult signature (18+) is required upon parcel handover.
      </p>
    </div>
    `}
    
    <p style="margin-top: 20px;">We will notify you with the tracking waybill as soon as your parcel leaves our temperature-controlled holding.</p>
  `;
  return generateEmailTemplate(`Payment Receipt #${orderReference}`, content);
};

const bankTransferInstructionsTemplate = (order, bankDetails) => {
  const content = `
    <h1>Bank Transfer Instructions</h1>
    <p>Dear Customer,</p>
    <p>Thank you for placing your order (<strong>#${order._id}</strong>). To complete your purchase, please transfer the total amount to the bank account below.</p>
    
    <div class="details-box">
      <h3 style="margin-top: 0;">Payment Details</h3>
      <p><strong style="color: ${BRAND_COLOR_GOLD}">Amount Due:</strong> $${order.totalPrice}</p>
      <p><strong style="color: ${BRAND_COLOR_GOLD}">Order Reference:</strong> ${order._id}</p>
      <div class="divider"></div>
      <h3 style="margin-top: 0;">Bank Information</h3>
      <p><strong>Bank Name:</strong> ${bankDetails.bankName || 'FNB'}</p>
      <p><strong>Account Name:</strong> ${bankDetails.accountName || 'The Grand Store'}</p>
      <p><strong>Account Number:</strong> ${bankDetails.accountNumber || '62000000000'}</p>
      <p><strong>Branch Code:</strong> ${bankDetails.branchCode || '250655'}</p>
    </div>
    
    <p>Please use your Order Reference (<strong>${order._id}</strong>) as the payment reference. Your order will be processed once the funds have cleared in our account.</p>
    <p>You can upload your proof of payment on your order details page.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/orders" class="btn">View Order</a>
  `;
  return generateEmailTemplate(`Payment Required - Order #${order._id}`, content);
};

const eventBankTransferInstructionsTemplate = (booking, event, bankDetails) => {
  const reference = booking.gsReference || booking._id;
  const content = `
    <h1>Event Ticket Bank Transfer</h1>
    <p>Thank you for reserving tickets for <strong>${event.title}</strong>. Transfer the exact amount below and upload your proof of payment for verification.</p>

    <div class="details-box">
      <h3 style="margin-top: 0;">Payment Details</h3>
      <p><strong style="color: ${BRAND_COLOR_GOLD}">Amount Due:</strong> R${Number(booking.totalPrice).toFixed(2)}</p>
      <p><strong style="color: ${BRAND_COLOR_GOLD}">Payment Reference:</strong> ${reference}</p>
      <div class="divider"></div>
      <h3 style="margin-top: 0;">Bank Information</h3>
      <p><strong>Bank Name:</strong> ${bankDetails.bankName || 'Standard Bank'}</p>
      <p><strong>Account Name:</strong> ${bankDetails.accountName || 'The Grand Store PTY LTD'}</p>
      <p><strong>Account Number:</strong> ${bankDetails.accountNumber || '0123456789'}</p>
      <p><strong>Branch Code:</strong> ${bankDetails.branchCode || '051001'}</p>
    </div>

    <p>Your ticket is issued only after the transfer is approved. Use the booking reference exactly so the finance team can match your payment.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/event-order/${booking._id}?payment=bank-transfer" class="btn">Upload Proof of Payment</a>
  `;
  return generateEmailTemplate(`Payment Required - ${reference}`, content);
};

const vendorApprovalTemplate = (name, fee = 0) => {
  const content = `
    <h1>Vendor Application Approved</h1>
    <p>Dear ${name},</p>
    <p>Congratulations! Your application to become a vendor at The Grand Store has been approved.</p>
    
    <div class="details-box">
      <h3 style="margin-top: 0;">Next Steps</h3>
      <p>To activate your storefront and unlock your vendor dashboard, a one-time onboarding fee is required.</p>
      <p><strong style="color: ${BRAND_COLOR_GOLD}">Amount Due:</strong> R${fee}</p>
    </div>
    
    <p>Please log in to complete your payment.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/vendor/dashboard" class="btn">Log In and Pay</a>
  `;
  return generateEmailTemplate('Your Vendor Account is Approved', content);
};

const genericNotificationTemplate = (title, message) => {
  const content = `
    <h1>${title}</h1>
    <p>${message}</p>
  `;
  return generateEmailTemplate(title, content);
};

const hostApplicationApprovalTemplate = (name, username, password, type) => {
  const portalPath = type === 'auction' ? '/host/auction' : '/host/event';
  const featureLabel = type === 'auction' ? 'Auction Host' : 'Event Host';
  
  let credentialsHtml = '';
  if (password) {
    credentialsHtml = `
      <div class="details-box">
        <h3 style="margin-top: 0;">Your Temporary Credentials</h3>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p style="font-size: 13px; color: #aaa; margin-top: 10px;">Please change your password after your first login.</p>
      </div>
    `;
  } else {
    credentialsHtml = `
      <div class="details-box">
        <h3 style="margin-top: 0;">Access Granted</h3>
        <p>Your existing account has been upgraded with ${featureLabel} privileges. You can log in using your current credentials.</p>
      </div>
    `;
  }

  const content = `
    <h1>${featureLabel} Application Approved</h1>
    <p>Dear ${name},</p>
    <p>Congratulations! Your application to become a ${featureLabel} at The Grand Store has been approved.</p>
    ${credentialsHtml}
    <p>You can now log in to your portal to manage your listings.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Login to Portal</a>
  `;
  return generateEmailTemplate(`Your ${featureLabel} Application is Approved`, content);
};

const hostApplicationRejectionTemplate = (name, type, reason) => {
  const featureLabel = type === 'auction' ? 'Auction Host' : 'Event Host';
  const content = `
    <h1>Update on your ${featureLabel} Application</h1>
    <p>Dear ${name},</p>
    <p>Thank you for your interest in becoming a ${featureLabel} at The Grand Store. After careful consideration, we are unable to approve your application at this time.</p>
    <div class="details-box">
      <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
    </div>
    <p>If you have any questions, please reach out to our support team.</p>
  `;
  return generateEmailTemplate(`Update on your ${featureLabel} Application`, content);
};

const eventReminderTemplate = (name, eventTitle, eventDate, eventTime, location) => {
  const content = `
    <h1>Upcoming Event Reminder</h1>
    <p>Dear ${name},</p>
    <p>This is a quick reminder that you have tickets for the upcoming event <strong>${eventTitle}</strong>!</p>
    
    <div class="details-box">
      <h3 style="margin-top: 0;">Event Details</h3>
      <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${eventTime}</p>
      <p><strong>Location:</strong> ${location}</p>
    </div>
    
    <p>Please remember to bring your ticket with you.</p>
    <p>We look forward to seeing you there!</p>
  `;
  return generateEmailTemplate(`Reminder: ${eventTitle} is coming up!`, content);
};

const auctionReminderTemplate = (name, auctionTitle, startDate, lotNumber) => {
  const content = `
    <h1>Auction Starting Soon</h1>
    <p>Dear ${name},</p>
    <p>This is a reminder that an auction you are watching or registered for (<strong>${auctionTitle}</strong>) will be starting soon!</p>
    
    <div class="details-box">
      <h3 style="margin-top: 0;">Auction Details</h3>
      <p><strong>Lot Number:</strong> ${lotNumber}</p>
      <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleString()}</p>
    </div>
    
    <p>Make sure to log in early to place your bids and secure this exclusive item.</p>
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/auction" class="btn">View Live Auctions</a>
  `;
  return generateEmailTemplate(`Reminder: Auction for ${auctionTitle} is starting soon`, content);
};

const auctionWinTemplate = (name, auctionTitle, lotNumber, winningBid, checkoutUrl) => {
  const content = `
    <h1>Congratulations! You Won an Auction!</h1>
    <p>Dear ${name},</p>
    <p>We are thrilled to inform you that you have won the auction for <strong>${auctionTitle}</strong>!</p>
    
    <div class="details-box">
      <h3 style="margin-top: 0;">Winning Details</h3>
      <p><strong>Lot Number:</strong> ${lotNumber}</p>
      <p><strong>Winning Bid:</strong> R${Number(winningBid).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
    </div>
    
    <p>To complete your purchase and arrange shipping, please proceed to checkout below.</p>
    <a href="${checkoutUrl}" class="btn">Proceed to Checkout</a>
  `;
  return generateEmailTemplate(`Congratulations! You won the auction for ${auctionTitle}`, content);
};

const bulkNewsletterTemplate = (subject, htmlContent) => {
  return generateEmailTemplate(subject, htmlContent);
};

const birthdayCelebrationEmailTemplate = ({
  name,
  discountEnabled = true,
  discountPercent = 15,
  promoCode = 'BDAY-LUXURY15',
  customMessage = '',
  storeUrl = process.env.CLIENT_URL || 'http://localhost:5173'
}) => {
  const celebrationMessage = customMessage || 'To commemorate another distinguished year, we invite you to indulge in South Africa’s finest reserve vintages, rare single malts, and hand-rolled artisanal cigars.';

  const discountBlock = discountEnabled ? `
    <div style="margin: 30px 0; padding: 25px; background: linear-gradient(145deg, #161410 0%, #0d0c0a 100%); border: 1px solid #c9a35b; border-radius: 12px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #c9a35b; font-weight: bold; display: block; margin-bottom: 8px;">Exclusive Birthday Privilege</span>
      <h2 style="font-family: 'Times New Roman', serif; font-size: 36px; color: #fff; margin: 0 0 8px 0; font-weight: normal; letter-spacing: 1px;">${discountPercent}% OFF</h2>
      <p style="font-size: 13px; color: #a0998f; margin: 0 0 18px 0;">Use the private code below at checkout on your next luxury order.</p>
      <div style="display: inline-block; padding: 12px 28px; background: #000; border: 1px dashed #c9a35b; border-radius: 8px; font-family: monospace; font-size: 20px; font-weight: bold; color: #f5d77f; letter-spacing: 3px;">
        ${promoCode}
      </div>
      <p style="font-size: 11px; color: #777; margin: 12px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Valid for 30 days from your birthday</p>
    </div>
  ` : `
    <div style="margin: 25px 0; padding: 20px; background: #12100d; border-left: 3px solid #c9a35b; border-radius: 4px;">
      <p style="font-style: italic; color: #d0c8be; margin: 0; font-size: 15px;">
        "May your year ahead be as exceptional and refined as the rare vintages resting in our private reserve."
      </p>
    </div>
  `;

  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <span style="font-size: 32px;">🍾 🥂 ✦</span>
      <h1 style="color: #c9a35b; font-size: 28px; font-family: 'Times New Roman', serif; margin: 15px 0 5px 0; letter-spacing: 1px;">Happy Birthday, ${name || 'Valued Member'}!</h1>
      <p style="color: #8c827a; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">A Celebration of Distinction</p>
    </div>

    <p style="font-size: 16px; line-height: 1.7; color: #ded8ce; margin-bottom: 20px;">
      On behalf of everyone at <strong>The Grand Store</strong>, we wish you a joyous and memorable birthday filled with fine company and unforgettable moments.
    </p>

    <p style="font-size: 15px; line-height: 1.7; color: #b8b0a4;">
      ${celebrationMessage}
    </p>

    ${discountBlock}

    <div style="margin: 35px 0 25px 0; text-align: center;">
      <a href="${storeUrl}" style="display: inline-block; background: linear-gradient(135deg, #c9a35b 0%, #e5a93c 100%); color: #0a0a0a; font-weight: bold; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 4px 20px rgba(201, 163, 91, 0.4);">
        Celebrate with The Grand Store &rarr;
      </a>
    </div>

    <div style="border-top: 1px solid #222; margin-top: 35px; padding-top: 20px; font-size: 12px; color: #666; text-align: center; line-height: 1.6;">
      <p style="margin: 0;">You are receiving this birthday greeting as a registered member of The Grand Store.</p>
      <p style="margin: 4px 0 0 0;">Strictly 18+ for wine, spirits, and tobacco products. Enjoy responsibly.</p>
    </div>
  `;

  return generateEmailTemplate(`Happy Birthday from The Grand Store! 🥂`, content);
};

module.exports = {
  welcomeEmailTemplate,
  verificationEmailTemplate,
  passwordResetTemplate,
  newsletterWelcomeTemplate,
  orderConfirmationTemplate,
  bankTransferInstructionsTemplate,
  eventBankTransferInstructionsTemplate,
  vendorApprovalTemplate,
  hostApplicationApprovalTemplate,
  hostApplicationRejectionTemplate,
  eventReminderTemplate,
  auctionReminderTemplate,
  auctionWinTemplate,
  bulkNewsletterTemplate,
  genericNotificationTemplate,
  birthdayCelebrationEmailTemplate,
};
