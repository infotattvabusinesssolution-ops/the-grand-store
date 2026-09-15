import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1528, height: 860 },
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:4176/about...');
  await page.goto('http://localhost:4176/about', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const outDir = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/f54edd9f-0d14-49e2-8d87-b16da8ede5fb';
  await page.screenshot({
    path: `${outDir}/about_page_current.png`,
    fullPage: true,
  });
  console.log('Saved about_page_current.png');

  await browser.close();
}

capture().catch(console.error);
