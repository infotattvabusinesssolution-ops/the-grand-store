const cron = require('node-cron');
const ngfScraperService = require('../services/ngfScraperService');

let cronTask = null;

/**
 * Initializes the automated daily competitor price synchronization cron job.
 * Runs at 06:00 AM South Africa Standard Time (04:00 UTC) every morning.
 */
function initCompetitorPriceCron() {
  if (cronTask) return;

  // Run at 04:00 UTC (06:00 AM SAST) every day
  cronTask = cron.schedule('0 4 * * *', async () => {
    console.log('[COMPETITOR CRON] Triggering scheduled daily retail catalog sync with Norman Goodfellows...');
    try {
      const result = await ngfScraperService.syncGrandStoreRetailProducts();
      console.log(`[COMPETITOR CRON] Completed successfully: ${result.totalRetailProducts} retail products scanned, ${result.matchedCount} matched, ${result.priceChangeCount} price shifts detected.`);
    } catch (err) {
      console.error('[COMPETITOR CRON ERROR] Scheduled sync encountered an issue:', err.message);
    }
  }, {
    timezone: 'Africa/Johannesburg'
  });

  console.log('[COMPETITOR CRON] Daily price intelligence cron worker registered (06:00 SAST)');
}

module.exports = {
  initCompetitorPriceCron
};
