import { chromium } from 'playwright';

async function verifyFooter() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1528, height: 732 } });
  await ctx.addInitScript(() => localStorage.setItem('gs_age_verified', 'true'));
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4176/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);

  const basePath = 'C:/Users/RITESH/.gemini/antigravity-ide/brain/f54edd9f-0d14-49e2-8d87-b16da8ede5fb';

  // 1. Screenshot showing Sticky Social Dock on the side
  await page.screenshot({ path: `${basePath}/sticky_social_dock_verified.png` });

  // 2. Scroll to footer and capture footer
  const footerEl = await page.$('#footer');
  if (footerEl) {
    await footerEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${basePath}/footer_verified.png` });
  }

  // 3. Click Privacy & Cookies Policy button in footer
  const privacyBtn = page.locator('text=Privacy & Cookies Policy').first();
  if (await privacyBtn.count() > 0) {
    await privacyBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${basePath}/legal_modal_privacy_verified.png` });
  }

  // 4. Click Terms & Conditions in modal tabs
  const termsTab = page.locator('.legal-tab-btn', { hasText: 'Terms & Conditions' }).first();
  if (await termsTab.count() > 0) {
    await termsTab.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${basePath}/legal_modal_terms_verified.png` });
  }

  await browser.close();
  console.log('All footer and legal modal captures complete!');
}

verifyFooter().catch(console.error);
