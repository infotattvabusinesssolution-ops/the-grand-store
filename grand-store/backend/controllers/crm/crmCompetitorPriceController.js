const CompetitorPriceTrack = require('../../models/CompetitorPriceTrack');
const CompetitorMonthlySummary = require('../../models/CompetitorMonthlySummary');
const Product = require('../../models/Product');
const ngfScraperService = require('../../services/ngfScraperService');

/**
 * Helper to parse numeric price
 */
function parsePrice(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9\.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Get paginated competitor price tracking matrix with filters
 * Anchored on Grand Store Retail Products (the exact catalog from Superadmin Retail Products tab)
 */
exports.getCompetitorPrices = async (req, res) => {
  try {
    const { 
      position, 
      search, 
      category, 
      page = 1, 
      limit = 40, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = req.query;

    // 1. Fetch all Grand Store retail products (the exact same catalog as superadmin Retail Products)
    const productQuery = { isCatalogDuplicate: { $ne: true } };

    if (category && category !== 'all') {
      productQuery.category = { $regex: category, $options: 'i' };
    }

    if (search && search.trim()) {
      const q = search.trim();
      productQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { id: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    const allGsProducts = await Product.find(productQuery)
      .select('name price brand category stock image images id sku')
      .lean();

    // 2. Fetch all competitor tracks
    const allTracks = await CompetitorPriceTrack.find({ matchedProduct: { $ne: null } }).lean();
    const trackMap = new Map();
    for (const t of allTracks) {
      if (t.matchedProduct) {
        trackMap.set(t.matchedProduct.toString(), t);
      }
    }

    // 3. Combine into Side-by-Side matrix
    let matrix = allGsProducts.map(p => {
      const track = trackMap.get(p._id.toString());
      const gsPrice = parsePrice(p.price);
      const ngfPrice = track ? track.currentPrice : null;
      const varianceAmountZar = track ? Math.round((gsPrice - track.currentPrice) * 100) / 100 : 0;
      const variancePercent = track && track.currentPrice > 0 
        ? Math.round(((gsPrice - track.currentPrice) / track.currentPrice) * 1000) / 10 
        : 0;

      let marketPosition = 'not_listed';
      if (track) {
        marketPosition = track.marketPosition;
      }

      return {
        _id: p._id,
        id: p.id,
        name: p.name,
        brand: p.brand || '',
        category: p.category || 'Spirits & Wine',
        image: p.image || (Array.isArray(p.images) && p.images[0]) || '',
        stock: p.stock || 0,
        grandStorePrice: gsPrice,
        
        // Competitor (Norman Goodfellows)
        competitorTrackId: track?._id || null,
        hasCompetitorMatch: Boolean(track),
        competitor: 'Norman Goodfellows',
        competitorName: track ? track.name : 'Not listed at NGF',
        competitorSku: track?.sku || '',
        competitorPrice: ngfPrice,
        competitorRegularPrice: track?.regularPrice || null,
        competitorSalePrice: track?.salePrice || null,
        competitorInStock: track ? track.isInStock : null,
        competitorOnSale: track ? track.isOnSale : false,
        competitorPermalink: track?.permalink || `https://www.ngf.co.za/?s=${encodeURIComponent(p.name)}`,
        competitorImageUrl: track?.imageUrl || '',
        varianceAmountZar,
        variancePercent,
        marketPosition,
        lastScrapedAt: track?.lastScrapedAt || null
      };
    });

    // 4. Position filtering
    if (position && position !== 'all') {
      if (position === 'matched') {
        matrix = matrix.filter(m => m.hasCompetitorMatch);
      } else if (position === 'gs_cheaper') {
        matrix = matrix.filter(m => m.hasCompetitorMatch && m.marketPosition === 'gs_cheaper');
      } else if (position === 'gs_expensive') {
        matrix = matrix.filter(m => m.hasCompetitorMatch && m.marketPosition === 'gs_expensive');
      } else if (position === 'price_matched') {
        matrix = matrix.filter(m => m.hasCompetitorMatch && m.marketPosition === 'price_matched');
      } else if (position === 'on_sale') {
        matrix = matrix.filter(m => m.hasCompetitorMatch && m.competitorOnSale);
      } else if (position === 'out_of_stock') {
        matrix = matrix.filter(m => m.hasCompetitorMatch && m.competitorInStock === false);
      } else if (position === 'not_listed') {
        matrix = matrix.filter(m => !m.hasCompetitorMatch);
      }
    }

    // 5. Sorting
    if (sortBy === 'variance') {
      matrix.sort((a, b) => sortOrder === 'asc' ? a.varianceAmountZar - b.varianceAmountZar : b.varianceAmountZar - a.varianceAmountZar);
    } else if (sortBy === 'price') {
      matrix.sort((a, b) => sortOrder === 'asc' ? a.grandStorePrice - b.grandStorePrice : b.grandStorePrice - a.grandStorePrice);
    } else {
      matrix.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    }

    const total = matrix.length;
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 40, 1), 200);
    const skip = (pageNum - 1) * limitNum;
    const paginatedItems = matrix.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      count: paginatedItems.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      items: paginatedItems
    });
  } catch (error) {
    console.error('Error fetching competitor prices:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve competitor price tracking data' });
  }
};

/**
 * Get executive summary & KPI indicators for competitor tracking
 */
