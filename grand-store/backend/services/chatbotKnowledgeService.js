const Product = require('../models/Product');
const Glossary = require('../models/Glossary');
const Event = require('../models/Event');
const AuctionLot = require('../models/AuctionLot');
const EstateProfile = require('../models/EstateProfile');

const SITE_ORIGIN = process.env.PUBLIC_SITE_URL || 'https://grandstoreglobal.com';
const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || '+27765809522';
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'all', 'an', 'and', 'any', 'are', 'below', 'can', 'could',
  'detail', 'details', 'do', 'does', 'for', 'from', 'give', 'have', 'help', 'how', 'i', 'in',
  'info', 'information', 'is', 'it', 'me', 'my', 'of', 'old',
  'less', 'max', 'maximum', 'min', 'minimum', 'on', 'over', 'please', 'show',
  'tell', 'than', 'that', 'the', 'this', 'to', 'under', 'what', 'when',
  'where', 'which', 'with', 'year', 'years', 'you', 'your'
]);
const TOKEN_ALIASES = {
  african: 'africa',
  scottish: 'scotland'
};

const SITE_GUIDE = [
  `Official website: ${SITE_ORIGIN}`,
  'The Grand Store is a premium South African marketplace for wines, spirits, beer, accessories, auctions, tastings and events.',
  'Displayed checkout prices are in South African Rand (ZAR).',
  'Alcohol may only be purchased by customers aged 18 or older.',
  `Customer support WhatsApp: ${SUPPORT_WHATSAPP}.`,
  'Important public pages: Shop /shop; cart /customer/cart; checkout /customer/checkout; orders /customer/orders; wishlist /customer/wishlist; compare /customer/compare; auctions /auction; events /events; tastings /bookatasting; global wines /global-wines; wine pairing /tools/wine-pairing; whisky finder /tools/whisky-finder; vendor portal /vendor-portal; contact /contact-us; FAQs /faq; offers /offers; glossary /glossary; referrals /refer-and-earn; terms /terms-and-conditions; privacy /privacy-policy.',
  "Never claim that an order was changed, cancelled, refunded, paid or dispatched. Customers must use their account dashboard or contact support for account-specific actions."
].join('\n');

const cleanText = (value, maxLength = 500) => String(value || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tokenPattern = (token) => new RegExp(`(?:^|[^a-z0-9])${escapeRegex(token)}(?:$|[^a-z0-9])`, 'i');
const textHasToken = (text, token) => tokenPattern(token).test(text);

const getSearchTokens = (message) => [...new Set(
  cleanText(message, 800)
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/^['-]+|['-]+$/g, ''))
    .map((token) => TOKEN_ALIASES[token] || token)
    .filter((token) => !/^r\d+(?:[.,]\d+)?$/.test(token))
    .filter((token) => (token.length >= 3 || /^\d{2,4}$/.test(token)) && !STOP_WORDS.has(token))
)].slice(0, 8);

const scoreFaq = (message, faq) => {
  const haystack = cleanText(message).toLowerCase();
  const words = new Set(getSearchTokens(message));
  let score = 0;
  for (const keywordValue of faq.keywords || []) {
    const keyword = cleanText(keywordValue).toLowerCase();
    if (!keyword) continue;
    if (haystack.includes(keyword)) score += 6 + keyword.split(/\s+/).length;
    for (const token of getSearchTokens(keyword)) {
      if (words.has(token)) score += 2;
    }
  }
  for (const token of getSearchTokens(faq.question)) {
    if (words.has(token)) score += 1;
  }
  return score + (Number(faq.priority) || 0) * 0.02;
};

const rankFaqs = (message, faqs, limit = 8) => [...faqs]
  .map((faq) => ({ faq, score: scoreFaq(message, faq) }))
  .sort((left, right) => right.score - left.score || (right.faq.priority || 0) - (left.faq.priority || 0))
  .slice(0, limit);

const baseProductQuery = {
  isCatalogDuplicate: { $ne: true },
  approvalStatus: { $ne: 'rejected' }
};

