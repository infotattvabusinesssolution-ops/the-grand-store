const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Event = require('../models/Event');
const User = require('../models/User');

const EVENT_DATA = {
  title: 'Loch Lomond Whisky Tasting – 8 October 2026',
  slug: 'loch-lomond-whisky-tasting-8-october-2026',
  seoTitle: 'Loch Lomond Whisky Tasting | Exclusive Whisky Experience | The Grand Store',
  metaDescription: 'Join WhiskyShop & presenter Fortune Maseko for an exclusive Loch Lomond Single Malt tasting in Sandton, Johannesburg. Includes 5 whiskies, full bottle & food.',
  type: 'Whisky Experience',
  format: 'Physical',
  date: new Date('2026-10-29T00:00:00.000Z'),
  startTime: '18:00',
  endTime: '21:30',
  location: 'WhiskyShop Lounge, Sandton',
  city: 'Johannesburg',
  description: `Join WhiskyShop for an evening dedicated to Loch Lomond Whisky on 8 October 2026.

Presented by Fortune Maseko, this exclusive tasting gives whisky enthusiasts the opportunity to explore a selection of five Loch Lomond expressions, discovering the different styles, cask influences and character of each whisky.

### The Line-Up
Guests will taste five Loch Lomond expressions:
1. Loch Lomond Original Triple Cask
2. Loch Lomond Oloroso Sherry Cask
3. Loch Lomond Peated Rioja Cask
4. Loch Lomond Open Edition 2022 – 150th
5. Loch Lomond Open Edition 2026

### Your R750 Ticket Includes
- Tasting of five Loch Lomond whiskies
- A full bottle of Loch Lomond Original Single Malt to take home
- Artisanal food pairings
- Signature welcome drink on arrival
- Hosted presentation & masterclass by Fortune Maseko

Whether you're already a Loch Lomond fan or looking to discover more about the distillery and its range, this is an opportunity to experience several expressions side by side in one evening.

### Important Information
- This is strictly an 18+ event. Valid ID may be required.
- Arrival: 18:00 | Tasting starts: 18:30 sharp.
- Tickets are limited to 30 guests for an intimate seated experience.
- Contact / Inquiries: 065 933 7646 | events.whiskyshop.co.za`,
  hostName: 'Fortune Maseko',
  hostTitle: 'Whisky Presenter & Brand Ambassador',
  image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792156282/grandstore-uploads/events/loch-lomond-whisky-tasting-8-october-2026.jpg',
  capacity: 30,
  ticketTiers: [
    {
      name: 'Standard Ticket',
      price: 750,
      quantity: 30,
      sold: 0,
      reserved: 0,
      benefits: [
        'Tasting of 5 Loch Lomond single malt whiskies',
        'A full bottle of Loch Lomond Original Single Malt',
        'Artisanal food pairings',
        'Welcome drink on arrival',
        'Masterclass presentation by Fortune Maseko'
      ]
    }
  ],
  tastingJourney: [
    'Loch Lomond Original Triple Cask',
    'Loch Lomond Oloroso Sherry Cask',
    'Loch Lomond Peated Rioja Cask',
    'Loch Lomond Open Edition 2022 – 150th',
    'Loch Lomond Open Edition 2026'
  ],
  tastingProducts: [],
  approvalStatus: 'approved',
  approvalNote: 'Approved for public listing from WhiskyShop events portal',
  status: 'upcoming'
};

async function seed(options = {}) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    // Find host user or admin user
    const hostUser = await User.findOne({
      $or: [{ role: 'event_host' }, { role: 'vendor_active' }, { role: 'admin' }]
    }).lean();

    if (!hostUser) {
      throw new Error('No eligible user found to assign as event vendor/host');
    }

    const adminUser = await User.findOne({ role: 'admin' }).lean() || hostUser;

    const eventPayload = {
      ...EVENT_DATA,
      vendorId: hostUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date(),
    };

    if (options.date) {
      eventPayload.date = new Date(options.date);
    }

    // Upsert by slug
    const existing = await Event.findOne({ slug: eventPayload.slug });
    let result;
    if (existing) {
      result = await Event.findByIdAndUpdate(existing._id, eventPayload, { new: true });
      console.log('Updated existing event:', result._id, result.title);
    } else {
      result = await Event.create(eventPayload);
      console.log('Created new event:', result._id, result.title);
    }

    console.log('Event details:');
    console.log('- Slug:', result.slug);
    console.log('- Date:', result.date.toISOString().slice(0, 10));
    console.log('- Capacity:', result.capacity);
    console.log('- Ticket Price: R' + result.ticketTiers[0].price);
    console.log('- Lineup count:', result.tastingJourney.length);
    console.log('- Image URL:', result.image);
    console.log('- Approval Status:', result.approvalStatus);

    await mongoose.disconnect();
    return result;
  } catch (error) {
    console.error('Failed to seed Loch Lomond event:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  const customDateArg = process.argv[2];
  seed(customDateArg ? { date: customDateArg } : {});
}

module.exports = { seed, EVENT_DATA };
