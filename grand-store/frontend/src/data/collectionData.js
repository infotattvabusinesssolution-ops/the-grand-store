/**
 * Curated SEO Collection definitions directly aligned with Section 5 of the SEO strategy document.
 * Each collection provides authentic editorial guidance, rich meta tags, and automated product filtering.
 */

export const collections = {
  'best-wines-under-300': {
    slug: 'best-wines-under-300',
    title: 'Best South African Wines Under R300',
    seoTitle: 'Best South African Wines Under R300 | Premium Value | The Grand Store',
    metaDescription: 'Discover top-rated South African red and white wines under R300. Expertly curated selection of Pinotage, Chenin Blanc, and Cabernet Sauvignon delivered across South Africa.',
    heroBadge: 'Smart Buyer Choice',
    heroTitle: 'Best South African Wines Under R300',
    heroSubtitle: 'Exceptional craftsmanship from premier Cape terroirs without the premium price tag.',
    editorialIntro: [
      'South Africa represents arguably the finest quality-to-price ratio in the global wine landscape. In the sub-R300 category, Cape winemakers deliver vibrant fruit purity, authentic regional terroir, and remarkable balance that rivals international bottles at twice the price.',
      'When shopping under R300, look for Swartland old-vine Chenin Blanc, Robertson unoaked Chardonnays, and fruit-forward Stellenbosch or Paarl Cabernet and Pinotage blends that offer immediate drinking pleasure alongside food-friendly acidity.'
    ],
    filter: (product) => {
      const isWine = (product.category || product.type || '').toLowerCase().includes('wine');
      const price = parseFloat(String(product.price || '').replace(/[^0-9.]/g, '')) || 0;
      return isWine && price > 0 && price <= 300;
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Collections', path: '/shop' },
      { name: 'Best Under R300', path: '/collections/best-wines-under-300' }
    ]
  },

  'best-wines-under-500': {
    slug: 'best-wines-under-500',
    title: 'Best South African Wines Under R500',
    seoTitle: 'Best Wines Under R500 | Award-Winning Cellar Selections | The Grand Store',
    metaDescription: 'Explore the best wines under R500 in South Africa. Cellar-worthy single-vineyard reds, barrel-fermented whites, and prestige Cap Classique delivered to your door.',
    heroBadge: 'Connoisseur Tier',
    heroTitle: 'Best South African Wines Under R500',
    heroSubtitle: 'The sweet spot of boutique viticulture, barrel maturation, and cellar potential.',
    editorialIntro: [
      'The R300 to R500 price bracket is where South African winemaking reaches international fine-wine territory. At this level, estate winemakers utilize small-batch French oak barrels, hand-harvested low-yield parcels, and extended lees contact to build structure and longevity.',
      'Bottles in this collection represent the pinnacle of Stellenbosch Cabernet Sauvignon, Hemel-en-Aarde Pinot Noir and Chardonnay, and complex Rhône-style blends from old-vine Swartland bush vines.'
    ],
    filter: (product) => {
      const isWine = (product.category || product.type || '').toLowerCase().includes('wine');
      const price = parseFloat(String(product.price || '').replace(/[^0-9.]/g, '')) || 0;
      return isWine && price > 0 && price <= 500;
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Collections', path: '/shop' },
      { name: 'Best Under R500', path: '/collections/best-wines-under-500' }
    ]
  },

  'best-whisky-under-1000': {
    slug: 'best-whisky-under-1000',
    title: 'Best Whisky Under R1,000',
    seoTitle: 'Best Whisky Under R1,000 in South Africa | Single Malts & Blends | The Grand Store',
    metaDescription: 'Find the best whiskies under R1,000 in South Africa. From smoky Islay single malts to rich sherry-cask finishes and smooth high-rye bourbons with fast nationwide delivery.',
    heroBadge: 'Dram Seeker Guide',
    heroTitle: 'Best Whisky Under R1,000',
    heroSubtitle: 'High-character single malts, small-batch bourbons, and refined blends under a grand.',
    editorialIntro: [
      'Finding exceptional whisky under R1,000 no longer means compromising on quality or complexity. Today’s sub-R1,000 portfolio features venerable Scottish single malts, peated island drams, and characterful blended malts aged with consummate skill.',
      'Whether you lean towards peat-smoked Islay fire, Speyside honey and orchard fruit, or the rich dried-fruit complexity of Oloroso sherry maturation, our curated selection highlights bottles that over-deliver on every sip.'
    ],
    filter: (product) => {
      const category = (product.category || product.type || '').toLowerCase();
      const isWhisky = category.includes('whisky') || category.includes('whiskey') || category.includes('bourbon') || category.includes('scotch');
      const price = parseFloat(String(product.price || '').replace(/[^0-9.]/g, '')) || 0;
      return isWhisky && price > 0 && price <= 1000;
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Collections', path: '/shop' },
      { name: 'Best Whisky Under R1,000', path: '/collections/best-whisky-under-1000' }
    ]
  },

  'best-south-african-red-wines': {
    slug: 'best-south-african-red-wines',
    title: 'Top Rated South African Red Wines',
    seoTitle: 'Best South African Red Wines | Stellenbosch & Swartland Reds | The Grand Store',
    metaDescription: 'Shop the best South African red wines online. Featuring acclaimed Cabernet Sauvignon, Pinotage, Syrah, and Cape Bordeaux-style blends from premier wine estates.',
    heroBadge: 'Estate Showcase',
    heroTitle: 'Top Rated South African Red Wines',
    heroSubtitle: 'Bold structure, deep terroir, and timeless craftsmanship from the Cape’s historic vineyards.',
    editorialIntro: [
      'South African red wines command global prestige thanks to deep, ancient decomposed granite and shale soils, cooling Atlantic maritime breezes, and centuries of vinicultural heritage.',
      'From regal Cabernet Sauvignon and velvety Merlot along the Simonsberg slopes, to indigenous, evocative Pinotage and smoky, aromatic Swartland Syrah, explore the standard-bearers of Cape winemaking.'
    ],
    filter: (product) => {
      const text = `${product.name} ${product.category || ''} ${product.subcategory || ''} ${product.type || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
      const isWine = text.includes('wine');
      const isRed = text.includes('red') || text.includes('cabernet') || text.includes('shiraz') || text.includes('syrah') || text.includes('pinotage') || text.includes('merlot');
      return isWine && isRed;
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Collections', path: '/shop' },
      { name: 'Best SA Red Wines', path: '/collections/best-south-african-red-wines' }
    ]
  },

  'best-champagne-celebrations': {
    slug: 'best-champagne-celebrations',
    title: 'Best Champagne & Cap Classique for Celebrations',
    seoTitle: 'Best Champagne & Cap Classique for Celebrations | The Grand Store',
    metaDescription: 'Celebrate life’s milestone moments with our curated collection of authentic French Champagne and South African Méthode Cap Classique (MCC). Fast delivery nationwide.',
    heroBadge: 'Toast in Style',
    heroTitle: 'Champagne & Cap Classique for Celebrations',
    heroSubtitle: 'Effervescent elegance, brioche complexity, and celebratory bubbles for your unforgettable occasions.',
    editorialIntro: [
      'Nothing heralds triumph, celebration, or intimate luxury quite like the pop of a cork. Our celebratory effervescence showcase brings together prestigious French Champagne houses and South Africa’s finest bottle-fermented Méthode Cap Classique (MCC).',
      'Look for extended lees-aged Blanc de Blancs for creamy brioche notes, or crisp Rosé bubbly for lively summer soirees and anniversaries.'
    ],
    filter: (product) => {
      const text = `${product.name} ${product.category || ''} ${product.subcategory || ''} ${product.type || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
      return text.includes('champagne') || text.includes('mcc') || text.includes('cap classique') || text.includes('sparkling');
    },
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Collections', path: '/shop' },
      { name: 'Celebrations', path: '/collections/best-champagne-celebrations' }
    ]
  }
};
