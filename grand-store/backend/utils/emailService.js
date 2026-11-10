const nodemailer = require("nodemailer");
const { prepareEmailBranding } = require("./emailBranding");

/**
 * Configure the SMTP transporter options.
 * Supports individual prefixes (e.g. NOREPLY, SUPPORT, VENDOR, AUCTION, INFO)
 * or defaults to master Hostinger SMTP configuration.
 */
const getTransporterConfig = (prefix = "") => {
  const host = (prefix && process.env[`${prefix}_SMTP_HOST`]) || process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = parseInt((prefix && process.env[`${prefix}_SMTP_PORT`]) || process.env.SMTP_PORT || 465, 10);
  const secureEnv = prefix ? process.env[`${prefix}_SMTP_SECURE`] : process.env.SMTP_SECURE;
  const secure = secureEnv !== undefined ? (secureEnv === "true" || secureEnv === true) : port === 465;
  const user = (prefix && process.env[`${prefix}_SMTP_USER`]) || process.env.SMTP_USER;
  const pass = (prefix && process.env[`${prefix}_SMTP_PASS`]) || process.env.SMTP_PASS;

  const config = {
    host,
    port,
    secure,
    tls: {
      rejectUnauthorized: false
    }
  };

  if (user && pass) {
    config.auth = { user, pass };
  }

  return config;
};

// Transporter pool cache to reuse SMTP socket connections
const transporterPool = new Map();

const getTransporter = (prefix = "") => {
  const key = (prefix || "DEFAULT").toUpperCase();
  if (!transporterPool.has(key)) {
    const cfg = getTransporterConfig(prefix);
    const transporter = nodemailer.createTransport(cfg);
    transporterPool.set(key, transporter);
  }
  return transporterPool.get(key);
};

// Default transporter for backward compatibility
const defaultTransporter = getTransporter("INFO");

// Channel identities and their associated SMTP configurations
const CHANNELS = {
  auth: {
    prefix: "NOREPLY",
    fallbackPrefix: "INFO",
    getEmail: () => process.env.NOREPLY_SMTP_USER || "no-reply@grandstoreglobal.com",
    getName: () => process.env.NOREPLY_FROM_NAME || "The Grand Store Security",
  },
  billing: {
    prefix: "SUPPORT",
    fallbackPrefix: "INFO",
    getEmail: () => process.env.SUPPORT_SMTP_USER || process.env.BILLING_EMAIL || "support@grandstoreglobal.com",
    getName: () => process.env.SUPPORT_FROM_NAME || process.env.BILLING_FROM_NAME || "The Grand Store Support",
  },
  support: {
    prefix: "SUPPORT",
    fallbackPrefix: "INFO",
    getEmail: () => process.env.SUPPORT_SMTP_USER || "support@grandstoreglobal.com",
    getName: () => process.env.SUPPORT_FROM_NAME || "The Grand Store Support",
  },
  vendor: {
    prefix: "VENDOR",
    fallbackPrefix: "INFO",
    getEmail: () => process.env.VENDOR_SMTP_USER || "vendor@grandstoreglobal.com",
    getName: () => process.env.VENDOR_FROM_NAME || "The Grand Store Vendors",
  },
  auction: {
    prefix: "AUCTION",
    fallbackPrefix: "INFO",
    getEmail: () => process.env.AUCTION_SMTP_USER || "auction@grandstoreglobal.com",
    getName: () => process.env.AUCTION_FROM_NAME || "The Grand Store Auction Vault",
  },
  trade: {
    get prefix() {
      return process.env.TRADE_SMTP_PASS ? "TRADE" : "SUPPORT";
    },
    fallbackPrefix: "SUPPORT",
    getEmail: () => (process.env.TRADE_SMTP_PASS ? (process.env.TRADE_SMTP_USER || "trade@grandstoreglobal.com") : (process.env.SUPPORT_SMTP_USER || "support@grandstoreglobal.com")),
    getName: () => process.env.TRADE_FROM_NAME || "The Grand Store Trade & Export",
  },
  marketing: {
    get prefix() {
      return process.env.MARKETING_SMTP_PASS ? "MARKETING" : "INFO";
    },
    fallbackPrefix: "INFO",
    getEmail: () => (process.env.MARKETING_SMTP_PASS ? (process.env.MARKETING_SMTP_USER || "marketing@grandstoreglobal.com") : (process.env.INFO_SMTP_USER || "info@grandstoreglobal.com")),
    getName: () => process.env.MARKETING_FROM_NAME || "The Grand Store",
  },
  info: {
    prefix: "INFO",
    fallbackPrefix: "DEFAULT",
    getEmail: () => process.env.INFO_SMTP_USER || process.env.SMTP_USER || "info@grandstoreglobal.com",
    getName: () => process.env.INFO_FROM_NAME || process.env.SMTP_FROM_NAME || "The Grand Store Concierge",
  },
};

// Keywords for auto-detection when explicit channel type is omitted
const AUTH_REGEX = /\b(otp|one-time password|verification code|verify.*email|magic link|reset.*password|security alert)\b/i;
const AUCTION_REGEX = /\b(auction|bid|outbid|winning lot|lot won|hammer price|reserve price|vip guarantee deposit|vip bidding)\b/i;
const BILLING_REGEX = /\b(order|invoice|receipt|billing|bank transfer|deposit|payment|refund|checkout|gift order|ticket)\b/i;
const VENDOR_REGEX = /\b(vendor|merchant|maintenance fee|registration fee|store activation|seller|host application|trial status|settlement|payout|partner portal)\b/i;
const TRADE_REGEX = /\b(trade|export|rfq|wholesale|b2b container)\b/i;
const MARKETING_REGEX = /\b(newsletter|promotional blast|exclusive drop)\b/i;

