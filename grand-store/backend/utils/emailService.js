const nodemailer = require("nodemailer");
const { prepareEmailBranding } = require("./emailBranding");

/**
 * Configure the SMTP transporter using environment variables.
 * For "normal mail" like Hostinger, Gmail, or standard SMTP providers,
 * you need to set these variables in your .env file.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.hostinger.com or smtp.gmail.com
  port: process.env.SMTP_PORT || 587, // usually 587 (TLS) or 465 (SSL)
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // your email address
    pass: process.env.SMTP_PASS, // your email password or app password
  },
});

/**
 * Send an email
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 * @param {string} [options.text] - Plain text fallback
 */
const sendEmail = async ({ to, bcc, subject, html, text, attachments, fromName, replyTo }) => {
  try {
    // Basic HTML to text conversion if text is not provided
    const plainText = text || (typeof html === 'string' ? html.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n').trim() : '');
    const brandedEmail = prepareEmailBranding(html, attachments);

    const mailOptions = {
      from: `"${fromName || process.env.SMTP_FROM_NAME || "The Grand Store"}" <${process.env.SMTP_USER}>`,
      to,
      bcc,
      replyTo,
      subject,
      text: plainText,
      html: brandedEmail.html,
      attachments: brandedEmail.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = {
  sendEmail,
};