exports.getCompetitorPriceSummary = async (req, res) => {
  try {
    const totalRetail = await Product.countDocuments({ isCatalogDuplicate: { $ne: true } });
    const tracks = await CompetitorPriceTrack.find({ matchedProduct: { $ne: null } }).lean();

    let matchedCount = tracks.length;
    let gsCheaperCount = 0;
    let gsExpensiveCount = 0;
    let priceMatchedCount = 0;
    let competitorOosCount = 0;
    let onSaleCount = 0;
    let latestScraped = null;

    for (const t of tracks) {
      if (t.marketPosition === 'gs_cheaper') gsCheaperCount++;
      if (t.marketPosition === 'gs_expensive') gsExpensiveCount++;
      if (t.marketPosition === 'price_matched') priceMatchedCount++;
      if (t.isInStock === false || t.marketPosition === 'competitor_out_of_stock') competitorOosCount++;
      if (t.isOnSale) onSaleCount++;
      if (t.lastScrapedAt && (!latestScraped || new Date(t.lastScrapedAt) > new Date(latestScraped))) {
        latestScraped = t.lastScrapedAt;
      }
    }

    const notListedCount = Math.max(0, totalRetail - matchedCount);

    return res.status(200).json({
      success: true,
      summary: {
        totalTracked: totalRetail,
        matchedCount,
        notListedCount,
        gsCheaperCount,
        gsExpensiveCount,
        priceMatchedCount,
        competitorOosCount,
        onSaleCount,
        lastScrapedAt: latestScraped
      }
    });
  } catch (error) {
    console.error('Error fetching competitor price summary:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve price intelligence summary' });
  }
};

/**
 * Get Monthly Price Summary table and historical drift analytics
 */
exports.getMonthlyPriceSummary = async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { month = currentMonth, search, page = 1, limit = 50 } = req.query;

    const query = { month, productId: { $ne: null } };

    if (search && search.trim()) {
      query.productName = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 50, 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const [items, total, distinctMonths] = await Promise.all([
      CompetitorMonthlySummary.find(query)
        .populate({
          path: 'competitorTrackId',
          select: 'sku currentPrice regularPrice salePrice imageUrl permalink isInStock'
        })
        .populate('productId', 'name price image stock sku')
        .sort({ netMonthlyDriftZar: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CompetitorMonthlySummary.countDocuments(query),
      CompetitorMonthlySummary.distinct('month')
    ]);

    const availableMonths = (distinctMonths.length > 0 ? distinctMonths : [currentMonth]).sort().reverse();

    return res.status(200).json({
      success: true,
      month,
      count: items.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      availableMonths,
      items
    });
  } catch (error) {
    console.error('Error fetching monthly price summary:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve monthly price summary' });
  }
};

/**
 * Manually trigger on-demand sync of Grand Store retail catalog against Norman Goodfellows
 */
exports.triggerManualSync = async (req, res) => {
  try {
    const result = await ngfScraperService.syncGrandStoreRetailProducts();

    return res.status(200).json({
      success: true,
      message: `Completed sync with Norman Goodfellows: ${result.totalRetailProducts} retail products scanned, ${result.matchedCount} matched on NGF, ${result.priceChangeCount} price changes detected.`,
      result
    });
  } catch (error) {
    console.error('Error triggering competitor sync:', error);
    return res.status(500).json({ success: false, message: 'Competitor price synchronization failed: ' + error.message });
  }
};

/**
 * Manually match / link a competitor track product to a Grand Store product
 */
exports.manualMatchProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    const trackItem = await CompetitorPriceTrack.findById(id);
    if (!trackItem) {
      return res.status(404).json({ success: false, message: 'Tracked competitor product not found' });
    }

    if (!productId) {
      // Unlink
      trackItem.matchedProduct = null;
      trackItem.matchedProductName = '';
      trackItem.matchConfidence = 'unmatched';
      trackItem.grandStorePrice = 0;
      trackItem.varianceAmountZar = 0;
      trackItem.variancePercent = 0;
      trackItem.marketPosition = 'unmatched';
      await trackItem.save();
      return res.status(200).json({ success: true, message: 'Product unlinked', item: trackItem });
    }

    const gsProduct = await Product.findById(productId);
    if (!gsProduct) {
      return res.status(404).json({ success: false, message: 'Grand Store product not found' });
    }

    const gsPrice = ngfScraperService.parsePrice(gsProduct.price);
    const variance = gsPrice - trackItem.currentPrice;
    const variancePct = trackItem.currentPrice > 0 ? (variance / trackItem.currentPrice) * 100 : 0;

    let marketPosition = 'price_matched';
    if (!trackItem.isInStock) {
      marketPosition = 'competitor_out_of_stock';
    } else if (variance < -2) {
      marketPosition = 'gs_cheaper';
    } else if (variance > 2) {
      marketPosition = 'gs_expensive';
    }

    trackItem.matchedProduct = gsProduct._id;
    trackItem.matchedProductName = gsProduct.name;
    trackItem.matchConfidence = 'manual_verified';
    trackItem.grandStorePrice = gsPrice;
    trackItem.varianceAmountZar = Math.round(variance * 100) / 100;
    trackItem.variancePercent = Math.round(variancePct * 10) / 10;
    trackItem.marketPosition = marketPosition;

    await trackItem.save();

    return res.status(200).json({
      success: true,
      message: `Successfully linked to "${gsProduct.name}"`,
      item: trackItem
    });
  } catch (error) {
    console.error('Error linking product:', error);
    return res.status(500).json({ success: false, message: 'Failed to link product' });
  }
};
