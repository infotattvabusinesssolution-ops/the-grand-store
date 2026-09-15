import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1528, height: 732 }
  });
  const page = await context.newPage();

  console.log('Opening http://localhost:4176...');
  await page.goto('http://localhost:4176', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const storySection = page.locator('#our-story');
  await storySection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  // Take screenshot of the compact, rich about section
  await page.screenshot({
    path: 'C:/Users/RITESH/.gemini/antigravity-ide/brain/540fdd2a-3b10-4994-a7cf-916704e0cfe9/compact-about-viewport.png'
  });
  console.log('Saved compact-about-viewport.png');

  // Element screenshot of just the section
  await storySection.screenshot({
    path: 'C:/Users/RITESH/.gemini/antigravity-ide/brain/540fdd2a-3b10-4994-a7cf-916704e0cfe9/compact-about-section.png'
  });
  console.log('Saved compact-about-section.png');

  // Test READ MORE internal navigation
  const readMoreBtn = page.locator('#about-read-more-btn');
  console.log('Clicking READ MORE button...');
  await readMoreBtn.click();
  await page.waitForTimeout(1000);

  console.log('Current page URL:', page.url());
  await page.screenshot({
    path: 'C:/Users/RITESH/.gemini/antigravity-ide/brain/540fdd2a-3b10-4994-a7cf-916704e0cfe9/about-page-view.png'
  });
  console.log('Saved about-page-view.png');

  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
