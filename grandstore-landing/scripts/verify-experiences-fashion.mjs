import { chromium } from 'playwright';

async function verify() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1528, height: 860 },
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:4176/#experiences...');
  await page.goto('http://localhost:4176/#experiences', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const expSection = page.locator('#experiences');
  await expSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);

  const outDir = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/f54edd9f-0d14-49e2-8d87-b16da8ede5fb';

  await expSection.screenshot({
    path: `${outDir}/experiences_fashion_spread.png`,
  });
  console.log('Saved experiences_fashion_spread.png');

  await page.screenshot({
    path: `${outDir}/experiences_viewport.png`,
  });
  console.log('Saved experiences_viewport.png');

  await browser.close();
}

verify().catch(console.error);
