# GrandStore landing page

A standalone, responsive landing page in GrandStore's dark and gold brand palette. It links into the existing store at https://grandstoreglobal.com/.

## Run locally

Requires Node.js 22.12+ (tested with Node.js 24).

```sh
npm ci
npm run dev
```

Open http://localhost:5176. To check the production build:

```sh
npm run build
npm run preview
```

The production preview is at http://localhost:4176. Publish the contents of `dist/` to a static host when ready. All fonts, photos, and generated assets are served locally. The landing page needs no API keys or backend environment variables.

## Page and interactions

- Original Three.js wine and spirits composition with floating bottles, gold label textures, studio reflections, drag rotation, rotation buttons, reset, and pause.
- GSAP ScrollTrigger links the bottle rotation to scrolling and adds vineyard parallax and a word-by-word brand-story reveal.
- Motion provides section reveals, spring transitions in the international carousel, and subtle magnetic buttons.
- Six South African products in a horizontally scrollable gallery, with touch, keyboard, and previous/next controls.
- Six international products in a coverflow carousel, with touch, keyboard, previous/next, and individual selection controls.
- Events, wine farms, auctions, about, vendor discovery, FAQ, and footer links route to the existing store.
- The main store supplies current prices, availability, checkout, auction lots, and event dates. The landing page makes no live stock, price, event, or auction claims.
- Responsive layouts down to 320px, a mobile menu with Escape support, visible focus states, a skip link, and reduced-motion support. If WebGL is unavailable, a static composition replaces the canvas.
- The 3D canvas stops rendering while offscreen or while the tab is hidden. Paused/reduced-motion scenes render only when something changes.

## Content updates

`src/catalog.json` contains twelve deliberately selected products and their real product-page links. Product images are copied from the public catalog and optimized to WebP. Refresh the snapshot and images with:

```sh
npm run assets:sync
```

This reads the public GrandStore API and writes local assets. The selections and short display names are in `scripts/sync-catalog.mjs`. Catalog updates do not happen when a visitor opens the page, so this landing page is independent of API CORS and API availability. Rebuild after refreshing.

## Verify

```sh
npm test
```

The Playwright suite covers the 3D hero controls, carousel navigation, all twelve product links, local images, the mobile menu, FAQ, layout overflow at 320/390/768/1024/1440px, reduced motion, axe accessibility, and WebGL failure. On Windows it uses installed Google Chrome. Set `CHROME_PATH` to use a different Chromium executable, or run `npx playwright install chromium` on other systems.

`node scripts/visual-review.mjs` captures desktop, mobile, and section screenshots to `artifacts/`. It uses the local dev server and installed Chrome on Windows; set `CHROME_PATH` on other systems. These development artifacts are ignored by Git.

With the production preview running, `npm run audit` runs Lighthouse against port 4176. Results are saved to `artifacts/lighthouse-desktop.json`. The audit uses headless Chromium with software WebGL, so its performance figures are a local lab measurement, not a guarantee for live devices or hosting.

## Design and assets

The final direction is a dark luxury drinks gallery with GrandStore's existing gold identity. Cormorant Garamond carries the wine-label heritage, paired with Manrope for navigation and body copy. Product and editorial images have square corners; buttons are pill-shaped; icon controls are circular.

Motion is divided between isolated components so Three.js/GSAP and Motion do not animate the same DOM properties. There is no scroll hijacking. All sections remain normally scrollable.

References: [ThreeUI](https://threeui.com/browse), [Taste Skill](https://github.com/Leonxlnx/taste-skill), [Three.js](https://threejs.org/docs/), [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), [Motion](https://motion.dev/docs/react).

The Three.js scene and carousel implementation are original, inspired by the reference's interactive product showcases. No paid ThreeUI components are bundled. The supplied Taste Skill is retained in `references/TASTE-SKILL.md`. The final design applies the user's dark/gold preference over that skill's default palette and theme suggestions.

See [ASSETS.md](ASSETS.md) for generated artwork paths, prompts, and provenance. The generated vineyard and tasting photos are conceptual editorial artwork, not photographs documenting a particular estate or scheduled event. Product photography comes from the actual store catalog. The bottles in the 3D hero are illustrative GrandStore-branded sculptures, not product listings.

Before public deployment, set the `og:image` in `index.html` to the absolute URL of this landing page's deployed asset and add the landing page's own canonical URL. These are intentionally not set to the main store's domain because the standalone page's deployment domain has not been specified.
