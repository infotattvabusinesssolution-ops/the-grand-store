import { chromium } from 'playwright';

async function verifyUnifiedNavbar() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1528, height: 732 } });
  await ctx.addInitScript(() => localStorage.setItem('gs_age_verified', 'true'));
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4176/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);

  const basePath = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/f54edd9f-0d14-49e2-8d87-b16da8ede5fb';

  // 1. Initial page load at top
  await page.screenshot({ path: `${basePath}/hero_unified_navbar_initial.png` });

  // 2. Scroll down 450px and capture scrolled state
  await page.evaluate(() => window.scrollTo({ top: 450, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${basePath}/hero_unified_navbar_scrolled.png` });

  await browser.close();
  console.log('Unified navbar verification complete!');
}

verifyUnifiedNavbar().catch(console.error);
