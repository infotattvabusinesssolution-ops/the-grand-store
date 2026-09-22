const Newsletter = require('../models/Newsletter');
const { sendEmail } = require('../utils/emailService');
const { newsletterWelcomeTemplate, millionaireNewsletterWelcomeTemplate, bulkNewsletterTemplate } = require('../utils/emailTemplates');
const geoip = require('geoip-lite');
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

const getCountryName = (countryCode) => {
  try {
    return countryNames.of(countryCode) || countryCode;
  } catch (e) {
    return countryCode;
  }
};

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
const subscribeNewsletter = async (req, res) => {
  try {
    const { email, country: frontendCountry, ipAddress: frontendIp, source } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const subscriberSource = source && typeof source === 'string' ? source.trim() : 'grand-store';

    let ip = frontendIp && frontendIp !== 'Unknown' ? frontendIp : (
             req.headers['cf-connecting-ip'] || 
             req.headers['x-real-ip'] || 
             req.headers['x-forwarded-for'] || 
             req.ip || 
             req.socket.remoteAddress);

    if (ip && typeof ip === 'string' && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    if (ip && ip.startsWith('::ffff:')) {
      ip = ip.replace('::ffff:', '');
    }

    let country = frontendCountry && frontendCountry !== 'Unknown' ? frontendCountry : 'Unknown';
    if (country === 'Unknown') {
      const geo = geoip.lookup(ip);
      country = geo ? getCountryName(geo.country) : 'Unknown';
    }

    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
      if (existingSubscriber.status === 'unsubscribed') {
        existingSubscriber.status = 'subscribed';
        existingSubscriber.country = country;
        existingSubscriber.ipAddress = ip;
        existingSubscriber.source = subscriberSource;
        await existingSubscriber.save();
        return res.status(200).json({ message: 'Successfully re-subscribed to the newsletter!' });
      }
      return res.status(400).json({ message: 'Email is already subscribed' });
    }

    const newSubscriber = new Newsletter({ email, country, ipAddress: ip, source: subscriberSource });
    await newSubscriber.save();

    // Send welcome email
    try {
      const isMillionaire = subscriberSource === 'millionaires-collection';
      await sendEmail({
        to: email,
        subject: isMillionaire ? 'Welcome to the Millionaires Collection' : 'Welcome to The Grand Store Newsletter',
        html: isMillionaire ? millionaireNewsletterWelcomeTemplate() : newsletterWelcomeTemplate()
      });
    } catch (err) {
      console.error('Failed to send newsletter welcome email:', err);
    }

    res.status(201).json({ message: 'Successfully subscribed to the newsletter!' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all newsletter subscribers
// @route   GET /api/newsletter/subscribers
// @access  Private/Admin
const getSubscribers = async (req, res) => {
  try {
    const { country, source, search } = req.query;
    const filter = {};
    if (country && country !== 'All') {
      filter.country = country;
    }
    if (source && source !== 'All') {
      filter.source = source;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { email: regex },
        { country: regex },
        { ipAddress: regex },
        { source: regex }
      ];
    }
    const subscribers = await Newsletter.find(filter).sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Send bulk newsletter
// @route   POST /api/newsletter/send
// @access  Private/Admin
const sendBulkNewsletter = async (req, res) => {
  try {
    const { subject, htmlContent, country, source, recipientEmails } = req.body;
    
    if (!subject || !htmlContent) {
      return res.status(400).json({ message: 'Subject and HTML content are required' });
    }

    let emails = [];

    if (Array.isArray(recipientEmails) && recipientEmails.length > 0) {
      emails = [...new Set(recipientEmails.map(e => String(e).trim().toLowerCase()).filter(Boolean))];
    } else {
      const filter = { status: 'subscribed' };
      if (country && country !== 'All') {
        filter.country = country;
      }
      if (source && source !== 'All') {
        filter.source = source;
      }

      const subscribers = await Newsletter.find(filter);

      if (subscribers.length === 0) {
        return res.status(400).json({ message: 'No active subscribers found for this filter' });
      }

      emails = subscribers.map(sub => sub.email);
    }

    if (emails.length === 0) {
      return res.status(400).json({ message: 'No recipients selected for newsletter' });
    }

    try {
      await sendEmail({
        to: process.env.SMTP_USER || emails[0],
        bcc: emails.join(','),
        subject,
        html: bulkNewsletterTemplate(subject, htmlContent)
      });
    } catch (err) {
      console.error(`Failed to send bulk newsletter batch:`, err);
      return res.status(500).json({ message: 'Failed to send newsletter. SMTP error: ' + (err.message || 'Delivery failed') });
    }

    res.json({ message: `Newsletter sent successfully to ${emails.length} subscriber${emails.length > 1 ? 's' : ''}` });
  } catch (error) {
    console.error('Error sending bulk newsletter:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  subscribeNewsletter,
  getSubscribers,
  sendBulkNewsletter,
};
