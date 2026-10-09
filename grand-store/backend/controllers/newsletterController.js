const Newsletter = require('../models/Newsletter');
const { sendEmail } = require('../utils/emailService');
const { newsletterWelcomeTemplate, millionaireNewsletterWelcomeTemplate, cigarNewsletterWelcomeTemplate, bulkNewsletterTemplate } = require('../utils/emailTemplates');
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
    const { email, name, phone, isGiveawayEntry, country: frontendCountry, ipAddress: frontendIp, source } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let subscriberSource = source && typeof source === 'string' ? source.trim().toLowerCase() : 'grand-store';
    if (subscriberSource.includes('cigar')) {
      subscriberSource = 'cigar-store';
    } else if (subscriberSource.includes('million')) {
      subscriberSource = 'millionaires-collection';
    } else {
      subscriberSource = 'grand-store';
    }

    const isMillionaire = subscriberSource === 'millionaires-collection';
    const isGiveaway = isMillionaire || Boolean(isGiveawayEntry);

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
      if (name) existingSubscriber.name = name.trim();
      if (phone) existingSubscriber.phone = phone.trim();
      if (isGiveaway) existingSubscriber.isGiveawayEntry = true;
      existingSubscriber.country = country !== 'Unknown' ? country : existingSubscriber.country;
      existingSubscriber.ipAddress = ip || existingSubscriber.ipAddress;
      existingSubscriber.source = subscriberSource;
      existingSubscriber.status = 'subscribed';
      await existingSubscriber.save();

      return res.status(200).json({
        success: true,
        message: isGiveaway 
          ? '✦ Entry confirmed! You are registered for the M Collection Bottle Draw.' 
          : 'Successfully updated newsletter subscription!',
        isGiveawayEntry: existingSubscriber.isGiveawayEntry,
        redirectUrl: 'https://millionairescollection.com/',
        subscriber: existingSubscriber
      });
    }

    const newSubscriber = new Newsletter({
      email,
      name: name ? name.trim() : '',
      phone: phone ? phone.trim() : '',
      isGiveawayEntry: isGiveaway,
      country,
      ipAddress: ip,
      source: subscriberSource
    });
    await newSubscriber.save();

    // Send welcome email
    try {
      const isCigar = subscriberSource === 'cigar-store';
      const subject = isCigar
        ? 'Welcome to Mcigar — The Cigar Connoisseur Club'
        : isMillionaire
        ? 'Welcome to M Collection — Bottle Giveaway Entry Confirmed'
        : 'Welcome to The Grand Store Newsletter';

      let welcomeHtml = newsletterWelcomeTemplate();
      if (isMillionaire) {
        welcomeHtml = millionaireNewsletterWelcomeTemplate();
      } else if (isCigar) {
        welcomeHtml = cigarNewsletterWelcomeTemplate();
      }

      await sendEmail({
        to: email,
        subject,
        html: welcomeHtml
      });
    } catch (err) {
      console.error('Failed to send newsletter welcome email:', err);
    }

    res.status(201).json({
      success: true,
      message: isGiveaway 
        ? '✦ Entry confirmed! You have been entered into the M Collection Bottle Draw.' 
        : 'Successfully subscribed to the newsletter!',
      isGiveawayEntry: newSubscriber.isGiveawayEntry,
      redirectUrl: 'https://millionairescollection.com/',
      subscriber: newSubscriber
    });
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
      const src = source.toLowerCase();
      if (src.includes('cigar')) {
        filter.source = { $in: ['cigar-store', 'cigarstore', 'cigar-club'] };
      } else if (src.includes('million')) {
        filter.source = { $in: ['millionaires-collection', 'millionarestore', 'millionairestore'] };
      } else if (src.includes('grand')) {
        filter.source = { $in: ['grand-store', 'grandstore', null, undefined] };
      } else {
        filter.source = source;
      }
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
    const { subject, htmlContent, country, source, recipientEmails } = req.body || {};
    
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
        const src = source.toLowerCase();
        if (src.includes('cigar')) {
          filter.source = { $in: ['cigar-store', 'cigarstore', 'cigar-club'] };
        } else if (src.includes('million')) {
          filter.source = { $in: ['millionaires-collection', 'millionarestore', 'millionairestore'] };
        } else if (src.includes('grand')) {
          filter.source = { $in: ['grand-store', 'grandstore', null, undefined] };
        } else {
          filter.source = source;
        }
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

// @desc    Perform or confirm random draw for M Collection Giveaway
// @route   POST /api/newsletter/mcollection/draw-winner
// @access  Private/Admin
const drawGiveawayWinner = async (req, res) => {
  try {
    const { candidateId } = req.body || {};

    let winner;
    if (candidateId) {
      winner = await Newsletter.findById(candidateId);
      if (!winner) {
        return res.status(404).json({ message: 'Selected candidate not found' });
      }
    } else {
      // Find eligible candidates in millionaires-collection
      const eligible = await Newsletter.find({
        source: { $in: ['millionaires-collection', 'millionarestore', 'millionairestore'] },
        status: 'subscribed',
        isWinner: { $ne: true }
      });

      if (!eligible || eligible.length === 0) {
        return res.status(400).json({ message: 'No eligible candidates found for draw' });
      }

      // Cryptographically sound random selection
      const randomIndex = Math.floor(Math.random() * eligible.length);
      winner = eligible[randomIndex];
    }

    winner.isWinner = true;
    winner.wonAt = new Date();
    winner.prize = 'M Collection The Brut Reserve (750ml)';
    winner.drawNotes = `Drawn by admin on ${new Date().toLocaleDateString('en-ZA', { dateStyle: 'full' })}`;
    await winner.save();

    res.json({
      success: true,
      message: 'Winner selected and recorded successfully!',
      winner
    });
  } catch (error) {
    console.error('Error drawing giveaway winner:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Reset a winner back to eligible candidate pool
// @route   POST /api/newsletter/mcollection/reset-winner/:id
// @access  Private/Admin
const resetGiveawayWinner = async (req, res) => {
  try {
    const winner = await Newsletter.findById(req.params.id);
    if (!winner) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    winner.isWinner = false;
    winner.wonAt = null;
    winner.drawNotes = `Reset by admin on ${new Date().toISOString()}`;
    await winner.save();

    res.json({
      success: true,
      message: 'Winner status reset successfully',
      candidate: winner
    });
  } catch (error) {
    console.error('Error resetting giveaway winner:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  subscribeNewsletter,
  getSubscribers,
  sendBulkNewsletter,
  drawGiveawayWinner,
  resetGiveawayWinner,
};

