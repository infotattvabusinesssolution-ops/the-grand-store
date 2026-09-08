const { findNearestPostnetStores } = require('../services/postnetLocator');

// @desc    Get PostNet stores for a selected city, or the nearest alternatives
// @route   GET /api/postnet/locator?address=...&city=...&lat=...&lng=...
// @access  Private
const getNearestStores = async (req, res) => {
  try {
    const { address, lat, lng, city, limit } = req.query;
    const searchTarget = (address || city || '').trim();

    if (!searchTarget && (!lat || !lng)) {
      return res.status(400).json({ message: 'Address, city, or coordinates are required' });
    }

    const result = await findNearestPostnetStores({
      address: searchTarget,
      lat,
      lng,
      city,
      limit: Math.max(1, Math.min(20, Number(limit) || 10))
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching PostNet stores:', error);
    res.status(error.statusCode || 502).json({
      message: error.message || 'Failed to retrieve nearest PostNet stores'
    });
  }
};

module.exports = {
  getNearestStores
};
