import { chromium } from 'playwright';

async function verifyHero() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1528, height: 732 } });
  await ctx.addInitScript(() => localStorage.setItem('gs_age_verified', 'true'));
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4176/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);

  const basePath = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/f54edd9f-0d14-49e2-8d87-b16da8ede5fb';

  // 1. Initial Hero with Slide 1 - actions shifted up, slide indicators removed
  await page.screenshot({ path: `${basePath}/hero_shifted_up_verified.png` });

  // 2. Wait 5.6s to observe transition to next slide
  await page.waitForTimeout(5600);
  await page.screenshot({ path: `${basePath}/hero_shifted_up_slide2_verified.png` });

  await browser.close();
  console.log('Hero shifted up verification complete!');
}

verifyHero().catch(console.error);
