import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
  const context = await browser.newContext({
    viewport: { width: 1528, height: 900 },
    deviceScaleFactor: 1,
  });

  const pageActive = await context.newPage();
  await pageActive.addInitScript(() => {
    sessionStorage.setItem('age_verified', 'true');
    localStorage.setItem('ageVerified', JSON.stringify({ expiry: Date.now() + 100000000 }));
    localStorage.setItem('grand-store-cart', JSON.stringify([
      { id: '6aa51797abb2ed8329593201', quantity: 2, option: 'Standard Bottle' },
      { id: '6aa285c3a7db879f20ce7d80', quantity: 1, option: '750 ML' }
    ]));
  });

  await pageActive.goto('http://localhost:5173/customer/cart', { waitUntil: 'networkidle', timeout: 30000 });
  await pageActive.waitForTimeout(2500);

  const activePath = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/3fdcce57-89d3-4514-88d1-a9120670a924/scratch/cart-active-render.png';
  await pageActive.screenshot({ path: activePath, fullPage: false });
  console.log('Active cart saved to', activePath);
  await pageActive.close();

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