const productFieldClauses = (pattern) => [
  { name: pattern }, { brand: pattern }, { category: pattern },
  { subcategory: pattern }, { country: pattern }, { tags: pattern },
  { tastingNotes: pattern }, { flavorProfile: pattern }, { foodPairing: pattern },
  { description: pattern }
];

const productSearchQuery = (tokens) => {
  const base = { ...baseProductQuery };
  if (!tokens.length) return { ...base, featured: true };
  const patterns = tokens.map(tokenPattern);
  return {
    ...base,
    $or: patterns.flatMap(productFieldClauses)
  };
};

const productSearchText = (product) => ({
  name: cleanText(product.name, 180).toLowerCase(),
  brand: cleanText(product.brand, 120).toLowerCase(),
  category: cleanText(product.category || product.type, 100).toLowerCase(),
  subcategory: cleanText(product.subcategory, 140).toLowerCase(),
  country: cleanText(product.country, 100).toLowerCase(),
  details: cleanText([
    product.description,
    ...(product.tags || []),
    ...(product.tastingNotes || []),
    ...(product.flavorProfile || []),
    ...(product.foodPairing || [])
  ].join(' '), 2200).toLowerCase()
});

const scoreProduct = (product, tokens) => {
  const fields = productSearchText(product);
  let score = product.featured ? 2 : 0;
  let matchedTokens = 0;

  for (const token of tokens) {
    let tokenScore = 0;
    if (textHasToken(fields.name, token)) tokenScore = Math.max(tokenScore, 14);
    if (textHasToken(fields.brand, token)) tokenScore = Math.max(tokenScore, 12);
    if (textHasToken(fields.subcategory, token)) tokenScore = Math.max(tokenScore, 8);
    if (textHasToken(fields.category, token)) tokenScore = Math.max(tokenScore, 7);
    if (textHasToken(fields.country, token)) tokenScore = Math.max(tokenScore, 7);
    if (textHasToken(fields.details, token)) tokenScore = Math.max(tokenScore, 3);
    if (tokenScore) {
      matchedTokens += 1;
      score += tokenScore;
    }
  }

  if (tokens.length && matchedTokens === tokens.length) score += 30;
  score += matchedTokens * 4;
  if (Number(product.stock) > 0) score += 1;
  return score;
};

const PRODUCT_SELECTION = 'id name type category country subcategory brand size description price stock tags tastingNotes flavorProfile foodPairing featured';

const getRelevantProducts = async (tokens) => {
  if (!tokens.length) {
    return Product.find(productSearchQuery(tokens))
      .select(PRODUCT_SELECTION)
      .sort({ stock: -1, createdAt: -1 })
      .limit(10)
      .lean();
  }

  const patterns = tokens.map(tokenPattern);
  const strictQuery = {
    ...baseProductQuery,
    $and: patterns.map((pattern) => ({ $or: productFieldClauses(pattern) }))
  };
  const [strictMatches, broadMatches] = await Promise.all([
    Product.find(strictQuery).select(PRODUCT_SELECTION).limit(40).lean(),
    Product.find(productSearchQuery(tokens)).select(PRODUCT_SELECTION).limit(160).lean()
  ]);

  const candidates = [...new Map(
    [...strictMatches, ...broadMatches].map((product) => [String(product._id || product.id), product])
  ).values()];

  return candidates
    .map((product) => ({ product, score: scoreProduct(product, tokens) }))
    .sort((left, right) => right.score - left.score || Number(right.product.stock) - Number(left.product.stock))
    .slice(0, 10)
    .map(({ product }) => product);
};

