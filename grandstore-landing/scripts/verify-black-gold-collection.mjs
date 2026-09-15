import { chromium } from '@playwright/test';
import path from 'path';

async function verify() {
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

  console.log('Navigating to http://127.0.0.1:4176/#collection...');
  await page.goto('http://127.0.0.1:4176/#collection', { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(1500);

  const section = page.locator('#collection');
  await section.waitFor({ timeout: 10000 });
  
  // Smoothly scroll to the collection
  await page.evaluate(() => {
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'instant' });
    }
  });
  await page.waitForTimeout(1000);

  const screenshotPath = 'C:\\Users\\RITESH\\.gemini\\antigravity-ide\\brain\\540fdd2a-3b10-4994-a7cf-916704e0cfe9\\black-gold-collection.png';
  await section.screenshot({ path: screenshotPath });
  console.log('Captured section screenshot to:', screenshotPath);

  const vpScreenshotPath = 'C:\\Users\\RITESH\\.gemini\\antigravity-ide\\brain\\540fdd2a-3b10-4994-a7cf-916704e0cfe9\\viewport-collection.png';
  await page.screenshot({ path: vpScreenshotPath });
  console.log('Captured viewport screenshot to:', vpScreenshotPath);

  await browser.close();
}

verify().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
