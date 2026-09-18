import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
  const context = await browser.newContext({
    viewport: { width: 1528, height: 732 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  
  await page.addInitScript(() => {
    sessionStorage.setItem('age_verified', 'true');
    localStorage.setItem('ageVerified', JSON.stringify({ expiry: Date.now() + 100000000 }));
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Locate tasting section
  const tastingSection = page.locator('section[aria-labelledby="tasting-title"]');
  await tastingSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  const outputPath = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/3fdcce57-89d3-4514-88d1-a9120670a924/scratch/tasting-render.png';
  
  await tastingSection.screenshot({
    path: outputPath,
  });

  console.log('Tasting screenshot saved to', outputPath);
  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