const formatPrice = (price) => {
  const numeric = Number(price);
  return Number.isFinite(numeric)
    ? `R${numeric.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : cleanText(price, 40);
};

const formatProduct = (product) => JSON.stringify({
  name: cleanText(product.name, 120),
  category: cleanText(product.category || product.type, 60),
  country: cleanText(product.country, 60),
  subcategory: cleanText(product.subcategory, 80),
  brand: cleanText(product.brand, 80),
  size: cleanText(product.size, 40),
  price: formatPrice(product.price),
  stock: Number(product.stock) || 0,
  tastingNotes: (product.tastingNotes || []).slice(0, 6),
  flavorProfile: (product.flavorProfile || []).slice(0, 6),
  foodPairing: (product.foodPairing || []).slice(0, 6),
  description: cleanText(product.description, 360),
  url: `/product/${encodeURIComponent(product.id)}`
});

const getTaxonomy = async () => Product.aggregate([
  { $match: { isCatalogDuplicate: { $ne: true }, approvalStatus: { $ne: 'rejected' } } },
  {
    $group: {
      _id: { $ifNull: ['$category', '$type'] },
      products: { $sum: 1 },
      countries: { $addToSet: '$country' },
      subcategories: { $addToSet: '$subcategory' },
      brands: { $addToSet: '$brand' }
    }
  },
  { $sort: { _id: 1 } }
]);

const getRelevantGlossary = async (tokens) => {
  if (!tokens.length) return [];
  const patterns = tokens.map(tokenPattern);
  return Glossary.find({
    $or: patterns.flatMap((pattern) => [{ term: pattern }, { definition: pattern }])
  }).select('term definition').limit(6).lean();
};

const getRelevantEvents = async (message) => {
  if (!/\b(event|events|ticket|tickets|tasting|tastings|masterclass|festival)\b/i.test(message)) return [];
  return Event.find({
    approvalStatus: 'approved',
    status: { $in: ['upcoming', 'ongoing'] },
    date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  })
    .select('title type format date startTime endTime location city description ticketTiers status')
    .sort({ date: 1 })
    .limit(5)
    .lean();
};

const getRelevantAuctions = async (message) => {
  if (!/\b(auction|auctions|bid|bids|bidding|lot|lots)\b/i.test(message)) return [];
  return AuctionLot.find({ status: { $in: ['live', 'upcoming'] } })
    .select('title description category lotNumber startingBid currentBid bidIncrement startDate endDate condition status')
    .sort({ endDate: 1 })
    .limit(5)
    .lean();
};

const getRelevantEstates = async (message, tokens) => {
  if (!/\b(estate|estates|winery|wineries|wine farm|vineyard|vineyards)\b/i.test(message)) return [];
  const query = { isPublished: true };
  if (tokens.length) {
    const patterns = tokens.map(tokenPattern);
    query.$or = patterns.flatMap((pattern) => [
      { estateName: pattern }, { region: pattern }, { country: pattern },
      { 'vineyard.grapeVarieties': pattern }
    ]);
  }
  return EstateProfile.find(query)
    .select('slug estateName region country tagline story.foundedYear story.winemaker vineyard.grapeVarieties vineyard.viticulture hospitality.hasTastings hospitality.tastings')
    .limit(5)
    .lean();
};

const dedupeSources = (sources) => [...new Map(
  sources.filter((source) => source?.label && source?.url).map((source) => [source.url, source])
).values()].slice(0, 8);

const buildWebsiteKnowledge = async ({ message, faqs }) => {
  const tokens = getSearchTokens(message);
  const rankedFaqs = rankFaqs(message, faqs);
  const [products, taxonomy, glossary, events, auctions, estates] = await Promise.all([
    getRelevantProducts(tokens),
    getTaxonomy(),
    getRelevantGlossary(tokens),
    getRelevantEvents(message),
    getRelevantAuctions(message),
    getRelevantEstates(message, tokens)
  ]);

  const sections = [
    `SITE GUIDE\n${SITE_GUIDE}`,
    `RELEVANT ADMIN-MANAGED FAQS\n${rankedFaqs.map(({ faq }) => JSON.stringify({
      category: faq.category,
      question: cleanText(faq.question, 240),
      answer: cleanText(faq.answer, 800)
    })).join('\n') || 'None'}`,
    `CURRENT CATALOGUE TAXONOMY\n${taxonomy.map((entry) => JSON.stringify({
      category: cleanText(entry._id, 60),
      productCount: entry.products,
      countries: (entry.countries || []).filter(Boolean).slice(0, 20),
      subcategories: (entry.subcategories || []).filter(Boolean).slice(0, 30),
      brands: (entry.brands || []).filter(Boolean).slice(0, 30)
    })).join('\n') || 'None'}`,
    `RELEVANT CURRENT PRODUCTS\n${products.map(formatProduct).join('\n') || 'No matching products found.'}`
  ];

  if (glossary.length) sections.push(`RELEVANT GLOSSARY\n${glossary.map((item) => JSON.stringify({
    term: cleanText(item.term, 100), definition: cleanText(item.definition, 600)
  })).join('\n')}`);
  if (events.length) sections.push(`CURRENT EVENTS\n${events.map((event) => JSON.stringify({
    title: event.title,
    type: event.type,
    format: event.format,
    date: event.date,
    time: `${event.startTime || ''}-${event.endTime || ''}`,
    location: event.location,
    city: event.city,
    status: event.status,
    ticketTiers: (event.ticketTiers || []).map((tier) => ({
      name: tier.name, price: tier.price, available: Math.max(0, (tier.quantity || 0) - (tier.sold || 0))
    })),
    url: `/events/${event._id}`
  })).join('\n')}`);
  if (auctions.length) sections.push(`CURRENT AUCTIONS\n${auctions.map((lot) => JSON.stringify({
    title: lot.title,
    category: lot.category,
    lotNumber: lot.lotNumber,
    startingBid: lot.startingBid,
    currentBid: lot.currentBid,
    bidIncrement: lot.bidIncrement,
    startDate: lot.startDate,
    endDate: lot.endDate,
    condition: lot.condition,
    status: lot.status,
    url: `/auction/${lot._id}`
  })).join('\n')}`);
  if (estates.length) sections.push(`PUBLISHED WINE ESTATES\n${estates.map((estate) => JSON.stringify({
    name: estate.estateName,
    region: estate.region,
    country: estate.country,
    tagline: estate.tagline,
    foundedYear: estate.story?.foundedYear,
    winemaker: estate.story?.winemaker,
    grapes: estate.vineyard?.grapeVarieties,
    viticulture: estate.vineyard?.viticulture,
    tastingsAvailable: estate.hospitality?.hasTastings,
    url: `/estate/${estate.slug}`
  })).join('\n')}`);

  const sources = dedupeSources([
    ...products.slice(0, 5).map((product) => ({ label: product.name, url: `/product/${encodeURIComponent(product.id)}` })),
    ...(rankedFaqs.length ? [{ label: 'Help & FAQs', url: '/faq' }] : []),
    ...(events.length ? [{ label: 'Events', url: '/events' }] : []),
    ...(auctions.length ? [{ label: 'Auctions', url: '/auction' }] : []),
    ...(glossary.length ? [{ label: 'Glossary', url: '/glossary' }] : []),
    ...(estates.length ? [{ label: 'Wine estates', url: '/winefarm' }] : []),
    { label: 'Shop', url: '/shop' },
    { label: 'Contact support', url: '/contact-us' }
  ]);

  return {
    context: sections.join('\n\n'),
    sources,
    bestFaq: rankedFaqs[0]?.score > 0 ? rankedFaqs[0].faq : null,
    hasDirectEvidence: Boolean(
      products.length ||
      rankedFaqs[0]?.score > 0 ||
      glossary.length ||
      events.length ||
      auctions.length ||
      estates.length ||
      /\b(shop|cart|checkout|order|wishlist|compare|auction|event|tasting|contact|whatsapp|currency|rand|zar|age|referral|privacy|terms|offer|glossary|vendor)\b/i.test(message)
    )
  };
};

module.exports = {
  SITE_GUIDE,
  buildWebsiteKnowledge,
  cleanText,
  getSearchTokens,
  rankFaqs,
  scoreFaq
};
