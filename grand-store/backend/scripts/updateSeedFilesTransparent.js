const fs = require('fs');
const path = require('path');

const urlReplacements = [
  // Fenjiu Qinghua 20
  {
    regex: /https:\/\/res\.cloudinary\.com\/oioqrgj0\/image\/upload\/(?:v\d+\/)?grandstore-uploads\/products\/baijiu\/fenjiu-qinghua-20-year-old\.jpg/g,
    replacement: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658955/grand-store/catalog-originals/baijiu/fenjiu-qinghua-20-year-old.png'
  },
  // Fen Jiu Red Label
  {
    regex: /https:\/\/res\.cloudinary\.com\/oioqrgj0\/image\/upload\/(?:v\d+\/)?grandstore-uploads\/products\/baijiu\/fen-jiu-red-label-fen-chiew\.jpg/g,
    replacement: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658959/grand-store/catalog-originals/baijiu/fen-jiu-red-label-fen-chiew.png'
  },
  // Guizhou XIJIU
  {
    regex: /https:\/\/res\.cloudinary\.com\/oioqrgj0\/image\/upload\/(?:v\d+\/)?grandstore-uploads\/products\/baijiu\/guizhou-xijiu-friends-series-blue-bottle\.jpg/g,
    replacement: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658967/grand-store/catalog-originals/baijiu/guizhou-xijiu-friends-series-blue-bottle.png'
  },
  // Gekkeikan Traditional
  {
    regex: /https:\/\/res\.cloudinary\.com\/oioqrgj0\/image\/upload\/(?:v\d+\/)?grandstore-uploads\/products\/sake\/gekkeikan-traditional-junmai-sake-720ml\.jpg/g,
    replacement: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658970/grand-store/catalog-originals/sake/gekkeikan-traditional-junmai-sake-720ml.png'
  },
  // Dassai 45
  {
    regex: /https:\/\/res\.cloudinary\.com\/oioqrgj0\/image\/upload\/(?:v\d+\/)?grandstore-uploads\/products\/sake\/dassai-45-junmai-daiginjo-sake-720ml\.jpg/g,
    replacement: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658974/grand-store/catalog-originals/sake/dassai-45-junmai-daiginjo-sake-720ml.png'
  },
  // Gold Gekkeikan
  {
    regex: /https:\/\/res\.cloudinary\.com\/oioqrgj0\/image\/upload\/(?:v\d+\/)?grandstore-uploads\/products\/sake\/gold-gekkeikan-junmai-sake-with-gold-leaf-720ml\.jpg/g,
    replacement: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658977/grand-store/catalog-originals/sake/gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.png'
  },
  // Super Kinokuni
  {
    regex: /https:\/\/res\.cloudinary\.com\/oioqrgj0\/image\/upload\/(?:v\d+\/)?grandstore-uploads\/products\/sake\/super-kinokuni-junmai-sake-720ml\.jpg/g,
    replacement: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658980/grand-store/catalog-originals/sake/super-kinokuni-junmai-sake-720ml.png'
  },
  // Dassai 23
  {
    regex: /https:\/\/res\.cloudinary\.com\/oioqrgj0\/image\/upload\/(?:v\d+\/)?grandstore-uploads\/products\/sake\/dassai-23-junmai-daiginjo-super-premium-sake-720ml\.jpg/g,
    replacement: 'https://res.cloudinary.com/oioqrgj0/image/upload/e_background_removal/c_limit,h_1600,w_1200/v1792658983/grand-store/catalog-originals/sake/dassai-23-junmai-daiginjo-super-premium-sake-720ml.png'
  }
];

const filesToUpdate = [
  path.resolve(__dirname, 'seedRetailProductsWhiskyshop.js'),
  path.resolve(__dirname, 'seedAllWhiskyshopAndMosi.js'),
  path.resolve(__dirname, 'update_sake_products.js')
];

filesToUpdate.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let matchCount = 0;
  urlReplacements.forEach(({ regex, replacement }) => {
    const matches = content.match(regex);
    if (matches) {
      matchCount += matches.length;
      content = content.replace(regex, replacement);
    }
  });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${path.basename(filePath)}: replaced ${matchCount} occurrences.`);
});
