const { emailLogoHeader } = require('./emailBranding');

const BRAND_COLOR_GOLD = '#c9a35b';
const BRAND_COLOR_DARK = '#050505';
const BRAND_COLOR_LIGHT = '#f5f5f5';

const formatRand = (amount) => `R ${Number(amount || 0).toFixed(2)}`;

const generateEmailTemplate = (title, content) => {
  return `
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
    .content {
      padding: 35px 25px;
      line-height: 1.6;
      font-size: 15px;
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
      margin: 25px 0;
    }
    .details-box {
      background-color: #111;
      border: 1px solid #333;
      padding: 20px;
      margin: 20px 0;
      border-radius: 6px;
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
    ${emailLogoHeader()}
    <div class="content">
      ${content}
      <br><br>
      Best Regards,<br>
      <strong style="color: ${BRAND_COLOR_GOLD}">The Grand Store Team</strong>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} The Grand Store. All rights reserved.</p>
      <p>If you have any questions, please contact our concierge team at support@grandstoreglobal.com.</p>
    </div>
  </div>
</body>
</html>
  `;
};

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
  const orderReference = order.invoiceNumber || order.orderId || order._id;
  const isPostNet = order.deliveryPreference === 'postnet' || Boolean(order.selectedPostnetStore?.name);
  const courierName = isPostNet
    ? `PostNet Store Collection (${order.selectedPostnetStore?.name || 'Local Branch'})`
    : (order.shipments?.[0]?.selectedCourier?.serviceLevel || order.shipments?.[0]?.selectedCourier?.courierName || 'Door Delivery (Courier Guy / PostNet)');

  const subTotal = Number(order.subTotal || order.subtotal || 0);
  const shippingCost = Number(order.shippingCost || order.shippingFee || 0);
  const totalPrice = Number(order.totalPrice || order.total || 0);

  // 15% South African VAT calculation (Inclusive)
  const vatAmount = Number(order.vatAmount !== undefined && order.vatAmount > 0 
    ? order.vatAmount 
    : (subTotal > 0 ? (subTotal * (15 / 115)).toFixed(2) : 0));
  const subTotalExclVat = Math.max(0, Number((subTotal - vatAmount).toFixed(2)));

  const itemsList = order.orderItems || order.items || [];
  const itemsHtml = itemsList.map(item => {
    const qty = Number(item.quantity || item.qty || 1);
    const unitPrice = Number(item.price || 0);
    const lineTotal = unitPrice * qty;
    const itemImg = item.image 
      ? `<img src="${item.image}" alt="${item.name}" width="48" height="48" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid #333; margin-right: 12px; vertical-align: middle;" />`
      : '';

    return `
      <tr style="border-bottom: 1px solid #222;">
        <td style="padding: 12px 8px 12px 0; vertical-align: middle;">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              ${itemImg ? `<td style="vertical-align: middle; padding-right: 10px;">${itemImg}</td>` : ''}
              <td style="vertical-align: middle;">
                <div style="font-weight: bold; color: #fff; font-size: 14px;">${item.name}</div>
                ${item.option ? `<div style="font-size: 12px; color: #999; margin-top: 2px;">Option: ${item.option}</div>` : ''}
                ${item.category ? `<div style="font-size: 11px; color: ${BRAND_COLOR_GOLD}; margin-top: 2px;">${item.category}</div>` : ''}
              </td>
            </tr>
          </table>
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #ccc; vertical-align: middle; font-size: 13px;">${qty}</td>
        <td style="padding: 12px 8px; text-align: right; color: #ccc; vertical-align: middle; font-size: 13px;">${formatRand(unitPrice)}</td>
        <td style="padding: 12px 0 12px 8px; text-align: right; font-weight: bold; color: #fff; vertical-align: middle; font-size: 14px;">${formatRand(lineTotal)}</td>
      </tr>
    `;
  }).join('');

  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <h1 style="margin-bottom: 6px;">Order & Payment Confirmation</h1>
      <p style="margin: 0; font-size: 14px; color: #a0a0a0;">Official Tax Invoice & Purchase Receipt</p>
      <div style="display: inline-block; margin-top: 10px; padding: 5px 16px; border-radius: 20px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
        ✓ Payment Verified & Confirmed
      </div>
    </div>

    <p>Dear ${order.guestInfo?.name || order.shippingAddress?.recipientName || 'Valued Customer'},</p>
    <p>Thank you for choosing The Grand Store. We are pleased to confirm that your payment for order <strong>#${orderReference}</strong> has been successfully processed. Your order receipt is itemized below, and an official PDF Tax Invoice is attached to this email.</p>

    <!-- INVOICE METADATA TABLE -->
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #0e0e0e; border: 1px solid #222; border-radius: 6px; font-size: 13px;">
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: #888; width: 40%;">Invoice Reference:</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: ${BRAND_COLOR_GOLD}; font-weight: bold; font-family: monospace; font-size: 14px;">${orderReference}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: #888;">Order Date:</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: #eee;">${new Date(order.createdAt || Date.now()).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: #888;">Payment Method:</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #1a1a1a; color: #eee;">${order.paymentMethod || 'Instant EFT / Card (PayFast)'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; color: #888;">Delivery Method:</td>
        <td style="padding: 10px 14px; color: #eee; font-weight: 500;">${courierName}</td>
      </tr>
    </table>

    <!-- PRODUCT RECEIPT TABLE -->
    <div class="details-box">
      <h3 style="margin-top: 0; font-size: 16px; border-bottom: 1px solid #222; padding-bottom: 10px;">Itemized Products</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #333; color: ${BRAND_COLOR_GOLD}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
            <th style="padding: 8px 8px 8px 0; text-align: left;">Product</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
            <th style="padding: 8px 0 8px 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- FINANCIAL SUMMARY & TAX BREAKDOWN -->
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 15px; border-top: 1px solid #333;">
        <tr>
          <td style="padding: 10px 0 4px; color: #aaa;">Products Subtotal (Excl. VAT):</td>
          <td style="padding: 10px 0 4px; text-align: right; color: #ddd;">${formatRand(subTotalExclVat)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #aaa;">South African VAT (15% Included):</td>
          <td style="padding: 4px 0; text-align: right; color: ${BRAND_COLOR_GOLD};">${formatRand(vatAmount)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #aaa; font-weight: 500;">Products Subtotal (Incl. VAT):</td>
          <td style="padding: 4px 0; text-align: right; color: #fff; font-weight: 500;">${formatRand(subTotal)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #aaa;">Shipping & Logistics (${order.deliveryPreference === 'postnet' ? 'PostNet Branch' : 'Courier Door'}):</td>
          <td style="padding: 4px 0; text-align: right; color: #ddd;">${shippingCost > 0 ? formatRand(shippingCost) : '<span style="color: #34d399; font-weight: bold;">FREE</span>'}</td>
        </tr>
        ${order.appliedWelcomeDiscount > 0 ? `
        <tr>
          <td style="padding: 4px 0; color: #34d399;">Welcome Promotion Discount:</td>
          <td style="padding: 4px 0; text-align: right; color: #34d399;">- ${formatRand(order.appliedWelcomeDiscount)}</td>
        </tr>
        ` : ''}
        ${order.superCoinsDiscount > 0 ? `
        <tr>
          <td style="padding: 4px 0; color: #fbbf24;">Super Coins Redeemed (${order.superCoinsUsed || 0} Coins):</td>
          <td style="padding: 4px 0; text-align: right; color: #fbbf24;">- ${formatRand(order.superCoinsDiscount)}</td>
        </tr>
        ` : ''}
        ${order.importDuties > 0 ? `
        <tr>
          <td style="padding: 4px 0; color: #aaa;">Estimated Import Duties & Customs:</td>
          <td style="padding: 4px 0; text-align: right; color: #ddd;">${formatRand(order.importDuties + (order.customsFees || 0))}</td>
        </tr>
        ` : ''}
        <tr style="border-top: 2px solid ${BRAND_COLOR_GOLD};">
          <td style="padding: 14px 0 4px; font-weight: bold; color: ${BRAND_COLOR_GOLD}; font-size: 16px;">
            Grand Total Paid:
            <div style="font-size: 11px; color: #888; font-weight: normal; margin-top: 2px;">Inclusive of all 15% VAT, duties & taxes</div>
          </td>
          <td style="padding: 14px 0 4px; text-align: right; font-weight: bold; color: ${BRAND_COLOR_GOLD}; font-size: 20px;">
            ${formatRand(totalPrice)}
          </td>
        </tr>
      </table>
    </div>

    <!-- DELIVERY / COLLECTION DESTINATION CARD -->
    <div class="details-box">
      <h3 style="margin-top: 0; font-size: 15px; color: ${BRAND_COLOR_GOLD};">
        ${isPostNet ? '🏬 PostNet Collection Point' : '📍 Delivery Address'}
      </h3>
      ${isPostNet && order.selectedPostnetStore ? `
        <p style="font-size: 14px; font-weight: bold; color: #fff; margin: 4px 0;">${order.selectedPostnetStore.name}</p>
        <p style="font-size: 13px; color: #bbb; margin: 2px 0;">${order.selectedPostnetStore.address}</p>
        <p style="font-size: 13px; color: #bbb; margin: 2px 0;">${order.selectedPostnetStore.city || ''} ${order.selectedPostnetStore.postalCode || ''}</p>
        ${order.selectedPostnetStore.telephone ? `<p style="font-size: 12px; color: #888; margin: 4px 0;">Branch Tel: ${order.selectedPostnetStore.telephone}</p>` : ''}
      ` : `
        <p style="font-size: 14px; color: #fff; margin: 4px 0;">${order.shippingAddress?.address || ''}</p>
        <p style="font-size: 13px; color: #bbb; margin: 2px 0;">${order.shippingAddress?.city || ''}, ${order.shippingAddress?.postalCode || ''}</p>
        <p style="font-size: 13px; color: #bbb; margin: 2px 0;">${order.shippingAddress?.country || 'South Africa'}</p>
      `}
    </div>

    ${order.isGift ? `
    <!-- GIFT DELIVERY CARD -->
    <div class="details-box" style="border-left: 4px solid ${BRAND_COLOR_GOLD}; background: #161208; margin-top: 15px;">
      <h3 style="margin-top: 0; color: ${BRAND_COLOR_GOLD}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        🎁 Complimentary Gift Delivery
      </h3>
      ${order.giftRecipientName ? `<p style="margin: 4px 0; font-size: 13px; color: #fff;"><strong>Recipient:</strong> ${order.giftRecipientName}</p>` : ''}
      ${order.giftMessage ? `<p style="margin: 8px 0 2px 0; font-size: 13px; color: #ddd; font-style: italic; background: #0c0a06; padding: 10px; border-radius: 6px; border: 1px dashed rgba(201, 163, 91, 0.3);">"${order.giftMessage}"</p>` : ''}
    </div>
    ` : ''}

    <!-- NOTIFICATIONS & PIN BOX -->
    <div class="details-box" style="border-left: 4px solid ${BRAND_COLOR_GOLD}; background: #14120c; margin-top: 15px;">
      <h3 style="margin-top: 0; color: ${BRAND_COLOR_GOLD}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        📦 Waybill Tracking & Collection Alerts
      </h3>
      <p style="margin-bottom: 8px; font-size: 13px; color: #ccc;">
        Real-time dispatch tracking, SMS delivery PINs, and courier status updates are registered to:
      </p>
      <p style="margin: 3px 0; font-size: 13px;">
        ✉️ <strong>Email:</strong> ${order.guestInfo?.email || order.shippingAddress?.email || (order.user?.email) || 'On file'}
      </p>
      <p style="margin: 3px 0; font-size: 13px;">
        📱 <strong>Phone / SMS:</strong> ${order.guestInfo?.phone || order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || (order.user?.phone) || 'On file'}
      </p>
    </div>

    <div style="background-color: #0d131a; border: 1px solid #1e293b; border-radius: 6px; padding: 14px; margin-top: 20px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
      📄 <strong>Tax Invoice PDF Attached:</strong> Your formal South African tax invoice (VAT compliant) is attached to this email. You can retain or print it for accounting and proof of purchase.
    </div>
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

const auctionWinTemplate = (name, auctionTitle, lotNumber, winningBid, checkoutUrl, options = {}) => {
  const certRef = options.gsReference || `GS-AUC-LOT${lotNumber}-${Date.now().toString().slice(-6)}`;
  const certDownloadUrl = options.certDownloadUrl || `${checkoutUrl}`;
  const hammerPriceFormatted = Number(winningBid).toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  const currentDate = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <!-- Top Imperial Congratulations Banner -->
    <div style="text-align: center; margin-bottom: 25px;">
      <span style="font-size: 32px; display: block; margin-bottom: 8px;">🏆 ✦ 📜</span>
      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 4px; color: #c9a35b; font-weight: bold; display: block; margin-bottom: 6px;">
        Imperial Acquisition Award • The Grand Store
      </span>
      <h1 style="color: #ffffff; font-size: 26px; font-family: 'Times New Roman', serif; margin: 0 0 10px 0; letter-spacing: 1px;">
        Auction Gavel Won: Certificate Awarded
      </h1>
      <p style="color: #a39c91; font-size: 14px; margin: 0; line-height: 1.6;">
        Distinguished Patron <strong>${name || 'Collector'}</strong>, the auction hammer has officially fallen in your favor. Full title and ownership registry have been awarded to your account.
      </p>
    </div>

    <!-- Official Certificate of Acquisition Box -->
    <div style="margin: 25px 0; padding: 25px 20px; background-color: #0b0a08; border: 2px solid #c9a35b; border-radius: 12px; position: relative; box-shadow: 0 15px 45px rgba(0,0,0,0.8);">
      
      <!-- Watermark Background Simulation -->
      <div style="text-align: center; padding-bottom: 15px; border-bottom: 1px solid rgba(201, 163, 91, 0.25);">
        <div style="font-family: 'Times New Roman', serif; font-size: 28px; font-weight: bold; color: rgba(201, 163, 91, 0.18); letter-spacing: 6px; text-transform: uppercase;">
          THE GRAND STORE
        </div>
        <div style="font-size: 9px; letter-spacing: 3px; color: rgba(201, 163, 91, 0.22); text-transform: uppercase; margin-top: 2px;">
          • OFFICIAL VAULT ARCHIVE • CERTIFIED AUTHENTIC PROVENANCE •
        </div>
      </div>

      <!-- Seal and Certificate Heading -->
      <div style="text-align: center; margin: 20px 0 15px 0;">
        <div style="display: inline-block; padding: 5px 16px; border: 1px solid #c9a35b; border-radius: 20px; background: rgba(201, 163, 91, 0.12); color: #f5d77f; font-size: 10px; font-weight: bold; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 10px;">
          ✦ OFFICIAL CERTIFICATE OF ACQUISITION ✦
        </div>
        <h2 style="font-family: 'Times New Roman', serif; font-size: 22px; color: #f5d77f; margin: 5px 0; font-weight: normal; letter-spacing: 1px;">
          Certificate of Provenance & Transfer
        </h2>
        <div style="font-family: monospace; font-size: 11px; color: #8c827a; letter-spacing: 1px;">
          REGISTRY REF: ${certRef}
        </div>
      </div>

      <!-- Proclamation Text -->
      <p style="font-family: 'Times New Roman', serif; font-style: italic; text-align: center; color: #ded8ce; font-size: 14px; line-height: 1.6; margin: 15px auto; max-width: 480px;">
        "This instrument certifies that legal title to the singular masterpiece described herein has been transferred to the verified winning patron under South African CPA Section 45 Escrow Trust provisions."
      </p>

      <!-- Specifications Grid -->
      <div style="background-color: #12100d; border: 1px solid #2a251b; border-radius: 8px; padding: 18px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #8c827a; width: 40%; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Catalogue Lot:</td>
            <td style="padding: 6px 0; color: #f5d77f; font-weight: bold; font-family: monospace;">LOT #${lotNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8c827a; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Masterpiece Title:</td>
            <td style="padding: 6px 0; color: #ffffff; font-weight: bold;">${auctionTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8c827a; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Winning Hammer Bid:</td>
            <td style="padding: 6px 0; color: #c9a35b; font-weight: bold; font-size: 16px;">R ${hammerPriceFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8c827a; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Recorded Patron:</td>
            <td style="padding: 6px 0; color: #ded8ce; font-weight: bold;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8c827a; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Date of Hammer Fall:</td>
            <td style="padding: 6px 0; color: #ded8ce;">${currentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8c827a; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">Statutory Escrow:</td>
            <td style="padding: 6px 0; color: #10b981; font-size: 12px;">✓ 100% CPA Section 45 Protected</td>
          </tr>
        </table>
      </div>

      <!-- Signatures Representation -->
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center; border-top: 1px solid #222; padding-top: 15px;">
        <tr>
          <td style="width: 50%; padding: 12px 10px; vertical-align: top;">
            <div style="font-family: 'Times New Roman', serif; font-style: italic; color: #ded8ce; font-size: 15px; margin-bottom: 4px;">
              Julian Vance-Montgomery
            </div>
            <div style="height: 1px; width: 80%; background-color: #c9a35b; margin: 0 auto 4px auto;"></div>
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #c9a35b; font-weight: bold;">
              Curator of Acquisitions
            </div>
            <div style="font-size: 9px; color: #777;">Grand Store Vaults</div>
          </td>
          <td style="width: 50%; padding: 12px 10px; vertical-align: top;">
            <div style="font-family: 'Times New Roman', serif; font-style: italic; color: #ded8ce; font-size: 15px; margin-bottom: 4px;">
              Eleanor St. Claire
            </div>
            <div style="height: 1px; width: 80%; background-color: #c9a35b; margin: 0 auto 4px auto;"></div>
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #c9a35b; font-weight: bold;">
              Chief Escrow Registrar
            </div>
            <div style="font-size: 9px; color: #777;">CPA Section 45 Division</div>
          </td>
        </tr>
      </table>

      <!-- Attachment Notice Badge -->
      <div style="margin-top: 18px; padding: 10px; background-color: rgba(16, 185, 129, 0.08); border: 1px dashed rgba(16, 185, 129, 0.35); border-radius: 6px; text-align: center;">
        <span style="font-size: 12px; color: #6ee7b7;">
          📎 <strong>Official PDF Attached:</strong> Your high-resolution, print-ready Certificate of Acquisition is attached to this email.
        </span>
      </div>

    </div>

    <!-- Action Buttons -->
    <div style="margin: 30px 0 20px 0; text-align: center;">
      <a href="${checkoutUrl}" style="display: inline-block; background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%); color: #0a0a0a; font-weight: bold; text-decoration: none; padding: 15px 32px; border-radius: 8px; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 6px 25px rgba(212, 175, 55, 0.4); margin: 6px 4px;">
        Complete Vault Settlement & Checkout &rarr;
      </a>
      ${certDownloadUrl ? `
      <a href="${certDownloadUrl}" style="display: inline-block; background-color: #1a1712; color: #f5d77f; border: 1px solid #c9a35b; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; margin: 6px 4px;">
        📜 Download PDF Certificate
      </a>
      ` : ''}
    </div>

    <p style="font-size: 12px; color: #777; text-align: center; margin-top: 25px; line-height: 1.5;">
      In compliance with the South African Consumer Protection Act, all auction acquisitions must be settled within the statutory window. For white-glove logistics assistance, contact curatorial@grandstoreglobal.com.
    </p>
  `;
  return generateEmailTemplate(`Official Certificate of Acquisition: ${auctionTitle}`, content);
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

const eventTicketConfirmationTemplate = ({ booking, event, user, qrCodeDataUrl, qrCodeCid }) => {
  const eventDateFormatted = new Date(event.date).toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const qrImageSrc = qrCodeCid || 'cid:ticketqrcode';

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #c9a35b; font-weight: bold; display: block; margin-bottom: 6px;">Official Access Pass</span>
      <h1 style="color: #c9a35b; font-size: 26px; font-family: 'Times New Roman', serif; margin: 0 0 10px 0; letter-spacing: 1px;">VIP EVENT TICKET CONFIRMED</h1>
      <p style="color: #a0998f; font-size: 14px; margin: 0;">Dear ${user?.name || 'Grand Member'}, your reservation is active and secured with The Grand Store Vault.</p>
    </div>

    <!-- TICKET PASS CARD -->
    <div style="background: linear-gradient(145deg, #14120e 0%, #0d0c0a 100%); border: 2px solid #c9a35b; border-radius: 12px; padding: 25px; margin: 25px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
      <div style="border-bottom: 1px dashed rgba(201, 163, 91, 0.4); padding-bottom: 18px; margin-bottom: 20px; text-align: center;">
        <span style="font-size: 10px; color: #c9a35b; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Grand Store Private Reserve Experience</span>
        <h2 style="color: #ffffff; font-size: 22px; font-family: 'Times New Roman', serif; margin: 8px 0 0 0;">${event.title}</h2>
      </div>

      <!-- EVENT METRICS -->
      <table style="width: 100%; margin-bottom: 20px; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #888; width: 35%;">DATE:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${eventDateFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888;">TIME:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${event.startTime || '18:00 Doors Open'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888;">VENUE:</td>
          <td style="padding: 8px 0; color: #ffffff; font-weight: bold;">${event.location || 'The Grand Store Private Cellars'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888;">PASS TIER:</td>
          <td style="padding: 8px 0; color: #f5d77f; font-weight: bold;">${booking.ticketType} &times; ${booking.quantity}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888;">TICKET ID:</td>
          <td style="padding: 8px 0; color: #f5d77f; font-family: monospace; font-size: 15px; font-weight: bold;">${booking.ticketId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888;">TOTAL PAID:</td>
          <td style="padding: 8px 0; color: #4ade80; font-weight: bold; font-size: 16px;">R ${Number(booking.totalPrice || 0).toLocaleString('en-ZA')}</td>
        </tr>
      </table>

      <!-- REAL QR CODE CONTAINER -->
      <div style="background-color: #050505; border: 1px solid rgba(201,163,91,0.3); border-radius: 8px; padding: 20px; text-align: center; margin-top: 15px;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #c9a35b; margin: 0 0 14px 0; font-weight: bold;">Official Cellar Admission QR</p>
        <div style="display: inline-block; padding: 8px; background-color: #ffffff; border: 3px solid #c9a35b; border-radius: 10px;">
          <img src="${qrImageSrc}" alt="VIP Ticket QR Code" width="180" height="180" style="display: block; width: 180px; height: 180px; margin: 0 auto; border: 0;" />
        </div>
        <p style="font-size: 12px; color: #ccc; margin: 12px 0 0 0; font-weight: 500;">Present this QR code on arrival for instant white-glove cellar admission.</p>
        <p style="font-size: 11px; color: #c9a35b; margin: 6px 0 0 0;">✨ Your official printable VIP Pass PDF is attached to this email.</p>
      </div>
    </div>

    <!-- NOTICE -->
    <div style="background-color: #12100d; border-left: 3px solid #c9a35b; padding: 16px; margin: 25px 0; font-size: 13px; color: #c2bbb0; line-height: 1.6;">
      <strong>Cellar Protocol:</strong> Tasting experiences commence promptly. Strictly 18+ for entry. Smart elegant attire recommended.
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <p style="font-size: 12px; color: #666; margin: 0;">The Grand Store • South Africa's Premier Fine Wine, Spirits & Tobacco Merchant</p>
    </div>
  `;

  return generateEmailTemplate(`Your VIP Event Ticket Pass - ${event.title}`, content);
};


const adminOrderMessageEmailTemplate = ({
  customerName,
  orderReference,
  message,
  type = 'info',
  storeUrl = 'https://grandstoreglobal.com'
}) => {
  const badgeConfig = {
    emergency: { text: '🚨 Critical Priority Notice', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', color: '#f87171' },
    stock_issue: { text: '📦 Stock & Fulfilment Advisory', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' },
    warning: { text: '⚠️ Delivery Notice', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' },
    info: { text: '✨ Concierge Update', bg: 'rgba(201, 151, 66, 0.15)', border: 'rgba(201, 151, 66, 0.4)', color: '#f5c242' }
  };
  const badge = badgeConfig[type] || badgeConfig.info;

  const content = `
    <div style="text-align: center; margin-bottom: 25px;">
      <h1 style="margin-bottom: 6px;">Order Advisory Notice</h1>
      <p style="margin: 0; font-size: 14px; color: #a0a0a0;">Regarding your order #${orderReference}</p>
      <div style="display: inline-block; margin-top: 10px; padding: 5px 16px; border-radius: 20px; background: ${badge.bg}; border: 1px solid ${badge.border}; color: ${badge.color}; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">
        ${badge.text}
      </div>
    </div>

    <p>Dear ${customerName || 'Valued Customer'},</p>
    <p>Our concierge team has an important message regarding your purchase of order <strong>#${orderReference}</strong>:</p>

    <div style="background-color: #12100e; border: 1px solid ${BRAND_COLOR_GOLD}55; border-left: 4px solid ${badge.color}; padding: 20px; margin: 25px 0; border-radius: 6px;">
      <p style="font-size: 15px; line-height: 1.6; color: #fff; margin: 0; white-space: pre-line;">${message}</p>
    </div>

    <p style="font-size: 14px; color: #aaa;">You can also view this live update and track your order anytime directly inside your <a href="${storeUrl}/customer/orders" style="color: ${BRAND_COLOR_GOLD}; font-weight: bold;">My Orders</a> dashboard.</p>
    <div style="text-align: center; margin-top: 25px;">
      <a href="${storeUrl}/customer/orders" class="btn">View My Orders</a>
    </div>
  `;

  return generateEmailTemplate(`Important Update regarding Order #${orderReference}`, content);
};

const giftOrderAdminNotificationTemplate = (order) => {
  const orderRef = order.invoiceNumber || order.orderId || order._id;
  const buyerName = order.guestInfo?.name || order.shippingAddress?.name || (order.user && order.user.name) || 'Customer';
  const buyerEmail = order.guestInfo?.email || order.shippingAddress?.email || (order.user && order.user.email) || 'N/A';
  const buyerPhone = order.guestInfo?.phone || order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || (order.user && order.user.phone) || 'N/A';
  const recipientName = order.giftRecipientName || 'Not Specified';
  const giftMessage = order.giftMessage || 'No personal message provided';
  const isPostNet = order.deliveryPreference === 'postnet' || Boolean(order.selectedPostnetStore);
  const items = order.orderItems || order.items || [];

  const itemsList = items.map(it => `
    <li style="margin-bottom: 6px; color: #ddd;">
      <strong>${Number(it.quantity || it.qty || 1)}x</strong> ${it.name} ${it.option ? `(${it.option})` : ''} - ${formatRand(it.price || 0)}
    </li>
  `).join('');

  const destinationHtml = isPostNet && order.selectedPostnetStore ? `
    <p style="margin: 3px 0; color: #fff;"><strong>PostNet Branch:</strong> ${order.selectedPostnetStore.name}</p>
    <p style="margin: 3px 0; color: #bbb;">${order.selectedPostnetStore.address}</p>
    <p style="margin: 3px 0; color: #bbb;">${order.selectedPostnetStore.city || ''} ${order.selectedPostnetStore.postalCode || ''}</p>
  ` : `
    <p style="margin: 3px 0; color: #fff;">${order.shippingAddress?.address || 'Address on file'}</p>
    <p style="margin: 3px 0; color: #bbb;">${order.shippingAddress?.city || ''}, ${order.shippingAddress?.postalCode || ''}</p>
    <p style="margin: 3px 0; color: #bbb;">${order.shippingAddress?.country || 'South Africa'}</p>
  `;

  const content = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: ${BRAND_COLOR_GOLD}; margin-bottom: 4px;">🎁 Special Gift Order Alert</h1>
      <p style="color: #bbb; font-size: 14px; margin: 0;">Order #${orderRef} requires luxury gift wrapping and card enclosure</p>
    </div>

    <div class="details-box" style="border-left: 4px solid #f59e0b; background: #18140c; margin-bottom: 20px;">
      <h3 style="margin-top: 0; color: ${BRAND_COLOR_GOLD}; font-size: 15px; text-transform: uppercase; letter-spacing: 1px;">
        🎁 Gift Recipient & Message Card
      </h3>
      <p style="font-size: 14px; margin: 6px 0; color: #fff;">
        <strong>Recipient Name:</strong> <span style="color: #fcd34d; font-weight: bold; font-size: 15px;">${recipientName}</span>
      </p>
      <div style="margin-top: 10px; background: #0c0a06; padding: 14px; border-radius: 6px; border: 1px dashed rgba(201, 163, 91, 0.4);">
        <div style="font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 5px;">Personalized Card Message to Print / Handwrite:</div>
        <div style="font-size: 14px; color: #fff; font-style: italic; line-height: 1.5;">"${giftMessage}"</div>
      </div>
    </div>

    <div class="details-box" style="margin-bottom: 20px;">
      <h3 style="margin-top: 0; font-size: 14px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">
        Buyer / Billing Customer
      </h3>
      <p style="margin: 3px 0; color: #eee;"><strong>Name:</strong> ${buyerName}</p>
      <p style="margin: 3px 0; color: #eee;"><strong>Email:</strong> ${buyerEmail}</p>
      <p style="margin: 3px 0; color: #eee;"><strong>Phone:</strong> ${buyerPhone}</p>
      <p style="margin: 3px 0; color: #eee;"><strong>Payment Method:</strong> ${order.paymentMethod || 'Instant Card / EFT'}</p>
      <p style="margin: 3px 0; color: #eee;"><strong>Payment Status:</strong> <span style="color: ${order.isPaid ? '#10b981' : '#f59e0b'}; font-weight: bold;">${order.isPaid ? 'PAID' : 'PENDING'}</span></p>
    </div>

    <div class="details-box" style="margin-bottom: 20px;">
      <h3 style="margin-top: 0; font-size: 14px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">
        Delivery Destination
      </h3>
      ${destinationHtml}
    </div>

    <div class="details-box" style="margin-bottom: 25px;">
      <h3 style="margin-top: 0; font-size: 14px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">
        Items in this Gift Parcel
      </h3>
      <ul style="padding-left: 20px; margin: 5px 0;">
        ${itemsList}
      </ul>
      <p style="margin-top: 10px; font-size: 14px; color: ${BRAND_COLOR_GOLD}; font-weight: bold;">
        Order Total: ${formatRand(order.totalPrice || order.total || 0)}
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders/${order._id}" class="btn" style="background: linear-gradient(135deg, #c9a35b 0%, #b58b38 100%); color: #000; font-weight: bold;">
        Open Order in Admin Portal
      </a>
    </div>
  `;

  return generateEmailTemplate(`Gift Order Alert #${orderRef}`, content);
};

const vendorMaintenanceFeePaidTemplate = ({
  vendorName = 'Vendor Partner',
  businessName = '',
  amount = 500,
  paymentMethod = 'PayFast / Card',
  reference = '',
  paidAt = new Date(),
  nextDueAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
}) => {
  const formattedPaidAt = new Date(paidAt).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const formattedNextDue = new Date(nextDueAt).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const content = `
    <h1>Monthly Maintenance Fee Receipt</h1>
    <p>Dear ${vendorName},</p>
    <p>Thank you for your payment. Your recurring monthly platform maintenance fee for <strong>${businessName || 'your storefront'}</strong> has been received and cleared. Your storefront, catalog listings, and order fulfillment remain fully active.</p>
    
    <div class="details-box" style="margin: 24px 0; padding: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(201, 163, 91, 0.3); border-radius: 8px;">
      <h3 style="margin-top: 0; color: ${BRAND_COLOR_GOLD}; font-size: 15px; letter-spacing: 1px; text-transform: uppercase;">Payment Receipt</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 12px;">
        <tr>
          <td style="padding: 8px 0; color: #888;">Transaction Reference:</td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; color: #fff; font-weight: bold;">${reference}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888;">Amount Paid:</td>
          <td style="padding: 8px 0; text-align: right; color: ${BRAND_COLOR_GOLD}; font-weight: bold; font-size: 16px;">R ${Number(amount).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888;">Payment Method:</td>
          <td style="padding: 8px 0; text-align: right; color: #eee;">${paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #888;">Payment Date:</td>
          <td style="padding: 8px 0; text-align: right; color: #eee;">${formattedPaidAt}</td>
        </tr>
        <tr style="border-top: 1px solid rgba(255,255,255,0.1);">
          <td style="padding: 10px 0 0; color: #aaa; font-weight: 500;">Next Renewal Due Date:</td>
          <td style="padding: 10px 0 0; text-align: right; color: #55efc4; font-weight: bold;">${formattedNextDue}</td>
        </tr>
      </table>
    </div>
    
    <p style="color: #aaa; font-size: 13px; line-height: 1.5;">
      Your active listing and merchant privileges are extended for the next 30 days. You can review your transaction history, statements, and payouts anytime in your Vendor Dashboard.
    </p>

    <div style="text-align: center; margin-top: 25px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/vendor/dashboard" class="btn">View Vendor Dashboard</a>
    </div>
  `;

  return generateEmailTemplate('Monthly Vendor Maintenance Fee Receipt', content);
};

const paymentFailedEmailTemplate = ({ customerName, reference, itemName, amount, retryUrl, reason }) => {
  const content = `
    <h1 style="color: #ff7675; margin-bottom: 8px;">Payment Unsuccessful</h1>
    <p style="font-size: 15px; color: #ddd; margin-top: 0;">
      Dear ${customerName || 'Valued Patron'},
    </p>
    <p style="color: #bbb; line-height: 1.6;">
      We wanted to let you know that your recent payment attempt for <strong>${itemName || 'your selection'}</strong> was not completed.
    </p>

    <div style="background-color: rgba(255, 118, 117, 0.08); border: 1px solid rgba(255, 118, 117, 0.25); border-radius: 8px; padding: 18px 20px; margin: 25px 0;">
      <p style="margin: 0 0 8px 0; color: #ff7675; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
        🛡️ No Funds Have Been Debited
      </p>
      <p style="margin: 0; color: #ccc; font-size: 13px; line-height: 1.5;">
        ${reason || 'The transaction was cancelled or could not be verified by the payment gateway. No funds were debited from your account.'}
      </p>
    </div>

    <div class="details-box">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #888;">Reference:</td>
          <td style="padding: 6px 0; text-align: right; font-family: monospace; color: ${BRAND_COLOR_GOLD}; font-weight: bold;">${reference || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #888;">Item / Service:</td>
          <td style="padding: 6px 0; text-align: right; color: #eee;">${itemName || 'Grand Store Order'}</td>
        </tr>
        ${amount ? `
        <tr>
          <td style="padding: 6px 0; color: #888;">Amount:</td>
          <td style="padding: 6px 0; text-align: right; color: #fff; font-weight: bold;">${formatRand(amount)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 6px 0; color: #888;">Status:</td>
          <td style="padding: 6px 0; text-align: right; color: #ff7675; font-weight: bold;">Cancelled / Unpaid</td>
        </tr>
      </table>
    </div>

    <p style="color: #bbb; line-height: 1.6; font-size: 14px;">
      You can safely retry your payment whenever you are ready. If you need any assistance, our concierge team is always at your service.
    </p>

    ${retryUrl ? `
    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="${retryUrl}" class="btn" style="background-color: ${BRAND_COLOR_GOLD}; color: #000; padding: 14px 32px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">
        Retry Payment Now
      </a>
    </div>
    ` : ''}

    <div class="divider"></div>

    <p style="font-size: 12px; color: #777; margin-bottom: 0;">
      Need help completing your acquisition? Contact us at <a href="mailto:concierge@grandstoreglobal.com" style="color: ${BRAND_COLOR_GOLD};">concierge@grandstoreglobal.com</a> or message our VIP Concierge on WhatsApp at +27 76 580 9522.
    </p>
  `;

  return generateEmailTemplate('Payment Unsuccessful Notice', content);
};

module.exports = {
  generateEmailTemplate,
  welcomeEmailTemplate,
  verificationEmailTemplate,
  passwordResetTemplate,
  newsletterWelcomeTemplate,
  orderConfirmationTemplate,
  paymentFailedEmailTemplate,
  bankTransferInstructionsTemplate,
  eventBankTransferInstructionsTemplate,
  vendorApprovalTemplate,
  vendorMaintenanceFeePaidTemplate,
  hostApplicationApprovalTemplate,
  hostApplicationRejectionTemplate,
  eventReminderTemplate,
  auctionReminderTemplate,
  auctionWinTemplate,
  bulkNewsletterTemplate,
  genericNotificationTemplate,
  birthdayCelebrationEmailTemplate,
  eventTicketConfirmationTemplate,
  adminOrderMessageEmailTemplate,
  giftOrderAdminNotificationTemplate,
};
