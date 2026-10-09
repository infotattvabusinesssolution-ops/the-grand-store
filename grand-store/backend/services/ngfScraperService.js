const https = require('https');
const CompetitorPriceTrack = require('../models/CompetitorPriceTrack');
const CompetitorMonthlySummary = require('../models/CompetitorMonthlySummary');
const Product = require('../models/Product');

/**
 * Normalizes a product title into clean lowercase tokens for robust matching
 */
function normalizeName(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents (é -> e, ë -> e, etc.)
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Bottle volume sizes to exclude from distinctive token comparison
const SIZE_WORDS = new Set(['750ml', '375ml', '187ml', '1l', '15l', '3l', 'ml', 'cl', 'bottle', 'box', 'gift', 'giftbox', 'case', 'pack', 'packset']);

// Non-distinctive generic beverage filler
const FILLER_WORDS = new Set(['single', 'malt', 'scotch', 'whisky', 'whiskey', 'bourbon', 'wine', 'dry', 'sweet', 'estate', 'aged', 'classic', 'collection', 'edition', 'liquor', 'liqueur']);

function extractProductTokens(name) {
  const clean = normalizeName(name);
  const words = clean.split(' ').filter(w => w.length > 0);
  
  // Extract volume size: 750ml, 1.5l, 375ml, 1l, etc.
  let size = null;
  const sizeMatch = clean.match(/(\d+(?:\.\d+)?)\s*(ml|l|cl)/i);
  if (sizeMatch) {
    const val = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toLowerCase();
    if (unit === 'l') {
      size = Math.round(val * 1000);
    } else if (unit === 'cl') {
      size = Math.round(val * 10);
    } else {
      size = Math.round(val);
    }
  }

  // Extract age numbers or vintages: 10, 12, 15, 16, 18, 21, 25, 30, 2012, 2015, etc.
  const numbers = words.filter(w => /^\d+$/.test(w) && !SIZE_WORDS.has(w + 'ml') && w !== '750' && w !== '375' && w !== '1000');
  
  // Distinctive words (including age numbers, grades xo/vsop, brut, rose, blanc, double, cask)
  const distinctive = words.filter(w => !SIZE_WORDS.has(w) && !FILLER_WORDS.has(w) && w !== '750' && w !== '375');
  
  return {
    raw: clean,
    words,
    numbers,
    size,
    distinctive,
    primaryBrand: words[0] || ''
  };
}

function calculateMatchScore(gsName, ngfName) {
  const gs = extractProductTokens(gsName);
  const ngf = extractProductTokens(ngfName);

  // If GS has a specific age number (e.g. 16, 18, 12), NGF MUST have that same number!
  if (gs.numbers.length > 0) {
    const hasSharedNumber = gs.numbers.some(n => ngf.numbers.includes(n) || ngf.words.some(w => w.startsWith(n)));
    if (!hasSharedNumber) return 0; // Prevent Aberlour 16 from matching Aberlour 18 or 12
  }

  // Bottle size mismatch check (e.g. 750ml vs 1.5L)
  if (gs.size && ngf.size && gs.size !== ngf.size) {
    return 0; // Reject different bottle sizes when both are explicit
  }

  // Rosé check: never match Rosé with non-Rosé
  const gsIsRose = gs.words.includes('rose') || gs.raw.includes('rose');
  const ngfIsRose = ngf.words.includes('rose') || ngf.raw.includes('rose');
  if (gsIsRose !== ngfIsRose) return 0;

  // Blanc de Blancs check: if GS specifies blanc/blancs, NGF must also have it
  const gsIsBlanc = gs.words.includes('blanc') || gs.words.includes('blancs');
  const ngfIsBlanc = ngf.words.includes('blanc') || ngf.words.includes('blancs');
  if (gsIsBlanc !== ngfIsBlanc) return 0;

  // Brut vs Demi-Sec / Nectar check
  const gsIsBrut = gs.words.includes('brut');
  const ngfIsSweet = ngf.words.includes('sec') || ngf.words.includes('demi') || ngf.words.includes('nectar');
  if (gsIsBrut && ngfIsSweet) return 0;

  // Vintage year check (e.g. 2012, 2015, 2016, 2018)
  const gsVintage = gs.words.find(w => /^(19\d\d|20\d\d)$/.test(w));
  const ngfVintage = ngf.words.find(w => /^(19\d\d|20\d\d)$/.test(w));
  if (gsVintage && ngfVintage && gsVintage !== ngfVintage) return 0;

  // Grade check (e.g. XO, VSOP)
  const gsGrades = gs.words.filter(w => ['xo', 'vsop', 'vs', 'xxo', 'extra'].includes(w));
  if (gsGrades.length > 0) {
    const hasSharedGrade = gsGrades.some(g => ngf.words.includes(g));
    if (!hasSharedGrade) return 0; // Don't match Remy Martin XO with Remy Martin VSOP
  }

  // Packaging / Gift set check: don't match specific gift sets (glasses, coffret) to standard bottle
  const gsHasSpecialSet = gs.words.includes('glasses') || gs.words.includes('coffret') || gs.raw.includes('two glasses');
  const ngfHasSpecialSet = ngf.words.includes('glasses') || ngf.words.includes('coffret') || ngf.raw.includes('two glasses');
  if (gsHasSpecialSet !== ngfHasSpecialSet) return 0;

  // Primary brand / distinctive check
  const brandMatches = (
    gs.primaryBrand === ngf.primaryBrand ||
    ngf.distinctive.includes(gs.primaryBrand) ||
    gs.distinctive.includes(ngf.primaryBrand) ||
    (gs.words.length >= 2 && ngf.words.length >= 2 && gs.words[0] === ngf.words[0])
  );
  if (!brandMatches) return 0;

  // Count shared distinctive tokens
  let shared = 0;
  for (const t of gs.distinctive) {
    if (ngf.distinctive.includes(t)) shared++;
  }

  const minLen = Math.min(gs.distinctive.length, ngf.distinctive.length);
  if (minLen === 0) return 0;
  
  return shared / minLen;
}

/**
 * Parses numeric price from various string formats (e.g. "R 1,450.00", "850", 850)
 */
function parsePrice(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9\.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * HTTP GET request helper returning parsed JSON with standard browser headers
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000
    };

    const req = https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: JSON.parse(data)
            });
          } catch (e) {
            reject(new Error(`Failed to parse JSON response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP Error ${res.statusCode} from ${url}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });

    req.on('error', reject);
  });
}

/**
 * Synchronizes Norman Goodfellows catalog with Grand Store Admin products
 * @param {Object} options - { maxProducts = 1000, perPage = 100 }
 */
async function syncNgfCatalog(options = {}) {
  const maxProducts = options.maxProducts || 1000;
  const perPage = Math.min(options.perPage || 100, 100);
  const startTime = Date.now();

  console.log(`[NGF Ingestion] Starting competitor sync (Target: ${maxProducts} products)...`);

  // 1. Preload Grand Store Admin Products for efficient in-memory matching
  const gsProducts = await Product.find({}).lean();
  console.log(`[NGF Ingestion] Loaded ${gsProducts.length} Grand Store admin products for matching`);

  // Build lookup index: SKU map and normalized name map
  const skuMap = new Map();
  const nameTokensList = [];

  for (const p of gsProducts) {
    const priceNum = parsePrice(p.price);
    const tokens = getDistinctiveTokens(p.name);
    const pInfo = {
      _id: p._id,
      name: p.name,
      price: priceNum,
      sku: p.id || p.sku || '',
      tokens
    };

    if (p.id) skuMap.set(String(p.id).toLowerCase(), pInfo);
    if (p.sku) skuMap.set(String(p.sku).toLowerCase(), pInfo);
    nameTokensList.push(pInfo);
  }

  // Cleanup any legacy unmatched products per user instruction
  await CompetitorPriceTrack.deleteMany({
    $or: [{ matchedProduct: null }, { matchConfidence: 'unmatched' }]
  });
  await CompetitorMonthlySummary.deleteMany({
    $or: [{ productId: null }]
  });

  let totalFetched = 0;
  let priceChangeCount = 0;
  let matchedCount = 0;
  let currentPage = 1;
  const maxPages = Math.ceil(maxProducts / perPage);
  const currentMonthKey = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  while (currentPage <= maxPages) {
    const apiUrl = `https://www.ngf.co.za/wp-json/wc/store/v1/products?per_page=${perPage}&page=${currentPage}`;
    
    try {
      const res = await fetchJson(apiUrl);
      const items = res.data;

      if (!Array.isArray(items) || items.length === 0) {
        console.log(`[NGF Ingestion] No more items at page ${currentPage}`);
        break;
      }

      for (const item of items) {
        totalFetched++;

        // Prices are delivered in minor units (cents)
        const currentPrice = item.prices?.price ? Number(item.prices.price) / 100 : 0;
        const regularPrice = item.prices?.regular_price ? Number(item.prices.regular_price) / 100 : currentPrice;
        const salePrice = item.prices?.sale_price ? Number(item.prices.sale_price) / 100 : 0;
        const isOnSale = salePrice > 0 && salePrice < regularPrice;
        const isInStock = Boolean(item.is_in_stock);
        const externalId = Number(item.id);
        const sku = String(item.sku || '').trim();
        const rawName = String(item.name || '').replace(/&amp;/g, '&').trim();
        const cleanName = normalizeName(rawName);

        // Matching Engine against Grand Store Admin Products
        let matchedGs = null;
        let matchConfidence = 'unmatched';

        // 1. Exact SKU Match
        if (sku && skuMap.has(sku.toLowerCase())) {
          matchedGs = skuMap.get(sku.toLowerCase());
          matchConfidence = 'exact_sku';
        }

        const ngfTokens = getDistinctiveTokens(rawName);

        // 2. Exact Title Match
        if (!matchedGs) {
          for (const gs of nameTokensList) {
            if (ngfTokens.raw === gs.tokens.raw) {
              matchedGs = gs;
              matchConfidence = 'exact_title';
              break;
            }
          }
        }

        // 3. Primary Brand + High Confidence Distinctive Token Match
        if (!matchedGs && ngfTokens.distinctive.length > 0) {
          let bestScore = 0;
          let candidate = null;

          for (const gs of nameTokensList) {
            const primaryBrandGs = gs.tokens.primaryBrand;
            const primaryBrandNgf = ngfTokens.primaryBrand;

            const brandMatches = (
              primaryBrandGs === primaryBrandNgf ||
              ngfTokens.distinctive.includes(primaryBrandGs) ||
              gs.tokens.distinctive.includes(primaryBrandNgf)
            );

            if (!brandMatches) continue;

            let shared = 0;
            for (const t of gs.tokens.distinctive) {
              if (ngfTokens.distinctive.includes(t)) shared++;
            }

            const minLen = Math.min(gs.tokens.distinctive.length, ngfTokens.distinctive.length);
            if (minLen === 1 && shared === 1) {
              if (gs.tokens.allTokens.length >= 2 && ngfTokens.allTokens.length >= 2) {
                let allShared = 0;
                for (const t of gs.tokens.allTokens) {
                  if (ngfTokens.allTokens.includes(t)) allShared++;
                }
                if (allShared >= 2) {
                  bestScore = 1.0;
                  candidate = gs;
                  break;
                }
              }
            } else if (minLen >= 2) {
              const ratio = shared / minLen;
              if (ratio >= 0.60 && shared >= 2 && ratio > bestScore) {
                bestScore = ratio;
                candidate = gs;
              }
            }
          }

          if (candidate && bestScore >= 0.60) {
            matchedGs = candidate;
            matchConfidence = 'high_text';
          }
        }

        // USER INSTRUCTION: Only take products from NGF corresponding to products we already have in Grand Store!
        // If not matched to Grand Store, do NOT save it to the database!
        if (!matchedGs) {
          continue;
        }

        // Compute Variance & Market Positioning
        matchedCount++;
        const grandStorePrice = matchedGs.price || 0;
        const varianceAmountZar = grandStorePrice - currentPrice;
        const variancePercent = currentPrice > 0 
          ? ((grandStorePrice - currentPrice) / currentPrice) * 100 
          : 0;

        let marketPosition = 'unmatched';
        if (!isInStock) {
          marketPosition = 'competitor_out_of_stock';
        } else if (varianceAmountZar < -2) {
          marketPosition = 'gs_cheaper';
        } else if (varianceAmountZar > 2) {
          marketPosition = 'gs_expensive';
        } else {
          marketPosition = 'price_matched';
        }

        // Check existing track record
        const existing = await CompetitorPriceTrack.findOne({ externalId });

        let isPriceShift = false;
        let previousPrice = currentPrice;
        let lastPriceChangeAmount = 0;
        let lastPriceChangePercent = 0;
        let lastPriceChangedAt = existing ? existing.lastPriceChangedAt : null;

        if (existing) {
          if (existing.currentPrice !== currentPrice && existing.currentPrice > 0) {
            isPriceShift = true;
            priceChangeCount++;
            previousPrice = existing.currentPrice;
            lastPriceChangeAmount = currentPrice - existing.currentPrice;
            lastPriceChangePercent = ((currentPrice - existing.currentPrice) / existing.currentPrice) * 100;
            lastPriceChangedAt = new Date();
          } else {
            previousPrice = existing.previousPrice || currentPrice;
            lastPriceChangeAmount = existing.lastPriceChangeAmount || 0;
            lastPriceChangePercent = existing.lastPriceChangePercent || 0;
          }
        }

        // Update or Insert Competitor Price Track Document
        const updateDoc = {
          competitor: 'Norman Goodfellows',
          externalId,
          sku,
          name: rawName,
          cleanName,
          permalink: item.permalink || '',
          imageUrl: item.images?.[0]?.src || '',
          category: item.categories?.[0]?.name || 'Spirits & Wine',
          isInStock,
          currentPrice,
          regularPrice,
          salePrice,
          isOnSale,
          previousPrice,
          lastPriceChangeAmount,
          lastPriceChangePercent,
          lastPriceChangedAt,
          matchedProduct: matchedGs ? matchedGs._id : (existing?.matchedProduct || null),
          matchedProductName: matchedGs ? matchedGs.name : (existing?.matchedProductName || ''),
          matchConfidence: existing?.matchConfidence === 'manual_verified' ? 'manual_verified' : matchConfidence,
          grandStorePrice,
          varianceAmountZar,
          variancePercent,
          marketPosition,
          lastScrapedAt: new Date()
        };

        const upserted = await CompetitorPriceTrack.findOneAndUpdate(
          { externalId },
          {
            $set: updateDoc,
            $push: {
              priceHistory: {
                $each: [{
                  price: currentPrice,
                  regularPrice,
                  salePrice,
                  isInStock,
                  recordedAt: new Date()
                }],
                $slice: -90 // keep last 90 snapshots
              }
            }
          },
          { upsert: true, new: true }
        );

        // Update / Rollup Monthly Summary Document
        await updateMonthlySummary(upserted, currentMonthKey, currentPrice, isInStock, grandStorePrice);

        if (totalFetched >= maxProducts) break;
      }

      if (totalFetched >= maxProducts) break;
      currentPage++;

      // Polite delay between batch pages
      await new Promise(r => setTimeout(r, 200));
    } catch (pageErr) {
      console.error(`[NGF Ingestion] Error at page ${currentPage}:`, pageErr.message);
      break;
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(`[NGF Ingestion] Finished: ${totalFetched} items fetched, ${matchedCount} matched, ${priceChangeCount} price shifts detected in ${durationMs}ms`);

  return {
    success: true,
    totalFetched,
    matchedCount,
    priceChangeCount,
    durationMs,
    month: currentMonthKey
  };
}

/**
 * Updates or rolls up the monthly summary record for a competitor tracked item
 */
async function updateMonthlySummary(trackItem, monthKey, currentPrice, isInStock, grandStorePrice) {
  try {
    const existingMonthly = await CompetitorMonthlySummary.findOne({
      competitorTrackId: trackItem._id,
      month: monthKey
    });

    if (!existingMonthly) {
      await CompetitorMonthlySummary.create({
        competitorTrackId: trackItem._id,
        productId: trackItem.matchedProduct || null,
        productName: trackItem.name,
        competitorName: 'Norman Goodfellows',
        month: monthKey,
        monthStartPrice: currentPrice,
        monthEndPrice: currentPrice,
        averagePrice: currentPrice,
        minPrice: currentPrice,
        maxPrice: currentPrice,
        priceChangeCount: 0,
        netMonthlyDriftZar: 0,
        netMonthlyDriftPercent: 0,
        daysInStock: isInStock ? 1 : 0,
        daysOutOfStock: isInStock ? 0 : 1,
        stockAvailabilityPercent: isInStock ? 100 : 0,
        grandStoreMonthlyAvg: grandStorePrice,
        avgVarianceZar: grandStorePrice - currentPrice
      });
    } else {
      const newMin = Math.min(existingMonthly.minPrice || currentPrice, currentPrice);
      const newMax = Math.max(existingMonthly.maxPrice || currentPrice, currentPrice);
      const newAvg = (existingMonthly.averagePrice + currentPrice) / 2;
      const netDrift = currentPrice - existingMonthly.monthStartPrice;
      const netDriftPct = existingMonthly.monthStartPrice > 0 
        ? (netDrift / existingMonthly.monthStartPrice) * 100 
        : 0;

      const totalDays = (existingMonthly.daysInStock || 0) + (existingMonthly.daysOutOfStock || 0) + 1;
      const newInStockDays = (existingMonthly.daysInStock || 0) + (isInStock ? 1 : 0);
      const newOosDays = (existingMonthly.daysOutOfStock || 0) + (isInStock ? 0 : 1);
      const availabilityPct = Math.round((newInStockDays / totalDays) * 100);

      const hasChanged = existingMonthly.monthEndPrice !== currentPrice;

      await CompetitorMonthlySummary.updateOne(
        { _id: existingMonthly._id },
        {
          $set: {
            productId: trackItem.matchedProduct || existingMonthly.productId,
            productName: trackItem.name || existingMonthly.productName,
            monthEndPrice: currentPrice,
            averagePrice: Math.round(newAvg * 100) / 100,
            minPrice: newMin,
            maxPrice: newMax,
            netMonthlyDriftZar: Math.round(netDrift * 100) / 100,
            netMonthlyDriftPercent: Math.round(netDriftPct * 10) / 10,
            daysInStock: newInStockDays,
            daysOutOfStock: newOosDays,
            stockAvailabilityPercent: availabilityPct,
            grandStoreMonthlyAvg: grandStorePrice || existingMonthly.grandStoreMonthlyAvg,
            avgVarianceZar: grandStorePrice ? Math.round((grandStorePrice - newAvg) * 100) / 100 : existingMonthly.avgVarianceZar
          },
          $inc: {
            priceChangeCount: hasChanged ? 1 : 0
          }
        }
      );
    }
  } catch (err) {
    console.warn(`[NGF Ingestion] Monthly rollup warning for ${trackItem.name}:`, err.message);
  }
}

/**
 * Synchronizes all Grand Store Retail Products (from superadmin Retail Products catalog)
 * by directly querying Norman Goodfellows API for each product, matching, and storing live prices.
 */
async function syncGrandStoreRetailProducts(options = {}) {
  const startTime = Date.now();
  console.log('[Retail Price Intelligence] Starting sync for all Grand Store retail products...');

  // 1. Fetch all Grand Store retail products (same query as superadmin Retail Products tab)
  const gsProducts = await Product.find({ isCatalogDuplicate: { $ne: true } })
    .select('name price id sku category brand stock image images sourceUrl imageSourceUrl slug')
    .lean();

  console.log(`[Retail Price Intelligence] Scanning ${gsProducts.length} Grand Store retail products against Norman Goodfellows...`);

  let matchedCount = 0;
  let priceChangeCount = 0;
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  for (let i = 0; i < gsProducts.length; i++) {
    const p = gsProducts[i];
    const gsPrice = parsePrice(p.price);
    const gsTokens = extractProductTokens(p.name);
    const words = gsTokens.words;

    try {
      let bestMatch = null;
      let bestScore = 0;

      // 1. Direct Slug Match (highest accuracy & fastest - 256+ products)
      const rawUrl = p.sourceUrl || p.imageSourceUrl || '';
      const slugMatch = rawUrl.match(/ngf\.co\.za\/product\/([^\/?#]+)/i);
      const directSlug = slugMatch ? slugMatch[1].trim() : null;

      if (directSlug) {
        try {
          const slugUrl = `https://www.ngf.co.za/wp-json/wc/store/v1/products?slug=${encodeURIComponent(directSlug)}`;
          const res = await fetchJson(slugUrl);
          if (Array.isArray(res.data) && res.data.length > 0) {
            bestMatch = res.data[0];
            bestScore = 1.0;
          }
        } catch (err) {
          // ignore and fallback
        }
      }

      // 2. Intelligent Multi-Tier Search (if no direct slug or slug changed)
      if (!bestMatch) {
        const queries = [];

        // Tier 1: Brand + age number or special grade (e.g. "Aberlour 16", "remy martin xo", "bisquit vsop")
        if (gsTokens.numbers.length > 0) {
          queries.push(`${words[0]} ${gsTokens.numbers[0]}`);
        }
        const grades = words.filter(w => ['xo', 'vsop', 'vs', 'xxo', 'extra'].includes(w));
        if (grades.length > 0) {
          queries.push(`${words.slice(0, 2).join(' ')} ${grades[0]}`);
        }

        // Tier 2: First 2-3 natural title words (e.g. "Barons De Rothschild", "Perrier Jouet", "Laurent Perrier")
        if (words.length >= 3) {
          queries.push(words.slice(0, 3).join(' '));
        }
        if (words.length >= 2) {
          queries.push(words.slice(0, 2).join(' '));
        }

        // Tier 3: First word (Brand fallback)
        if (words[0] && words[0].length >= 3) {
          queries.push(words[0]);
        }

        const uniqueQueries = Array.from(new Set(queries.filter(q => q && q.length >= 3)));

        for (const q of uniqueQueries) {
          try {
            const searchUrl = `https://www.ngf.co.za/wp-json/wc/store/v1/products?search=${encodeURIComponent(q)}&per_page=8`;
            const res = await fetchJson(searchUrl);
            const candidates = res.data;

            if (Array.isArray(candidates) && candidates.length > 0) {
              for (const candidate of candidates) {
                const ngfName = String(candidate.name || '').replace(/&amp;/g, '&').trim();
                const score = calculateMatchScore(p.name, ngfName);

                if (score >= 0.65 && score > bestScore) {
                  bestScore = score;
                  bestMatch = candidate;
                }
              }

              if (bestMatch && bestScore >= 0.80) break; // High confidence match found
            }
          } catch (err) {
            // continue to next query tier
          }
        }
      }

      if (bestMatch) {
        matchedCount++;
        const currentPrice = bestMatch.prices?.price ? Number(bestMatch.prices.price) / 100 : 0;
        const regularPrice = bestMatch.prices?.regular_price ? Number(bestMatch.prices.regular_price) / 100 : currentPrice;
        const salePrice = bestMatch.prices?.sale_price ? Number(bestMatch.prices.sale_price) / 100 : 0;
        const isOnSale = salePrice > 0 && salePrice < regularPrice;
        const isInStock = Boolean(bestMatch.is_in_stock);
        const externalId = Number(bestMatch.id);
        const sku = String(bestMatch.sku || '').trim();
        const rawName = String(bestMatch.name || '').replace(/&amp;/g, '&').trim();
        const cleanName = normalizeName(rawName);

        const varianceAmountZar = gsPrice - currentPrice;
        const variancePercent = currentPrice > 0 ? ((gsPrice - currentPrice) / currentPrice) * 100 : 0;

        let marketPosition = 'price_matched';
        if (!isInStock) {
          marketPosition = 'competitor_out_of_stock';
        } else if (varianceAmountZar < -2) {
          marketPosition = 'gs_cheaper';
        } else if (varianceAmountZar > 2) {
          marketPosition = 'gs_expensive';
        }

        const isDirectMatch = bestScore === 1.0;
        const existing = await CompetitorPriceTrack.findOne({ externalId });

        // If another product already claimed this externalId via an exact direct slug match,
        // do not let a fuzzy search from this product steal it!
        if (existing && existing.matchConfidence === 'exact_sku' && existing.matchedProduct && existing.matchedProduct.toString() !== p._id.toString() && !isDirectMatch) {
          continue;
        }

        // Clear any old, stale linkage where this Grand Store product was linked to a different externalId
        await CompetitorPriceTrack.updateMany(
          { matchedProduct: p._id, externalId: { $ne: externalId } },
          { $set: { matchedProduct: null, matchConfidence: 'unmatched', marketPosition: 'unmatched' } }
        );

        let isPriceShift = false;
        let previousPrice = currentPrice;
        let lastPriceChangeAmount = 0;
        let lastPriceChangePercent = 0;
        let lastPriceChangedAt = existing ? existing.lastPriceChangedAt : null;

        if (existing) {
          if (existing.currentPrice !== currentPrice && existing.currentPrice > 0) {
            isPriceShift = true;
            priceChangeCount++;
            previousPrice = existing.currentPrice;
            lastPriceChangeAmount = currentPrice - existing.currentPrice;
            lastPriceChangePercent = ((currentPrice - existing.currentPrice) / existing.currentPrice) * 100;
            lastPriceChangedAt = new Date();
          } else {
            previousPrice = existing.previousPrice || currentPrice;
            lastPriceChangeAmount = existing.lastPriceChangeAmount || 0;
            lastPriceChangePercent = existing.lastPriceChangePercent || 0;
          }
        }

        const updateDoc = {
          competitor: 'Norman Goodfellows',
          externalId,
          sku,
          name: rawName,
          cleanName,
          permalink: bestMatch.permalink || '',
          imageUrl: bestMatch.images?.[0]?.src || '',
          category: bestMatch.categories?.[0]?.name || p.category || 'Spirits & Wine',
          isInStock,
          currentPrice,
          regularPrice,
          salePrice,
          isOnSale,
          previousPrice,
          lastPriceChangeAmount: Math.round(lastPriceChangeAmount * 100) / 100,
          lastPriceChangePercent: Math.round(lastPriceChangePercent * 10) / 10,
          lastPriceChangedAt,
          matchedProduct: p._id,
          matchedProductName: p.name,
          matchConfidence: bestScore >= 0.9 ? 'exact_sku' : 'high_text',
          grandStorePrice: gsPrice,
          varianceAmountZar: Math.round(varianceAmountZar * 100) / 100,
          variancePercent: Math.round(variancePercent * 10) / 10,
          marketPosition,
          lastScrapedAt: new Date()
        };

        const savedItem = await CompetitorPriceTrack.findOneAndUpdate(
          { externalId },
          {
            $set: updateDoc,
            $push: {
              priceHistory: {
                $each: [{
                  price: currentPrice,
                  regularPrice,
                  salePrice,
                  isInStock,
                  recordedAt: new Date()
                }],
                $slice: -90
              }
            }
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        await updateMonthlySummary(savedItem, currentMonthKey, currentPrice, isInStock, gsPrice);
      }
    } catch (err) {
      console.warn(`[Retail Price Intelligence] Search error for "${p.name}":`, err.message);
    }

    if ((i + 1) % 25 === 0 || i === gsProducts.length - 1) {
      console.log(`[Retail Price Intelligence] Progress: ${i + 1}/${gsProducts.length} scanned | ${matchedCount} matched so far...`);
    }

    // Friendly 100ms delay between requests
    await new Promise(r => setTimeout(r, 100));
  }

  const durationMs = Date.now() - startTime;
  console.log(`[Retail Price Intelligence] Finished: ${gsProducts.length} retail products scanned, ${matchedCount} matched on NGF in ${durationMs}ms`);

  return {
    success: true,
    totalRetailProducts: gsProducts.length,
    matchedCount,
    priceChangeCount,
    durationMs,
    month: currentMonthKey
  };
}

module.exports = {
  syncNgfCatalog,
  syncGrandStoreRetailProducts,
  normalizeName,
  parsePrice,
  extractProductTokens,
  calculateMatchScore,
  fetchJson
};
