import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1528, height: 732 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll to about section
  const aboutSection = page.locator('#our-story');
  await aboutSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Take screenshot of the about section in viewport
  await page.screenshot({
    path: 'C:/Users/RITESH/.gemini/antigravity-ide/brain/540fdd2a-3b10-4994-a7cf-916704e0cfe9/about-section-viewport.png',
  });
  console.log('Saved about-section-viewport.png');

  // Also take element screenshot of our-story
  await aboutSection.screenshot({
    path: 'C:/Users/RITESH/.gemini/antigravity-ide/brain/540fdd2a-3b10-4994-a7cf-916704e0cfe9/about-section-element.png',
  });
  console.log('Saved about-section-element.png');

  // Test internal routing: Click READ MORE button
  const readMoreBtn = page.locator('#about-read-more-btn');
  console.log('Clicking READ MORE button...');
  await readMoreBtn.click();
  await page.waitForTimeout(1000);

  const currentUrl = page.url();
  console.log('Current URL after click:', currentUrl);

  // Take screenshot of the routed About page
  await page.screenshot({
    path: 'C:/Users/RITESH/.gemini/antigravity-ide/brain/540fdd2a-3b10-4994-a7cf-916704e0cfe9/about-page-routed.png',
  });
  console.log('Saved about-page-routed.png');

  // Click Back to Home
  const backBtn = page.locator('.about-back-btn');
  await backBtn.click();
  await page.waitForTimeout(1000);
  console.log('Back to home URL:', page.url());

  await browser.close();
}

verify().catch(console.error);
