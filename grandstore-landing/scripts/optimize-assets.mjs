import fs from "node:fs/promises";
import sharp from "sharp";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, "src/catalog.json");
const catalog = JSON.parse(await fs.readFile(file, "utf8"));
for (const product of [...catalog.local, ...catalog.international]) {
  product.imageSmall = product.image.replace(".webp", "-sm.webp");
  await sharp(path.join(root, "public", product.image))
    .resize({ height: 360, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(root, "public", product.imageSmall));
}
await sharp(path.join(root, "public/assets/cape-wineland.png"))
  .resize({ width: 1000 })
  .webp({ quality: 80 })
  .toFile(path.join(root, "public/assets/cape-wineland-sm.webp"));
await sharp(path.join(root, "public/assets/tasting-moments.png"))
  .resize({ width: 800 })
  .webp({ quality: 80 })
  .toFile(path.join(root, "public/assets/tasting-moments-sm.webp"));
await fs.writeFile(file, JSON.stringify(catalog, null, 2) + "\n");
console.log("Responsive image variants generated.");
