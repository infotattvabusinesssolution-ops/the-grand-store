const Product = require('../models/Product');
const Event = require('../models/Event');
const EstateProfile = require('../models/EstateProfile');
const AuctionLot = require('../models/AuctionLot');

const BASE_URL = process.env.CANONICAL_DOMAIN || 'https://grandstoreglobal.com';

let cachedSitemapXml = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // Cache for 1 hour

const escapeXml = (unsafe = '') => {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatDate = (date) => {
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/shop', priority: '0.9', changefreq: 'daily' },
  { path: '/tools/wine-pairing', priority: '0.9', changefreq: 'weekly' },
  { path: '/tools/whisky-finder', priority: '0.9', changefreq: 'weekly' },
  { path: '/global-wines', priority: '0.8', changefreq: 'weekly' },
  { path: '/winefarm', priority: '0.8', changefreq: 'weekly' },
  { path: '/events', priority: '0.8', changefreq: 'daily' },
  { path: '/auction', priority: '0.8', changefreq: 'daily' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/blogs', priority: '0.7', changefreq: 'weekly' },
  { path: '/cocktail', priority: '0.7', changefreq: 'weekly' },
  { path: '/glossary', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact-us', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },

  // Curated 'Best Of' Collections (Section 5)
  { path: '/collections/best-wines-under-300', priority: '0.85', changefreq: 'weekly' },
  { path: '/collections/best-wines-under-500', priority: '0.85', changefreq: 'weekly' },
  { path: '/collections/best-whisky-under-1000', priority: '0.85', changefreq: 'weekly' },
  { path: '/collections/best-south-african-red-wines', priority: '0.85', changefreq: 'weekly' },
  { path: '/collections/best-champagne-celebrations', priority: '0.85', changefreq: 'weekly' },

  // Wine Pairing Tool Landing Pages (Section 26)
  { path: '/tools/wine-pairing/beef', priority: '0.85', changefreq: 'weekly' },
  { path: '/tools/wine-pairing/seafood', priority: '0.85', changefreq: 'weekly' },
  { path: '/tools/wine-pairing/poultry', priority: '0.85', changefreq: 'weekly' },
  { path: '/tools/wine-pairing/vegetarian', priority: '0.85', changefreq: 'weekly' },
  { path: '/tools/wine-pairing/cheese', priority: '0.85', changefreq: 'weekly' },

  // Whisky Finder Landing Pages (Section 26)
  { path: '/tools/whisky-finder/smoky', priority: '0.85', changefreq: 'weekly' },
  { path: '/tools/whisky-finder/rich', priority: '0.85', changefreq: 'weekly' },
  { path: '/tools/whisky-finder/light', priority: '0.85', changefreq: 'weekly' },
  { path: '/tools/whisky-finder/fruity', priority: '0.85', changefreq: 'weekly' },

  // Brand & Distillery Landing Pages (Section 15)
  { path: '/brand/glenfiddich', priority: '0.85', changefreq: 'weekly' },
  { path: '/brand/macallan', priority: '0.85', changefreq: 'weekly' },
  { path: '/brand/hennessy', priority: '0.85', changefreq: 'weekly' },
  { path: '/brand/kanonkop', priority: '0.85', changefreq: 'weekly' },
  { path: '/brand/meerlust', priority: '0.85', changefreq: 'weekly' },
  { path: '/brand/don-julio', priority: '0.85', changefreq: 'weekly' },
  { path: '/brand/belvedere', priority: '0.85', changefreq: 'weekly' },
  { path: '/brand/moet-chandon', priority: '0.85', changefreq: 'weekly' },
  { path: '/brand/bains', priority: '0.85', changefreq: 'weekly' },
  { path: '/brand/kwv', priority: '0.85', changefreq: 'weekly' },

  // Country Wine Pavilions (Section 12)
  { path: '/global-wines/france', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/italy', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/spain', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/south-africa', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/united-states', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/argentina', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/chile', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/new-zealand', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/germany', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/portugal', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/canada', priority: '0.85', changefreq: 'weekly' },
  { path: '/global-wines/australia', priority: '0.85', changefreq: 'weekly' }
];

const getSitemapXml = async (req, res) => {
  const now = Date.now();
  if (cachedSitemapXml && now < cacheExpiresAt) {
    res.header('Content-Type', 'application/xml; charset=utf-8');
    return res.send(cachedSitemapXml);
  }

  try {
    const today = formatDate(now);

    // 1. Fetch live products with slugs
    const products = await Product.find({ isCatalogDuplicate: { $ne: true } })
      .select('slug id updatedAt')
      .lean();

    // 2. Fetch live events
    const events = await Event.find({ approvalStatus: { $ne: 'rejected' } })
      .select('slug _id updatedAt')
      .lean();

    // 3. Fetch live estates
    const estates = await EstateProfile.find({ isPublished: true })
      .select('slug updatedAt')
      .lean();

    // 4. Fetch auction lots (live + historical price guide)
    let auctionLots = [];
    try {
      auctionLots = await AuctionLot.find({ status: { $in: ['upcoming', 'live', 'extended', 'sold', 'closed', 'unsold'] } })
        .select('_id updatedAt')
        .lean();
    } catch (e) {
      console.warn('Could not fetch auction lots for sitemap:', e.message);
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static & Curated Tool/Collection Routes
    for (const route of STATIC_ROUTES) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${BASE_URL}${route.path}`)}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Dynamic Products
    for (const prod of products) {
      const identifier = prod.slug || prod.id;
      if (!identifier) continue;
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${BASE_URL}/product/${identifier}`)}</loc>\n`;
      xml += `    <lastmod>${formatDate(prod.updatedAt || now)}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Dynamic Events
    for (const ev of events) {
      const identifier = ev.slug || ev._id;
      if (!identifier) continue;
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${BASE_URL}/events/${identifier}`)}</loc>\n`;
      xml += `    <lastmod>${formatDate(ev.updatedAt || now)}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Dynamic Estates
    for (const est of estates) {
      if (!est.slug) continue;
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${BASE_URL}/estate/${est.slug}`)}</loc>\n`;
      xml += `    <lastmod>${formatDate(est.updatedAt || now)}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Dynamic Auction Lots (Active & Historical Price Guide)
    for (const lot of auctionLots) {
      if (!lot._id) continue;
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${BASE_URL}/auction/${lot._id}`)}</loc>\n`;
      xml += `    <lastmod>${formatDate(lot.updatedAt || now)}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    cachedSitemapXml = xml;
    cacheExpiresAt = now + CACHE_TTL_MS;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
};

module.exports = { getSitemapXml };
