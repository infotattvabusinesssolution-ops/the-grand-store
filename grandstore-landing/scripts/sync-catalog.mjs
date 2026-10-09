import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const selections = {
  local: [
    ["tshireletso-red-750ml", "Tshireletso Red", "A taste of home"],
    ["inverroche-strata-750ml", "Inverroche Strata", "Cape craft gin"],
    [
      "queen-mother-mathokoana-mopeli-chardonnay-750ml",
      "Queen Mother Chardonnay",
      "South African wine",
    ],
    ["six-dogs-xo-pot-still-brandy-750ml", "Six Dogs XO", "Pot still brandy"],
    [
      "metanoia-klein-karoo-single-malt-whisky-750ml",
      "Metanoia Klein Karoo",
      "Single malt whisky",
    ],
    ["inzalo-batch-one-agave-spirit-750ml", "Inzalo Batch One", "Agave spirit"],
  ],
  international: [
    [
      "dom-perignon-luminous-750ml",
      "Dom Pérignon Luminous",
      "French champagne",
    ],
    [
      "macallan-12-year-old-double-cask-750ml",
      "The Macallan 12",
      "Double cask whisky",
    ],
    [
      "hibiki-japanese-harmony-whisky-750ml-1",
      "Hibiki Japanese Harmony",
      "Japanese whisky",
    ],
    ["don-julio-1942-750ml", "Don Julio 1942", "Mexican tequila"],
    ["hennessy-xo-cognac-750ml", "Hennessy XO", "French cognac"],
    ["flor-de-cana-18-year-old-750ml", "Flor de Caña 18", "Nicaraguan rum"],
  ],
};

const response = process.argv.includes("--local")
  ? JSON.parse(
      await fs.readFile(path.join(root, "references/catalog.json"), "utf8")
    )
  : await (
      await fetch("https://api.grandstoreglobal.com/api/products", {
        signal: AbortSignal.timeout(20000),
      })
    ).json();
if (!Array.isArray(response))
  throw new Error("Expected an array from GrandStore catalog");
await fs.mkdir(path.join(root, "public/assets/products"), { recursive: true });
const allInternationalCountries = [
  ...new Set(
    response
      .map((item) => item.country)
      .filter((country) => country && country.toLowerCase() !== "south africa")
  ),
].sort();
const data = {
  internationalHref: `https://grandstoreglobal.com/shop?${new URLSearchParams(
    allInternationalCountries.map((country) => ["country", country])
  )}`,
  localHref: "https://grandstore.co.za/shop?country=South%20Africa",
};
for (const [collection, picks] of Object.entries(selections)) {
  data[collection] = [];
  for (const [slug, displayName, note] of picks) {
    const product = response.find((item) => item.slug === slug);
    if (!product) throw new Error(`Product missing from catalog: ${slug}`);
    const imageUrl = new URL(product.image, "https://api.grandstoreglobal.com")
      .href;
    const file = `/assets/products/${slug}.webp`;
    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30000),
    });
    if (!imageResponse.ok)
      throw new Error(`Image ${slug}: ${imageResponse.status}`);
    await sharp(Buffer.from(await imageResponse.arrayBuffer()))
      .trim({ threshold: 15 })
      .resize({
        height: 720,
        width: 500,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(path.join(root, "public", file));
    const baseStore =
      collection === "local"
        ? "https://grandstore.co.za"
        : "https://grandstoreglobal.com";
    data[collection].push({
      id: product._id,
      slug,
      name: product.name,
      displayName,
      note,
      country: product.country,
      category: product.category,
      size: product.size || "750ml",
      image: file,
      sourceImage: imageUrl,
      href: `${baseStore}/product/${encodeURIComponent(slug)}`,
    });
    console.log(`Saved ${collection}: ${displayName}`);
  }
}
await fs.writeFile(
  path.join(root, "src/catalog.json"),
  JSON.stringify(data, null, 2) + "\n"
);
console.log(
  "Saved 12 real products. Prices and availability are shown on the live store."
);
