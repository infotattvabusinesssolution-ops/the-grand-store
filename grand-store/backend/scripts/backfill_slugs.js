require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Event = require('../models/Event');
const { slugify } = require('../utils/slugify');

async function backfill() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is missing in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    // 1. Backfill Products
    const products = await Product.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });

    console.log(`Found ${products.length} products needing slug generation.`);
    let productUpdated = 0;
    const existingSlugs = new Set((await Product.find({ slug: { $exists: true, $ne: null } }).select('slug').lean()).map(p => p.slug));

    for (const prod of products) {
      let baseSlug = slugify(prod.name || `product-${prod.id}`);
      if (!baseSlug) baseSlug = `product-${prod.id}`;

      let uniqueSlug = baseSlug;
      let counter = 1;
      while (existingSlugs.has(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      prod.slug = uniqueSlug;
      if (!prod.seoTitle) {
        prod.seoTitle = `${prod.name} | Buy Online | The Grand Store`;
      }
      if (!prod.metaDescription) {
        prod.metaDescription = `Buy ${prod.name} online at The Grand Store. Fast delivery across South Africa.`;
      }

      await prod.save();
      existingSlugs.add(uniqueSlug);
      productUpdated++;
    }

    console.log(`Successfully updated ${productUpdated} products with SEO slugs.`);

    // 2. Backfill Events
    const events = await Event.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });

    console.log(`Found ${events.length} events needing slug generation.`);
    let eventUpdated = 0;
    const existingEventSlugs = new Set((await Event.find({ slug: { $exists: true, $ne: null } }).select('slug').lean()).map(e => e.slug));

    for (const ev of events) {
      let baseSlug = slugify(ev.title || `event-${ev._id}`);
      if (!baseSlug) baseSlug = `event-${ev._id}`;

      let uniqueSlug = baseSlug;
      let counter = 1;
      while (existingEventSlugs.has(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      ev.slug = uniqueSlug;
      if (!ev.seoTitle) {
        ev.seoTitle = `${ev.title} | Wine & Whisky Events | The Grand Store`;
      }
      if (!ev.metaDescription) {
        ev.metaDescription = `Join us for ${ev.title}. Reserve your tickets online at The Grand Store.`;
      }

      await ev.save();
      existingEventSlugs.add(uniqueSlug);
      eventUpdated++;
    }

    console.log(`Successfully updated ${eventUpdated} events with SEO slugs.`);
    console.log('Slug backfill complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error during slug backfill:', error);
    process.exit(1);
  }
}

backfill();
