import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";

test("desktop renders the 3D hero and every local product without errors", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A world ofgood taste."
  );
  await expect(page.locator(".bottle-scene")).toHaveClass(/is-ready/, {
    timeout: 20000,
  });
  await expect(page.locator(".product-card")).toHaveCount(6);
  await expect(page.locator(".world-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Pause bottle animation" }).click();
  await expect(
    page.getByRole("button", { name: "Play bottle animation" })
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Rotate bottles right" }).click();
  await page.getByRole("button", { name: "Reset bottle rotation" }).click();
  await fs.mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/desktop-hero.png" });
  await expect(page.locator(".product-card a").first()).toHaveAttribute(
    "href",
    "https://grandstoreglobal.com/product/tshireletso-red-750ml"
  );
  expect(errors).toEqual([]);
});

test("both product carousels work with controls and keyboard", async ({
  page,
}) => {
  await page.goto("/");
  const local = page.locator(".product-track");
  await page
    .getByRole("button", { name: "Next South African products" })
    .click();
  await expect
    .poll(() => local.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(100);
  await page
    .getByRole("button", { name: "Previous South African products" })
    .click();
  await expect
    .poll(() => local.evaluate((el) => el.scrollLeft))
    .toBeLessThan(4);
  await page
    .getByRole("button", { name: "Next international product" })
    .click();
  await expect(page.locator(".world-card.selected h3")).toHaveText(
    "The Macallan 12"
  );
  await page
    .getByRole("button", { name: "Show Hibiki Japanese Harmony" })
    .click();
  await expect(page.locator(".world-card.selected h3")).toHaveText(
    "Hibiki Japanese Harmony"
  );
  await page
    .getByRole("button", { name: "Next international product" })
    .focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".world-card.selected h3")).toHaveText(
    "The Macallan 12"
  );
  for (let i = 0; i < 6; i++)
    await page
      .getByRole("button", { name: "Next international product" })
      .click();
  await expect(page.locator(".world-card.selected h3")).toHaveText(
    "The Macallan 12"
  );
  await page.screenshot({ path: "artifacts/world-carousel.png" });
});

test("all showcase links reach the main store and image files load", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    for (const img of document.images) {
      img.loading = "eager";
    }
    await Promise.all(
      [...document.images].map((img) => img.decode().catch(() => {}))
    );
  });
  const broken = await page
    .locator("img")
    .evaluateAll((images) =>
      images
        .filter((img) => !img.complete || !img.naturalWidth)
        .map((img) => img.src)
    );
  expect(broken).toEqual([]);
  const links = await page
    .locator("a")
    .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href")));
  expect(
    links.every(
      (link) =>
        link.startsWith("#") ||
        new URL(link).origin === "https://grandstoreglobal.com"
    )
  ).toBeTruthy();
  expect(links.filter((link) => link.includes("/product/"))).toHaveLength(12);
});

test("mobile menu, FAQ, and layouts work on small screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" })
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Collection", exact: true })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" })
  ).toHaveCount(0);
  const question = page.getByRole("button", {
    name: "How do I shop a bottle I discover here?",
  });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#faq-0")).toBeVisible();
  await question.click();
  await expect(page.locator("#faq-0")).toBeHidden();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      `overflow at ${width}px`
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: "artifacts/mobile-hero.png" });
});

test("GrandStore dark gold theme and reduced-motion accessibility work even with a light system preference", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pause bottle animation" })
  ).toHaveCount(0);
  await page.evaluate(async () => {
    for (const img of document.images) img.loading = "eager";
    await Promise.all(
      [...document.images].map((img) => img.decode().catch(() => {}))
    );
  });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(12, 13, 11)"
  );
  await expect(page.locator(".hero-actions .button")).toHaveCSS(
    "color",
    "rgb(23, 22, 15)"
  );
  const dark = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    dark.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    }))
  ).toEqual([]);
  await page.screenshot({ path: "artifacts/dark-hero.png" });
});

test("WebGL failure leaves a usable static hero and working store links", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /webgl/i.test(type) ? null : original.call(this, type, ...args);
    };
  });
  await page.goto("/");
  await expect(page.locator(".scene-fallback")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Explore the collection" })
  ).toBeVisible();
  await expect(page.locator(".scene-fallback img").nth(1)).toBeVisible();
});

test('scroll-reveal text remains accessible with full motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('.bottle-scene')).toHaveClass(/is-ready/);
  await page.evaluate(async () => {
    for (const img of document.images) img.loading = 'eager';
    await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
  });
  const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(report.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) }))).toEqual([]);
});
