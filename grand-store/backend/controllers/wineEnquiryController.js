const WineEnquiry = require('../models/WineEnquiry');
const { getNextSequence } = require('../utils/sequenceGenerator');
const { sendEmail } = require('../utils/emailService');
const {
  wineEnquiryAcknowledgementTemplate,
  wineEnquiryReplyTemplate,
} = require('../utils/wineEmailTemplates');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = ['new', 'open', 'replied', 'closed'];
const VALID_CONTACT_METHODS = ['email', 'phone', 'whatsapp'];
const WINE_SITE_URL = (process.env.MILLIONAIRES_SITE_URL || 'https://millionaires.yogapranafitness.com').replace(/\/$/, '');

const clean = (value, maxLength = 500) => String(value ?? '').trim().slice(0, maxLength);

const createEnquiry = async (req, res) => {
  try {
    // Bot honeypot check
    if (req.body.website) {
      return res.status(201).json({ success: true, message: 'Thank you. Your enquiry has been received.' });
    }

    const customerName = clean(req.body.customerName || req.body.name, 120);
    const email = clean(req.body.email, 180).toLowerCase();
    const phone = clean(req.body.phone, 40);
    const referral = clean(req.body.referral, 240);
    const message = clean(req.body.message, 3000);
    const preferredContact = VALID_CONTACT_METHODS.includes(req.body.preferredContact) ? req.body.preferredContact : 'email';
    const rawQuantity = Number(req.body.quantity);
    const quantity = Number.isInteger(rawQuantity) && rawQuantity >= 1 && rawQuantity <= 10000 ? rawQuantity : 1;

    const product = req.body.product || {};
    const productName = clean(product.name || req.body.productName, 240) || 'Millionaires Collection — 2021 Limited Edition';
    const productExpression = clean(product.expression || req.body.expression, 180) || 'The 2021 Limited Edition';

    if (!customerName || !EMAIL_PATTERN.test(email) || !phone) {
      return res.status(400).json({ message: 'Enter a valid name, email address, and phone number.' });
    }

    const sequence = await getNextSequence('wineEnquiry');
    const reference = `MLN-${new Date().getFullYear()}-${String(sequence).padStart(6, '0')}`;

    const enquiry = await WineEnquiry.create({
      reference,
      customerName,
      email,
      phone,
      referral,
      message,
      quantity,
      preferredContact,
      product: {
        name: productName,
        expression: productExpression,
        image: clean(product.image, 1000) || '/assets/footer-bottle.png',
        pageUrl: WINE_SITE_URL,
      },
    });

    try {
      await sendEmail({
        to: enquiry.email,
        subject: `We received your Millionaires Collection enquiry — ${enquiry.reference}`,
        html: wineEnquiryAcknowledgementTemplate(enquiry),
        fromName: 'Millionaires Collection Concierge',
        replyTo: process.env.WINE_REPLY_TO || process.env.SMTP_USER,
      });
      enquiry.acknowledgement = { sent: true, sentAt: new Date(), error: '' };
    } catch (emailError) {
      console.error('Millionaires Collection enquiry acknowledgement email failed:', emailError);
      enquiry.acknowledgement = { sent: false, error: clean(emailError.message, 500) };
    }
    await enquiry.save();

    return res.status(201).json({
      success: true,
      message: 'Thank you for your enquiry. Our collection team will be in touch shortly.',
      reference: enquiry.reference,
      acknowledgementSent: enquiry.acknowledgement.sent,
    });
  } catch (error) {
    console.error('Error creating Millionaires Collection enquiry:', error);
    return res.status(500).json({ message: 'Your enquiry could not be submitted. Please try again.' });
  }
};

const listEnquiries = async (req, res) => {
  try {
    const filter = {};
    if (VALID_STATUSES.includes(req.query.status)) filter.status = req.query.status;
    if (req.query.search) {
      const search = clean(req.query.search, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { referral: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } },
        { 'product.expression': { $regex: search, $options: 'i' } },
      ];
    }

    const [enquiries, counts] = await Promise.all([
      WineEnquiry.find(filter).sort({ createdAt: -1 }).lean(),
      WineEnquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    return res.json({
      success: true,
      data: enquiries,
      counts: counts.reduce((result, item) => ({ ...result, [item._id]: item.count }), {}),
    });
  } catch (error) {
    console.error('Error listing Millionaires Collection enquiries:', error);
    return res.status(500).json({ message: 'Unable to load wine enquiries.' });
  }
};

const getEnquiry = async (req, res) => {
  try {
    const enquiry = await WineEnquiry.findById(req.params.id).populate('replies.sentBy', 'name email');
    if (!enquiry) return res.status(404).json({ message: 'Wine enquiry not found.' });

    if (enquiry.status === 'new') {
      enquiry.status = 'open';
      enquiry.firstViewedAt = new Date();
      await enquiry.save();
    }
    return res.json(enquiry);
  } catch (error) {
    if (error.name === 'CastError') return res.status(404).json({ message: 'Wine enquiry not found.' });
    return res.status(500).json({ message: 'Unable to load this wine enquiry.' });
  }
};

const replyToEnquiry = async (req, res) => {
  const subject = clean(req.body.subject, 180).replace(/\r?\n/g, ' ');
  const message = clean(req.body.message, 5000);
  if (!subject || !message) {
    return res.status(400).json({ message: 'A subject and response message are required.' });
  }

  try {
    const enquiry = await WineEnquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Wine enquiry not found.' });

    try {
      await sendEmail({
        to: enquiry.email,
        subject,
        html: wineEnquiryReplyTemplate(enquiry, { subject, message }),
        fromName: 'Millionaires Collection Concierge',
        replyTo: process.env.WINE_REPLY_TO || process.env.SMTP_USER,
      });
    } catch (emailError) {
      enquiry.replies.push({
        subject,
        message,
        sentBy: req.user._id,
        sentByName: req.user.name,
        deliveryStatus: 'failed',
        error: clean(emailError.message, 500),
      });
      await enquiry.save();
      await enquiry.populate('replies.sentBy', 'name email');
      return res.status(502).json({
        message: 'The response was saved, but the email could not be delivered. Check the mail configuration and try again.',
        enquiry,
      });
    }

    enquiry.replies.push({
      subject,
      message,
      sentBy: req.user._id,
      sentByName: req.user.name,
      deliveryStatus: 'sent',
    });
    enquiry.status = 'replied';
    enquiry.lastResponseAt = new Date();
    enquiry.closedAt = undefined;
    await enquiry.save();
    await enquiry.populate('replies.sentBy', 'name email');
    return res.json({ message: `Response emailed to ${enquiry.email}.`, enquiry });
  } catch (error) {
    console.error('Error replying to wine enquiry:', error);
    return res.status(500).json({ message: 'The response could not be sent.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    if (!VALID_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid enquiry status.' });
    }
    const enquiry = await WineEnquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Wine enquiry not found.' });

    enquiry.status = req.body.status;
    enquiry.closedAt = req.body.status === 'closed' ? new Date() : undefined;
    if (req.body.status === 'open' && !enquiry.firstViewedAt) enquiry.firstViewedAt = new Date();
    await enquiry.save();
    return res.json({ message: `Enquiry marked ${req.body.status}.`, enquiry });
  } catch (error) {
    return res.status(500).json({ message: 'The enquiry status could not be updated.' });
  }
};

module.exports = {
  createEnquiry,
  listEnquiries,
  getEnquiry,
  replyToEnquiry,
  updateStatus,
};
