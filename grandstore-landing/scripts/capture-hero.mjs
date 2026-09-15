import { chromium } from '@playwright/test';

async function captureHero() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  const basePath = 'C:\\Users\\RITESH\\.gemini\\antigravity-ide\\brain\\540fdd2a-3b10-4994-a7cf-916704e0cfe9';

  // 1. User's exact viewport (1526x650)
  const ctx1 = await browser.newContext({ viewport: { width: 1526, height: 650 } });
  await ctx1.addInitScript(() => localStorage.setItem('gs_age_verified', 'true'));
  const page1 = await ctx1.newPage();
  await page1.goto('http://127.0.0.1:4176/', { waitUntil: 'networkidle' });
  await page1.waitForTimeout(1600);
  await page1.screenshot({ path: `${basePath}\\hero-fixed-1526x650.png` });
  await ctx1.close();

  // 2. Standard 1528x732 viewport
  const ctx2 = await browser.newContext({ viewport: { width: 1528, height: 732 } });
  await ctx2.addInitScript(() => localStorage.setItem('gs_age_verified', 'true'));
  const page2 = await ctx2.newPage();
  await page2.goto('http://127.0.0.1:4176/', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(1600);
  await page2.screenshot({ path: `${basePath}\\hero-fixed-1528x732.png` });
  await ctx2.close();

  // 3. Mobile viewport (390x844)
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx3.addInitScript(() => localStorage.setItem('gs_age_verified', 'true'));
  const page3 = await ctx3.newPage();
  await page3.goto('http://127.0.0.1:4176/', { waitUntil: 'networkidle' });
  await page3.waitForTimeout(1600);
  await page3.screenshot({ path: `${basePath}\\hero-fixed-mobile.png` });
  await ctx3.close();

  await browser.close();
  console.log('Screenshots captured successfully');
}

captureHero();
