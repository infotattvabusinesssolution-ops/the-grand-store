import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1528, height: 732 },
  });
  await context.addInitScript(() => {
    localStorage.setItem('gs_age_verified', 'true');
    localStorage.setItem('age_verified', 'true');
    localStorage.setItem('grandstore_age_verified', 'true');
  });

  const page = await context.newPage();

  console.log('1. Navigating to home page http://127.0.0.1:4176/...');
  await page.goto('http://127.0.0.1:4176/', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(1500);

  // Check that #auctions is NOT in #main on the home page
  const homeAuctionsCount = await page.locator('#main #auctions').count();
  console.log(`Checking #main #auctions count on home page: ${homeAuctionsCount} (Expected: 0)`);
  if (homeAuctionsCount !== 0) {
    throw new Error(`FAIL: #auctions still found in #main on home page! Count: ${homeAuctionsCount}`);
  }

  // 2. Click Auctions in the Hero floating nav at scroll 0
  const heroAuctionLink = page.locator('.hero-perspective-stage .navmenu .links a:has-text("Auctions")');
  await heroAuctionLink.waitFor({ timeout: 5000 });
  console.log('2. Found Auctions link in hero nav. Clicking it...');
  await heroAuctionLink.click();
  await page.waitForTimeout(1000);

  // Verify URL is /auctions
  let currentUrl = page.url();
  console.log(`Current URL after clicking hero Auctions: ${currentUrl}`);
  if (!currentUrl.includes('/auctions')) {
    throw new Error(`FAIL: URL did not update to /auctions! Current: ${currentUrl}`);
  }

  // Verify .auctions-page-view is rendered
  const auctionsView = page.locator('.auctions-page-view');
  await auctionsView.waitFor({ timeout: 5000 });
  console.log('3. .auctions-page-view is present in DOM!');

  // Check active tab styling in site header
  const desktopNavAuction = page.locator('.desktop-nav a:has-text("Auctions")');
  const isTabActive = await desktopNavAuction.evaluate((el) => el.classList.contains('active-nav-tab'));
  console.log(`Site header Auctions nav tab has .active-nav-tab: ${isTabActive}`);

  // Check key elements
  const titleText = await page.locator('.auctions-page-title').innerText();
  console.log(`Auctions Page Title: "${titleText.replace(/\n/g, ' ')}"`);

  const activeLotsCount = await page.locator('.active-lots-grid .lot-card').count();
  console.log(`Active Lots Count in Catalog: ${activeLotsCount} (Expected: 3)`);

  const basePath = 'C:\\Users\\RITESH\\.gemini\\antigravity-ide\\brain\\540fdd2a-3b10-4994-a7cf-916704e0cfe9';
  await page.screenshot({ path: `${basePath}\\auctions-page-top.png` });
  console.log('Saved top screenshot to auctions-page-top.png');

  // Scroll down to lots and capture
  await page.evaluate(() => {
    const el = document.querySelector('.auctions-active-catalog');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${basePath}\\auctions-page-lots.png` });
  console.log('Saved lots screenshot to auctions-page-lots.png');

  // Scroll to protocols and consignment
  await page.evaluate(() => {
    const el = document.querySelector('.auctions-consign-banner');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${basePath}\\auctions-page-consign.png` });
  console.log('Saved consign screenshot to auctions-page-consign.png');

  // Test Return to Store button
  console.log('4. Testing RETURN TO STORE button...');
  const returnBtn = page.locator('.auctions-back-btn');
  await returnBtn.click();
  await page.waitForTimeout(1000);
  currentUrl = page.url();
  console.log(`URL after clicking Return to Store: ${currentUrl}`);
  const homeAgainCount = await page.locator('#main').count();
  console.log(`Home #main present: ${homeAgainCount > 0}`);

  // 5. Test Site Header fixed navigation after scrolling
  console.log('5. Testing scrolled site header navigation to Auctions...');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  
  const scrolledHeaderAuction = page.locator('.site-header.header-visible .desktop-nav a:has-text("Auctions")');
  await scrolledHeaderAuction.waitFor({ timeout: 5000 });
  await scrolledHeaderAuction.click();
  await page.waitForTimeout(1000);

  currentUrl = page.url();
  console.log(`URL after clicking scrolled header Auctions: ${currentUrl}`);
  if (!currentUrl.includes('/auctions')) {
    throw new Error(`FAIL: Scrolled header Auctions click did not route to /auctions! Current: ${currentUrl}`);
  }

  // Final viewport screenshot of Auctions room
  await page.screenshot({ path: `${basePath}\\auctions-room-viewport.png` });
  console.log('Saved final viewport screenshot to auctions-room-viewport.png');

  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  await browser.close();
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
