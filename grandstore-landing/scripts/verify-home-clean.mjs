import { chromium } from '@playwright/test';

async function verifyHome() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    viewport: { width: 1528, height: 732 },
  });
  await context.addInitScript(() => {
    localStorage.setItem('gs_age_verified', 'true');
  });

  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4176/', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Scroll to #experiences then down slightly to show Experiences -> FAQ transition
  await page.evaluate(() => {
    const exp = document.getElementById('experiences');
    if (exp) exp.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(600);

  const basePath = 'C:\\Users\\RITESH\\.gemini\\antigravity-ide\\brain\\540fdd2a-3b10-4994-a7cf-916704e0cfe9';
  await page.screenshot({ path: `${basePath}\\home-experiences-to-faq.png` });

  // Also scroll to FAQ
  await page.evaluate(() => {
    const faq = document.querySelector('.faq');
    if (faq) faq.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${basePath}\\home-faq.png` });

  await browser.close();
}

verifyHome();
