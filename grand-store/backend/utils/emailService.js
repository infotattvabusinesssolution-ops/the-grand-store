const nodemailer = require("nodemailer");
const { prepareEmailBranding } = require("./emailBranding");

/**
 * Configure the SMTP transporter.
 * Uses Hostinger SMTP (or custom provider from environment variables).
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
  };

  if (user && pass) {
    config.auth = { user, pass };
  }

  return config;
};

// Create main transporter
const defaultTransporter = nodemailer.createTransport(getTransporterConfig(""));

// Channel identities
const CHANNELS = {
  billing: {
    getEmail: () => process.env.BILLING_EMAIL || process.env.BILLING_SMTP_USER || process.env.SMTP_USER || "billing@grandstore.co.za",
    getName: () => process.env.BILLING_FROM_NAME || "The Grand Store Billing",
  },
  info: {
    getEmail: () => process.env.INFO_EMAIL || process.env.INFO_SMTP_USER || "info@grandstore.co.za",
    getName: () => process.env.INFO_FROM_NAME || process.env.SMTP_FROM_NAME || "The Grand Store Concierge",
  },
  vendor: {
    getEmail: () => process.env.VENDOR_EMAIL || process.env.VENDOR_SMTP_USER || "vendor@grandstore.co.za",
    getName: () => process.env.VENDOR_FROM_NAME || "The Grand Store Vendors",
  },
};

// Keywords for intelligent auto-detection when type is omitted
const BILLING_REGEX = /\b(order|invoice|receipt|billing|bank transfer|deposit|payment|refund|checkout|gift order|ticket)\b/i;
const VENDOR_REGEX = /\b(vendor|merchant|maintenance fee|registration fee|store activation|seller|host application|trial status|settlement|payout|partner portal)\b/i;

const resolveChannel = ({ type, channel, subject }) => {
  const explicit = (type || channel || "").toLowerCase().trim();
  if (explicit === "billing" || explicit === "purchase" || explicit === "order") return "billing";
  if (explicit === "vendor" || explicit === "merchant" || explicit === "host") return "vendor";
  if (explicit === "info" || explicit === "query" || explicit === "general" || explicit === "support") return "info";

  // Auto-detection based on subject keywords
  if (subject) {
    if (VENDOR_REGEX.test(subject)) return "vendor";
    if (BILLING_REGEX.test(subject)) return "billing";
  }
  return "info";
};

/**
 * Send an email with automatic or explicit routing to billing, info, or vendor channels.
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
 * @param {'billing'|'info'|'vendor'|'general'|'purchase'} [options.type] - Mail channel
 * @param {'billing'|'info'|'vendor'|'general'|'purchase'} [options.channel] - Mail channel alias
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

    const senderEmail = channelDef.getEmail();
    const senderName = fromName || channelDef.getName();
    const effectiveFrom = from || `"${senderName}" <${senderEmail}>`;
    const effectiveReplyTo = replyTo || senderEmail;

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

    const info = await defaultTransporter.sendMail(mailOptions);
    console.log(`[SMTP:${selectedChannel.toUpperCase()}] Message sent: ${info.messageId} to ${to} (From: ${effectiveFrom})`);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Email could not be sent: " + error.message);
  }
};

/** Direct helper for purchase, order, invoice & payment receipt emails */
const sendBillingEmail = (options) => sendEmail({ ...options, type: "billing" });

/** Direct helper for inquiries, customer queries, OTP, password reset & general emails */
const sendInfoEmail = (options) => sendEmail({ ...options, type: "info" });

/** Direct helper for vendor onboarding, maintenance fees & merchant alerts */
const sendVendorEmail = (options) => sendEmail({ ...options, type: "vendor" });

module.exports = {
  sendEmail,
  sendBillingEmail,
  sendInfoEmail,
  sendVendorEmail,
  resolveChannel,
  defaultTransporter,
};