const resolveChannel = ({ type, channel, subject }) => {
  const explicit = (type || channel || "").toLowerCase().trim();
  if (explicit === "auth" || explicit === "security" || explicit === "noreply" || explicit === "no-reply" || explicit === "otp") return "auth";
  if (explicit === "billing" || explicit === "purchase" || explicit === "order" || explicit === "invoice" || explicit === "receipt") return "billing";
  if (explicit === "support" || explicit === "help" || explicit === "service") return "support";
  if (explicit === "vendor" || explicit === "merchant" || explicit === "host") return "vendor";
  if (explicit === "auction" || explicit === "bid" || explicit === "vault") return "auction";
  if (explicit === "trade" || explicit === "export" || explicit === "b2b") return "trade";
  if (explicit === "marketing" || explicit === "newsletter" || explicit === "promo") return "marketing";
  if (explicit === "info" || explicit === "query" || explicit === "general" || explicit === "concierge") return "info";

  // Auto-detection based on subject keywords
  if (subject) {
    if (AUTH_REGEX.test(subject)) return "auth";
    if (AUCTION_REGEX.test(subject)) return "auction";
    if (VENDOR_REGEX.test(subject)) return "vendor";
    if (BILLING_REGEX.test(subject)) return "billing";
    if (TRADE_REGEX.test(subject)) return "trade";
    if (MARKETING_REGEX.test(subject)) return "marketing";
  }
  return "info";
};

/**
 * Send an email with automatic or explicit routing to the designated Hostinger channel.
 * Each channel utilizes its own authenticated SMTP transporter to strictly satisfy
 * Hostinger's anti-spoofing policy (From address must match authenticated mailbox).
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.bcc] - Optional BCC address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text fallback
 * @param {Array} [options.attachments] - Attachments array
 * @param {string} [options.fromName] - Custom sender display name override
 * @param {string} [options.from] - Full From address override
 * @param {string} [options.replyTo] - Custom Reply-To override
 * @param {'auth'|'billing'|'support'|'vendor'|'auction'|'trade'|'marketing'|'info'} [options.type] - Mail channel
 * @param {'auth'|'billing'|'support'|'vendor'|'auction'|'trade'|'marketing'|'info'} [options.channel] - Mail channel alias
 */
const sendEmail = async ({
  to,
  bcc,
  subject,
  html,
  text,
  attachments,
  fromName,
  from,
  replyTo,
  type,
  channel,
  skipBranding = false,
  isPlainTextOnly = false,
}) => {
  try {
    const selectedChannel = resolveChannel({ type, channel, subject });
    const channelDef = CHANNELS[selectedChannel] || CHANNELS.info;

    // Resolve channel sender & transporter
    const senderEmail = channelDef.getEmail();
    const senderName = fromName || channelDef.getName();
    const effectiveFrom = from || `"${senderName}" <${senderEmail}>`;
    const effectiveReplyTo = replyTo || senderEmail;

    // Pick channel transporter
    const prefix = channelDef.prefix;
    const transporter = (prefix && process.env[`${prefix}_SMTP_PASS`])
      ? getTransporter(prefix)
      : (channelDef.fallbackPrefix ? getTransporter(channelDef.fallbackPrefix) : defaultTransporter);

    const plainText = text || (typeof html === "string" ? html.replace(/<[^>]+>/g, "\n").replace(/\n\s*\n/g, "\n").trim() : "");
    const emailPayload = skipBranding ? { html, attachments: attachments || [] } : prepareEmailBranding(html, attachments);

    const mailOptions = {
      from: effectiveFrom,
      to,
      ...(bcc ? { bcc } : {}),
      replyTo: effectiveReplyTo,
      subject,
      text: plainText,
      ...(isPlainTextOnly || !emailPayload.html ? {} : { html: emailPayload.html }),
      ...(emailPayload.attachments && emailPayload.attachments.length > 0 ? { attachments: emailPayload.attachments } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP:${selectedChannel.toUpperCase()}] Message sent: ${info.messageId} to ${to} (From: ${effectiveFrom})`);
    return info;
  } catch (error) {
    console.error(`[SMTP:ERROR] Failed to send email to ${to}:`, error.message);
    throw new Error("Email could not be sent: " + error.message);
  }
};

/** Direct helper for purchase, order, invoice & payment receipt emails */
const sendBillingEmail = (options) => sendEmail({ ...options, type: "billing" });

/** Direct helper for inquiries, customer queries & general concierge emails */
const sendInfoEmail = (options) => sendEmail({ ...options, type: "info" });

/** Direct helper for vendor onboarding, maintenance fees & merchant alerts */
const sendVendorEmail = (options) => sendEmail({ ...options, type: "vendor" });

/** Direct helper for auction bids, outbid notices & winning lot alerts */
const sendAuctionEmail = (options) => sendEmail({ ...options, type: "auction" });

/** Direct helper for one-time passwords, email verification & password resets */
const sendAuthEmail = (options) => sendEmail({ ...options, type: "auth" });

/** Direct helper for international trade enquiries & export RFQs */
const sendTradeEmail = (options) => sendEmail({ ...options, type: "trade" });

/** Direct helper for newsletters & promotional broadcasts */
const sendMarketingEmail = (options) => sendEmail({ ...options, type: "marketing" });

module.exports = {
  sendEmail,
  sendBillingEmail,
  sendInfoEmail,
  sendVendorEmail,
  sendAuctionEmail,
  sendAuthEmail,
  sendTradeEmail,
  sendMarketingEmail,
  resolveChannel,
  CHANNELS,
  getTransporter,
  defaultTransporter,
};
